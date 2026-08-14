import { Router } from "express";
import Notification from "../models/Notification.js";
import HealthAlert from "../models/HealthAlert.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.get("/alerts", async (req, res, next) => {
  try {
    const alerts = await HealthAlert.find({ patient: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.put("/alerts/:alertId/ack", async (req, res, next) => {
  try {
    const alert = await HealthAlert.findOneAndUpdate(
      { _id: req.params.alertId, patient: req.user._id },
      { acknowledged: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ alert });
  } catch (err) {
    next(err);
  }
});

export default router;
