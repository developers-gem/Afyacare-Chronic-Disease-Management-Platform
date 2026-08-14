import { Router } from "express";
import BpReading from "../models/BpReading.js";
import { requireAuth } from "../middleware/auth.js";
import { requireConsentScope } from "../middleware/consent.js";
import { logAudit } from "../middleware/audit.js";
import { evaluateBpReading } from "../utils/riskEngine.js";

const router = Router();
router.use(requireAuth);

router.get("/:patientId", requireConsentScope("bpReadings", "patientId"), async (req, res, next) => {
  try {
    const { days = 14, limit = 100 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const readings = await BpReading.find({ patient: req.params.patientId, measuredAt: { $gte: since } })
      .sort({ measuredAt: -1 })
      .limit(Number(limit));
    res.json({ readings });
  } catch (err) {
    next(err);
  }
});

router.post("/:patientId", requireConsentScope("bpReadings", "patientId"), async (req, res, next) => {
  try {
    const { systolic, diastolic, pulse, measuredAt, source, notes } = req.body;
    if (!systolic || !diastolic) return res.status(400).json({ error: "systolic and diastolic are required" });

    const reading = await BpReading.create({
      patient: req.params.patientId, systolic, diastolic, pulse, measuredAt, source, notes,
    });
    await evaluateBpReading(reading);
    await logAudit(req, { action: "vitals.bp.created", resourceType: "BpReading", resourceId: reading._id });
    res.status(201).json({ reading });
  } catch (err) {
    next(err);
  }
});

router.put("/reading/:readingId", async (req, res, next) => {
  try {
    const reading = await BpReading.findById(req.params.readingId);
    if (!reading) return res.status(404).json({ error: "Reading not found" });
    if (reading.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    ["systolic", "diastolic", "pulse", "notes", "measuredAt"].forEach((k) => {
      if (k in req.body) reading[k] = req.body[k];
    });
    await reading.save();
    await evaluateBpReading(reading);
    res.json({ reading });
  } catch (err) {
    next(err);
  }
});

router.delete("/reading/:readingId", async (req, res, next) => {
  try {
    const reading = await BpReading.findById(req.params.readingId);
    if (!reading) return res.status(404).json({ error: "Reading not found" });
    if (reading.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    await reading.deleteOne();
    await logAudit(req, { action: "vitals.bp.deleted", resourceType: "BpReading", resourceId: req.params.readingId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
