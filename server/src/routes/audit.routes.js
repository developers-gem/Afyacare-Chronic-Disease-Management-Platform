import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "super_admin"));

router.get("/", async (req, res, next) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (userId) filter.user = userId;
    if (action) filter.action = new RegExp(action, "i");
    const logs = await AuditLog.find(filter)
      .populate("user", "fullName role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await AuditLog.countDocuments(filter);
    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
