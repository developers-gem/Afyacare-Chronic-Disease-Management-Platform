import mongoose from "mongoose";

// A family link connects a "watcher" (caregiver) to a "watched" patient.
const familyLinkSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // being watched
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // watching
    relationship: { type: String, required: true }, // Mother, Father, Aunt, etc
    status: { type: String, enum: ["pending", "accepted", "rejected", "removed"], default: "pending" },
    invitedEmailOrPhone: String,
    invitedAt: { type: Date, default: Date.now },
    respondedAt: Date,
  },
  { timestamps: true }
);
familyLinkSchema.index({ patient: 1, caregiver: 1 }, { unique: true });

export const FamilyLink = mongoose.model("FamilyLink", familyLinkSchema);

// Granular consent: what a caregiver (or doctor) is allowed to see for a patient.
const consentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    grantee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scopes: {
      bpReadings: { type: Boolean, default: false },
      glucoseReadings: { type: Boolean, default: false },
      medications: { type: Boolean, default: false },
      appointments: { type: Boolean, default: false },
      dietPlans: { type: Boolean, default: false },
      healthTrends: { type: Boolean, default: false },
      emergencyAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);
consentSchema.index({ patient: 1, grantee: 1 }, { unique: true });

export const Consent = mongoose.model("Consent", consentSchema);
