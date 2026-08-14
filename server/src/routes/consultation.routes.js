import { Router } from "express";
import { Consultation, Appointment, Prescription, Doctor } from "../models/Doctor.js";
import { Medication } from "../models/Medication.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();
router.use(requireAuth);

// Doctor/patient authorization check: only the appointment's two parties (or admin) may touch a consultation
async function authorizeConsultation(req, res, next) {
  try {
    const consultation = await Consultation.findById(req.params.consultationId)
      .populate("doctor")
      .populate("patient", "fullName email phone");
    if (!consultation) return res.status(404).json({ error: "Consultation not found" });
    const isPatient = consultation.patient.toString() === req.user._id.toString();
    const isDoctor = consultation.doctor.user?.toString() === req.user._id.toString();
    if (!isPatient && !isDoctor && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized for this consultation" });
    }
    req.consultation = consultation;
    next();
  } catch (err) {
    next(err);
  }
}

router.post("/start/:appointmentId", async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    let consultation = await Consultation.findOne({ appointment: appt._id });
    if (!consultation) {
      consultation = await Consultation.create({
        appointment: appt._id, patient: appt.patient, doctor: appt.doctor,
        startedAt: new Date(), status: "in_progress",
      });
    } else {
      consultation.status = "in_progress";
      consultation.startedAt = consultation.startedAt || new Date();
      await consultation.save();
    }
    res.json({ consultation });
  } catch (err) {
    next(err);
  }
});

router.get("/:consultationId", authorizeConsultation, async (req, res) => {
  res.json({ consultation: req.consultation });
});

router.put("/:consultationId", authorizeConsultation, async (req, res, next) => {
  try {
    const allowed = ["symptoms", "vitalsSnapshot", "assessment", "diagnosis", "doctorNotes", "followUp"];
    allowed.forEach((k) => { if (k in req.body) req.consultation[k] = req.body[k]; });
    await req.consultation.save();
    res.json({ consultation: req.consultation });
  } catch (err) {
    next(err);
  }
});

router.post("/:consultationId/chat", authorizeConsultation, async (req, res, next) => {
  try {
    const { message } = req.body;
    req.consultation.chatLog.push({ sender: req.user._id, message, sentAt: new Date() });
    await req.consultation.save();
    res.json({ chatLog: req.consultation.chatLog });
  } catch (err) {
    next(err);
  }
});

router.put("/:consultationId/end", authorizeConsultation, async (req, res, next) => {
  try {
    req.consultation.status = "completed";
    req.consultation.endedAt = new Date();
    await req.consultation.save();
    await Appointment.findByIdAndUpdate(req.consultation.appointment, { status: "completed" });
    await logAudit(req, { action: "consultation.completed", resourceType: "Consultation", resourceId: req.consultation._id });
    res.json({ consultation: req.consultation });
  } catch (err) {
    next(err);
  }
});

// Doctor's own patient roster, derived from their appointment history
router.get("/doctor/mine/patients", requireRole("doctor"), async (req, res, next) => {
  try {
    const doctorProfile = await Doctor.findOne({ user: req.user._id });
    if (!doctorProfile) return res.json({ patients: [] });

    const appts = await Appointment.find({ doctor: doctorProfile._id })
      .populate("patient", "fullName email phone")
      .sort({ scheduledStart: -1 });

    const byPatient = new Map();
    for (const a of appts) {
      if (!a.patient) continue;
      const key = a.patient._id.toString();
      if (!byPatient.has(key)) {
        byPatient.set(key, {
          patient: a.patient,
          visitCount: 0,
          completedCount: 0,
          lastVisit: a.scheduledStart,
          nextUpcoming: null,
        });
      }
      const entry = byPatient.get(key);
      entry.visitCount += 1;
      if (a.status === "completed") entry.completedCount += 1;
      if (["booked", "confirmed", "rescheduled"].includes(a.status) && new Date(a.scheduledStart) > new Date()) {
        if (!entry.nextUpcoming || new Date(a.scheduledStart) < new Date(entry.nextUpcoming)) {
          entry.nextUpcoming = a.scheduledStart;
        }
      }
    }

    res.json({ patients: Array.from(byPatient.values()) });
  } catch (err) {
    next(err);
  }
});

// Patient's full visit history — patient sees own; admin sees all;
// a doctor only sees patients they've actually had an appointment with.
router.get("/patient/:patientId/history", async (req, res, next) => {
  try {
    const isSelf = req.params.patientId === req.user._id.toString();
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    let isTreatingDoctor = false;
    if (req.user.role === "doctor" && !isSelf && !isAdmin) {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (doctorProfile) {
        isTreatingDoctor = !!(await Appointment.findOne({ doctor: doctorProfile._id, patient: req.params.patientId }));
      }
    }
    if (!isSelf && !isAdmin && !isTreatingDoctor) {
      return res.status(403).json({ error: "Access denied" });
    }
    const visits = await Consultation.find({ patient: req.params.patientId, status: "completed" })
      .populate({ path: "doctor", populate: { path: "user", select: "fullName" } })
      .sort({ endedAt: -1 });
    res.json({ visits });
  } catch (err) {
    next(err);
  }
});

// Prescription -> becomes patient medication + schedule
router.post("/:consultationId/prescribe", authorizeConsultation, async (req, res, next) => {
  try {
    const { items, refillsAllowed, documentUrl } = req.body; // items: [{medicationName, dose, frequency, durationDays, instructions}]
    if (!items?.length) return res.status(400).json({ error: "At least one prescription item required" });

    const prescription = await Prescription.create({
      consultation: req.consultation._id, patient: req.consultation.patient, doctor: req.consultation.doctor,
      items, refillsAllowed, documentUrl,
    });

    // Flow: prescription -> patient medication -> schedule -> reminder -> adherence
    const created = [];
    for (const item of items) {
      const med = await Medication.create({
        patient: req.consultation.patient, name: item.medicationName, dose: item.dose,
        frequency: item.frequency, times: item.times || ["08:00"],
        prescriptionSource: "prescription", prescription: prescription._id,
        prescribingDoctor: req.consultation.doctor,
        endDate: item.durationDays ? new Date(Date.now() + item.durationDays * 86400000) : undefined,
        refillsRemaining: refillsAllowed || 0,
      });
      created.push(med);
    }

    await logAudit(req, { action: "prescription.created", resourceType: "Prescription", resourceId: prescription._id });
    res.status(201).json({ prescription, medications: created });
  } catch (err) {
    next(err);
  }
});

export default router;
