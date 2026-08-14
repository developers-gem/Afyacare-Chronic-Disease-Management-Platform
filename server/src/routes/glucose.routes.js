import { Router } from "express";
import GlucoseReading from "../models/GlucoseReading.js";
import { requireAuth } from "../middleware/auth.js";
import { requireConsentScope } from "../middleware/consent.js";
import { logAudit } from "../middleware/audit.js";
import { evaluateGlucoseReading } from "../utils/riskEngine.js";

const router = Router();
router.use(requireAuth);

router.get("/:patientId", requireConsentScope("glucoseReadings", "patientId"), async (req, res, next) => {
  try {
    const { days = 14, limit = 100 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const readings = await GlucoseReading.find({ patient: req.params.patientId, measuredAt: { $gte: since } })
      .sort({ measuredAt: -1 })
      .limit(Number(limit));
    res.json({ readings });
  } catch (err) {
    next(err);
  }
});

router.post("/:patientId", requireConsentScope("glucoseReadings", "patientId"), async (req, res, next) => {
  try {
    const { value, context, measuredAt, notes } = req.body;
    if (!value) return res.status(400).json({ error: "value is required" });
    const reading = await GlucoseReading.create({ patient: req.params.patientId, value, context, measuredAt, notes });
    await evaluateGlucoseReading(reading);
    await logAudit(req, { action: "vitals.glucose.created", resourceType: "GlucoseReading", resourceId: reading._id });
    res.status(201).json({ reading });
  } catch (err) {
    next(err);
  }
});

router.delete("/reading/:readingId", async (req, res, next) => {
  try {
    const reading = await GlucoseReading.findById(req.params.readingId);
    if (!reading) return res.status(404).json({ error: "Reading not found" });
    if (reading.patient.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    await reading.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
