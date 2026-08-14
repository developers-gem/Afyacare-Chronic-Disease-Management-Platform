import { Router } from "express";
import { Doctor } from "../models/Doctor.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAudit } from "../middleware/audit.js";

const router = Router();

// Public-ish directory (still requires auth to keep pricing/consult data gated)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { specialty, city, q } = req.query;
    const filter = { "verification.status": "approved" };
    if (specialty) filter.specialty = new RegExp(specialty, "i");
    if (city) filter.city = new RegExp(city, "i");
    if (q) filter.$or = [{ specialty: new RegExp(q, "i") }, { hospital: new RegExp(q, "i") }];

    const doctors = await Doctor.find(filter).populate("user", "fullName email phone");
    res.json({ doctors });
  } catch (err) {
    next(err);
  }
});

// Convenience: the logged-in doctor's own profile (or null if not onboarded yet)
router.get("/me/profile", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate("user", "fullName email phone");
    res.json({ doctor: doctor || null });
  } catch (err) {
    next(err);
  }
});

router.get("/:doctorId", requireAuth, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId).populate("user", "fullName email phone");
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
});

// Doctor self-registration (creates profile against an existing doctor-role user)
router.post("/", requireAuth, requireRole("doctor"), async (req, res, next) => {
  try {
    const existing = await Doctor.findOne({ user: req.user._id });
    if (existing) return res.status(409).json({ error: "Doctor profile already exists" });

    const { specialty, hospital, city, country, licenseNumber, qualifications, yearsExperience, languages, consultationFee, documents } = req.body;
    if (!specialty || !licenseNumber) return res.status(400).json({ error: "specialty and licenseNumber are required" });

    const doctor = await Doctor.create({
      user: req.user._id, specialty, hospital, city, country, licenseNumber,
      qualifications, yearsExperience, languages, consultationFee, documents,
    });
    await logAudit(req, { action: "doctor.profile.created", resourceType: "Doctor", resourceId: doctor._id });
    res.status(201).json({ doctor });
  } catch (err) {
    next(err);
  }
});

router.put("/:doctorId", requireAuth, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    if (doctor.user.toString() !== req.user._id.toString() && !["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const allowed = ["specialty", "hospital", "city", "country", "qualifications", "yearsExperience", "languages", "consultationFee", "profilePhotoUrl", "documents"];
    allowed.forEach((k) => { if (k in req.body) doctor[k] = req.body[k]; });
    await doctor.save();
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
});

// Admin verification workflow
router.put("/:doctorId/verify", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { status, notes } = req.body; // approved | rejected
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "status must be approved or rejected" });
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    doctor.verification = { status, reviewedBy: req.user._id, reviewedAt: new Date(), notes };
    await doctor.save();
    await logAudit(req, { action: `doctor.verification.${status}`, resourceType: "Doctor", resourceId: doctor._id });
    res.json({ doctor });
  } catch (err) {
    next(err);
  }
});

export default router;
