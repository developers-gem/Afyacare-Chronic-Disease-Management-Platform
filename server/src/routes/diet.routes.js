import { Router } from "express";
import { DietPlan, AssignedDiet } from "../models/Diet.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/plans", async (req, res, next) => {
  try {
    const plans = await DietPlan.find();
    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

router.post("/plans", requireRole("dietitian", "admin", "super_admin"), async (req, res, next) => {
  try {
    const plan = await DietPlan.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
});

router.get("/mine", async (req, res, next) => {
  try {
    const assigned = await AssignedDiet.findOne({ patient: req.user._id }).populate("plan").sort({ createdAt: -1 });
    res.json({ assigned });
  } catch (err) {
    next(err);
  }
});

router.post("/assign/:patientId", requireRole("dietitian", "admin", "super_admin"), async (req, res, next) => {
  try {
    const { planId } = req.body;
    const assigned = await AssignedDiet.create({ patient: req.params.patientId, plan: planId });
    res.status(201).json({ assigned });
  } catch (err) {
    next(err);
  }
});

router.put("/mine/complete", async (req, res, next) => {
  try {
    const { date, slot, completed } = req.body;
    const assigned = await AssignedDiet.findOne({ patient: req.user._id }).sort({ createdAt: -1 });
    if (!assigned) return res.status(404).json({ error: "No diet plan assigned" });
    assigned.mealCompletions.push({ date, slot, completed });
    await assigned.save();
    res.json({ assigned });
  } catch (err) {
    next(err);
  }
});

export default router;
