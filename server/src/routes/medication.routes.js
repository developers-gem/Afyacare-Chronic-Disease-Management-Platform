import { Router } from "express";
import { Medication, MedicationDose } from "../models/Medication.js";
import { requireAuth } from "../middleware/auth.js";
import { requireConsentScope } from "../middleware/consent.js";
import { logAudit } from "../middleware/audit.js";
import { calculateAdherence } from "../utils/adherence.js";

const router = Router();
router.use(requireAuth);

router.get("/:patientId", requireConsentScope("medications", "patientId"), async (req, res, next) => {
  try {
    const meds = await Medication.find({ patient: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ medications: meds });
  } catch (err) {
    next(err);
  }
});

router.post("/:patientId", requireConsentScope("medications", "patientId"), async (req, res, next) => {
  try {
    const { name, dose, condition, frequency, times, startDate, endDate, refillsRemaining } = req.body;
    if (!name || !dose || !frequency) return res.status(400).json({ error: "name, dose, frequency are required" });
    const med = await Medication.create({
      patient: req.params.patientId, name, dose, condition, frequency, times, startDate, endDate, refillsRemaining,
    });
    await logAudit(req, { action: "medication.created", resourceType: "Medication", resourceId: med._id });
    res.status(201).json({ medication: med });
  } catch (err) {
    next(err);
  }
});

router.put("/item/:medId", async (req, res, next) => {
  try {
    const med = await Medication.findById(req.params.medId);
    if (!med) return res.status(404).json({ error: "Medication not found" });
    if (med.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const allowed = ["name", "dose", "condition", "frequency", "times", "endDate", "isActive", "refillsRemaining", "interactionsNote"];
    allowed.forEach((k) => { if (k in req.body) med[k] = req.body[k]; });
    await med.save();
    await logAudit(req, { action: "medication.updated", resourceType: "Medication", resourceId: med._id });
    res.json({ medication: med });
  } catch (err) {
    next(err);
  }
});

router.delete("/item/:medId", async (req, res, next) => {
  try {
    const med = await Medication.findById(req.params.medId);
    if (!med) return res.status(404).json({ error: "Medication not found" });
    if (med.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    med.isActive = false;
    await med.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Today's schedule (dose instances) for a patient
router.get("/:patientId/schedule/today", requireConsentScope("medications", "patientId"), async (req, res, next) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const doses = await MedicationDose.find({
      patient: req.params.patientId, scheduledFor: { $gte: start, $lte: end },
    }).populate("medication").sort({ scheduledFor: 1 });
    res.json({ doses });
  } catch (err) {
    next(err);
  }
});

router.put("/dose/:doseId", async (req, res, next) => {
  try {
    const { status } = req.body; // taken | missed | skipped
    if (!["taken", "missed", "skipped"].includes(status)) {
      return res.status(400).json({ error: "status must be taken, missed, or skipped" });
    }
    const dose = await MedicationDose.findById(req.params.doseId);
    if (!dose) return res.status(404).json({ error: "Dose not found" });
    if (dose.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    dose.status = status;
    if (status === "taken") dose.takenAt = new Date();
    await dose.save();
    await logAudit(req, { action: `medication.dose.${status}`, resourceType: "MedicationDose", resourceId: dose._id });
    res.json({ dose });
  } catch (err) {
    next(err);
  }
});

router.get("/:patientId/adherence", requireConsentScope("medications", "patientId"), async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    const result = await calculateAdherence(req.params.patientId, { days });
    res.json({ adherence: result });
  } catch (err) {
    next(err);
  }
});

export default router;
