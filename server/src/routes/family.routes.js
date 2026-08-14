import { Router } from "express";
import mongoose from "mongoose";
import { FamilyLink, Consent } from "../models/Family.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();
router.use(requireAuth);

// People I (as patient) am watched by, or people I (as caregiver) watch
router.get("/my-circle", async (req, res, next) => {
  try {
    const asPatient = await FamilyLink.find({ patient: req.user._id }).populate("caregiver", "fullName email phone");
    const asCaregiver = await FamilyLink.find({ caregiver: req.user._id, status: "accepted" }).populate(
      "patient", "fullName email phone"
    );
    res.json({ watchedBy: asPatient, watching: asCaregiver });
  } catch (err) {
    next(err);
  }
});

router.post("/invite", async (req, res, next) => {
  try {
    const { emailOrPhone, relationship } = req.body;
    if (!emailOrPhone || !relationship) return res.status(400).json({ error: "emailOrPhone and relationship required" });

    const invitee = await User.findOne({ $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }] });

    const link = await FamilyLink.create({
      patient: req.user._id,
      caregiver: invitee ? invitee._id : new mongoose.Types.ObjectId(),
      relationship,
      status: "pending",
      invitedEmailOrPhone: emailOrPhone,
    });

    if (invitee) {
      await Notification.create({
        user: invitee._id, channel: "sms", type: "family_invite",
        title: "Family invite", body: `${req.user.fullName} invited you to their Afyacare family circle.`,
      });
    }

    await logAudit(req, { action: "family.invite.sent", resourceType: "FamilyLink", resourceId: link._id });
    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
});

router.put("/invite/:linkId/respond", async (req, res, next) => {
  try {
    const { accept } = req.body;
    const link = await FamilyLink.findById(req.params.linkId);
    if (!link) return res.status(404).json({ error: "Invite not found" });
    if (link.caregiver.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Not your invite" });

    link.status = accept ? "accepted" : "rejected";
    link.respondedAt = new Date();
    await link.save();

    if (accept) {
      await Consent.findOneAndUpdate(
        { patient: link.patient, grantee: link.caregiver },
        { $setOnInsert: { scopes: { emergencyAlerts: true } } },
        { upsert: true }
      );
    }

    await logAudit(req, { action: `family.invite.${link.status}`, resourceType: "FamilyLink", resourceId: link._id });
    res.json({ link });
  } catch (err) {
    next(err);
  }
});

router.delete("/link/:linkId", async (req, res, next) => {
  try {
    const link = await FamilyLink.findById(req.params.linkId);
    if (!link) return res.status(404).json({ error: "Link not found" });
    if (![link.patient.toString(), link.caregiver.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ error: "Access denied" });
    }
    link.status = "removed";
    await link.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
