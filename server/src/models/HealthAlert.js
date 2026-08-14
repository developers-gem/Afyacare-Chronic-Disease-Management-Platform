import mongoose from "mongoose";

const healthAlertSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["bp_critical", "bp_high", "glucose_critical", "glucose_high", "missed_medication", "adherence_drop"],
      required: true,
    },
    severity: { type: String, enum: ["watch", "alert", "critical"], default: "alert" },
    message: String,
    sourceType: { type: String, enum: ["BpReading", "GlucoseReading", "MedicationDose", "Adherence"] },
    sourceId: mongoose.Schema.Types.ObjectId,
    acknowledged: { type: Boolean, default: false },
    familyNotified: { type: Boolean, default: false },
    doctorNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("HealthAlert", healthAlertSchema);
