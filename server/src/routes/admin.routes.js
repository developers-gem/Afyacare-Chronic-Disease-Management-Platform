import { Router } from "express";
import User from "../models/User.js";
import { Doctor, Appointment } from "../models/Doctor.js";
import HealthAlert from "../models/HealthAlert.js";
import { Medication } from "../models/Medication.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "super_admin", "support_staff"));

router.get("/dashboard", async (req, res, next) => {
  try {
    const [totalPatients, activePatients, totalDoctors, pendingDoctorVerifications, appointmentsUpcoming, appointmentsCompleted, openAlerts] =
      await Promise.all([
        User.countDocuments({ role: "patient" }),
        User.countDocuments({ role: "patient", isActive: true }),
        Doctor.countDocuments({ "verification.status": "approved" }),
        Doctor.countDocuments({ "verification.status": "pending" }),
        Appointment.countDocuments({ status: { $in: ["booked", "confirmed"] } }),
        Appointment.countDocuments({ status: "completed" }),
        HealthAlert.countDocuments({ acknowledged: false }),
      ]);
    res.json({
      totals: { totalPatients, activePatients, totalDoctors, pendingDoctorVerifications, appointmentsUpcoming, appointmentsCompleted, openAlerts },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/patients", async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = { role: "patient" };
    if (q) filter.$or = [{ fullName: new RegExp(q, "i") }, { email: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }];
    const patients = await User.find(filter).select("-passwordHash").skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ patients, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get("/doctors/pending", async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ "verification.status": "pending" }).populate("user", "fullName email phone");
    res.json({ doctors });
  } catch (err) {
    next(err);
  }
});

router.get("/appointments", async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const appointments = await Appointment.find(filter)
      .populate("patient", "fullName phone")
      .populate({ path: "doctor", populate: { path: "user", select: "fullName" } })
      .sort({ scheduledStart: -1 })
      .limit(200);
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
});

router.put("/users/:userId/status", async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive }, { new: true });
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

export default router;
