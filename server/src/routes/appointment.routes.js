import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { Appointment, Doctor } from "../models/Doctor.js";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();
router.use(requireAuth);

router.get("/mine", async (req, res, next) => {
  try {
    const asPatient = req.user.role === "patient"
      ? await Appointment.find({ patient: req.user._id }).populate({ path: "doctor", populate: { path: "user", select: "fullName" } }).sort({ scheduledStart: -1 })
      : [];
    let asDoctor = [];
    if (req.user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (doctorProfile) {
        asDoctor = await Appointment.find({ doctor: doctorProfile._id }).populate("patient", "fullName phone").sort({ scheduledStart: -1 });
      }
    }
    res.json({ appointments: [...asPatient, ...asDoctor] });
  } catch (err) {
    next(err);
  }
});

router.get("/:appointmentId", async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId)
      .populate("patient", "fullName email phone")
      .populate({ path: "doctor", populate: { path: "user", select: "fullName" } });
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    const isPatient = appt.patient._id.toString() === req.user._id.toString();
    const isDoctor = appt.doctor.user?._id?.toString() === req.user._id.toString();
    if (!isPatient && !isDoctor && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { doctorId, start, end, reasonForVisit } = req.body;
    if (!doctorId || !start || !end) return res.status(400).json({ error: "doctorId, start, end are required" });

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const scheduledStart = new Date(start);
    const scheduledEnd = new Date(end);

    // Double-booking protection: atomic check via unique-ish query then create
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      status: { $in: ["booked", "confirmed"] },
      scheduledStart: { $lt: scheduledEnd },
      scheduledEnd: { $gt: scheduledStart },
    });
    if (conflict) return res.status(409).json({ error: "That slot was just booked. Please pick another." });

    const appointment = await Appointment.create({
      patient: req.user._id, doctor: doctorId, scheduledStart, scheduledEnd,
      reasonForVisit, fee: doctor.consultationFee, consultRoomId: uuidv4(),
    });

    await Notification.create({
      user: req.user._id, channel: "sms", type: "appointment_reminder",
      title: "Appointment booked",
      body: `Your appointment with Dr. ${doctor.specialty} is confirmed for ${scheduledStart.toLocaleString()}.`,
      scheduledFor: new Date(scheduledStart.getTime() - 30 * 60 * 1000),
    });

    await logAudit(req, { action: "appointment.booked", resourceType: "Appointment", resourceId: appointment._id });
    res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
});

router.put("/:appointmentId/reschedule", async (req, res, next) => {
  try {
    const { start, end } = req.body;
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    if (appt.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const scheduledStart = new Date(start), scheduledEnd = new Date(end);
    const conflict = await Appointment.findOne({
      _id: { $ne: appt._id }, doctor: appt.doctor, status: { $in: ["booked", "confirmed"] },
      scheduledStart: { $lt: scheduledEnd }, scheduledEnd: { $gt: scheduledStart },
    });
    if (conflict) return res.status(409).json({ error: "That slot is unavailable." });

    appt.scheduledStart = scheduledStart; appt.scheduledEnd = scheduledEnd; appt.status = "rescheduled";
    await appt.save();
    res.json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

router.put("/:appointmentId/cancel", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    if (appt.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    appt.status = "cancelled"; appt.cancelledBy = req.user._id; appt.cancelReason = reason;
    await appt.save();
    await logAudit(req, { action: "appointment.cancelled", resourceType: "Appointment", resourceId: appt._id });
    res.json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

router.put("/:appointmentId/complete", async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    appt.status = "completed";
    await appt.save();
    res.json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

router.put("/:appointmentId/no-show", async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    appt.status = "no_show";
    await appt.save();
    res.json({ appointment: appt });
  } catch (err) {
    next(err);
  }
});

export default router;
