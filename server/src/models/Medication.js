import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    dose: { type: String, required: true }, // e.g. "5 mg"
    condition: String, // e.g. Hypertension
    frequency: { type: String, required: true }, // "once_daily" | "twice_daily" | "custom"
    times: [{ type: String }], // ["08:00", "20:00"] in patient timezone
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    prescriptionSource: { type: String, enum: ["self_reported", "prescription"], default: "self_reported" },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    prescribingDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    refillsRemaining: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    interactionsNote: String,
  },
  { timestamps: true }
);

export const Medication = mongoose.model("Medication", medicationSchema);

const doseSchema = new mongoose.Schema(
  {
    medication: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledFor: { type: Date, required: true },
    status: { type: String, enum: ["pending", "taken", "missed", "skipped"], default: "pending" },
    takenAt: Date,
  },
  { timestamps: true }
);
doseSchema.index({ patient: 1, scheduledFor: -1 });

export const MedicationDose = mongoose.model("MedicationDose", doseSchema);
