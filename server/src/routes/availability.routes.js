import { Router } from "express";
import { Availability, Appointment, Doctor } from "../models/Doctor.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/:doctorId", async (req, res, next) => {
  try {
    const availability = await Availability.findOne({ doctor: req.params.doctorId });
    res.json({ availability });
  } catch (err) {
    next(err);
  }
});

router.put("/:doctorId", requireRole("doctor", "admin", "super_admin"), async (req, res, next) => {
  try {
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    if (!isAdmin) {
      const doctorProfile = await Doctor.findById(req.params.doctorId);
      if (!doctorProfile || doctorProfile.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You can only edit your own availability" });
      }
    }
    const { weeklySchedule, consultationDurationMins, bufferMins, timezone, blockedDates } = req.body;
    const availability = await Availability.findOneAndUpdate(
      { doctor: req.params.doctorId },
      { $set: { weeklySchedule, consultationDurationMins, bufferMins, timezone, blockedDates } },
      { new: true, upsert: true }
    );
    res.json({ availability });
  } catch (err) {
    next(err);
  }
});

// Computes bookable slots for a given date by subtracting existing appointments
router.get("/:doctorId/slots", async (req, res, next) => {
  try {
    const { date } = req.query; // "YYYY-MM-DD"
    if (!date) return res.status(400).json({ error: "date query param required (YYYY-MM-DD)" });

    const availability = await Availability.findOne({ doctor: req.params.doctorId });
    if (!availability) return res.json({ slots: [] });

    const target = new Date(date + "T00:00:00");
    const dow = target.getDay();
    const dayConfig = availability.weeklySchedule.find((d) => d.dayOfWeek === dow);

    const blocked = availability.blockedDates?.some(
      (b) => new Date(b.date).toDateString() === target.toDateString()
    );
    if (!dayConfig || blocked) return res.json({ slots: [] });

    const duration = availability.consultationDurationMins || 20;
    const buffer = availability.bufferMins || 5;

    const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(target); dayEnd.setHours(23, 59, 59, 999);
    const existing = await Appointment.find({
      doctor: req.params.doctorId,
      scheduledStart: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ["booked", "confirmed"] },
    });

    const slots = [];
    for (const block of dayConfig.blocks) {
      let [h, m] = block.start.split(":").map(Number);
      const [endH, endM] = block.end.split(":").map(Number);
      let cursor = new Date(target); cursor.setHours(h, m, 0, 0);
      const blockEnd = new Date(target); blockEnd.setHours(endH, endM, 0, 0);

      while (cursor.getTime() + duration * 60000 <= blockEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + duration * 60000);
        const overlap = existing.some(
          (a) => cursor < new Date(a.scheduledEnd) && slotEnd > new Date(a.scheduledStart)
        );
        if (!overlap) slots.push({ start: new Date(cursor), end: slotEnd });
        cursor = new Date(cursor.getTime() + (duration + buffer) * 60000);
      }
    }
    res.json({ slots });
  } catch (err) {
    next(err);
  }
});

export default router;
