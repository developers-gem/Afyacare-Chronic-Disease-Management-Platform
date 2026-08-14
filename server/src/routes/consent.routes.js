import { Router } from "express";
import { Consent } from "../models/Family.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();
router.use(requireAuth);

// List everyone I (as patient) have granted consent to, and their scopes
router.get("/granted-by-me", async (req, res, next) => {
  try {
    const consents = await Consent.find({ patient: req.user._id }).populate("grantee", "fullName role");
    res.json({ consents });
  } catch (err) {
    next(err);
  }
});

router.put("/:granteeId", async (req, res, next) => {
  try {
    const scopes = req.body.scopes || {};
    const consent = await Consent.findOneAndUpdate(
      { patient: req.user._id, grantee: req.params.granteeId },
      { $set: { scopes } },
      { new: true, upsert: true }
    );
    await logAudit(req, {
      action: "consent.updated", resourceType: "Consent", resourceId: consent._id, metadata: { scopes },
    });
    res.json({ consent });
  } catch (err) {
    next(err);
  }
});

export default router;
