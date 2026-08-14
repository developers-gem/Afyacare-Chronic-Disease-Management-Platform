import { Router } from "express";
import PatientProfile from "../models/PatientProfile.js";
import { requireAuth, requireSelfOrRole } from "../middleware/auth.js";
import { requireConsentScope } from "../middleware/consent.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();
router.use(requireAuth);

// Get own or (with consent/role) another patient's profile
router.get(
  "/:patientId",
  requireConsentScope("healthTrends", "patientId"),
  async (req, res, next) => {
    try {
      const profile = await PatientProfile.findOne({ user: req.params.patientId }).populate(
        "user",
        "fullName email phone role"
      );
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json({ profile });
    } catch (err) {
      next(err);
    }
  }
);

router.put("/:patientId", requireSelfOrRole("patientId", "admin", "super_admin"), async (req, res, next) => {
  try {
    const allowed = [
      "dateOfBirth", "gender", "country", "city", "address", "profilePhotoUrl",
      "preferredLanguage", "timezone", "emergencyContacts", "chronicConditions",
      "allergies", "existingMedicationsNote", "medicalHistoryNote",
      "healthcarePreferences", "notificationPreferences",
    ];
    const updates = {};
    for (const key of allowed) if (key in req.body) updates[key] = req.body[key];

    const profile = await PatientProfile.findOneAndUpdate(
      { user: req.params.patientId },
      { $set: updates },
      { new: true, upsert: true }
    );
    await logAudit(req, { action: "patient.profile.updated", resourceType: "PatientProfile", resourceId: profile._id });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
