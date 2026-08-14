import mongoose from "mongoose";

const bpReadingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    systolic: { type: Number, required: true },
    diastolic: { type: Number, required: true },
    pulse: Number,
    measuredAt: { type: Date, default: Date.now },
    source: { type: String, enum: ["manual", "bluetooth_device", "apple_health", "google_health_connect"], default: "manual" },
    notes: String,
    status: { type: String, enum: ["low", "in_range", "watch", "high", "critical"], default: "in_range" },
  },
  { timestamps: true }
);

// Simple clinical thresholds (not a diagnosis engine — decision support only)
bpReadingSchema.methods.computeStatus = function () {
  const { systolic, diastolic } = this;
  if (systolic >= 180 || diastolic >= 120) return "critical";
  if (systolic >= 140 || diastolic >= 90) return "high";
  if (systolic >= 130 || diastolic >= 80) return "watch";
  if (systolic < 90 || diastolic < 60) return "low";
  return "in_range";
};

bpReadingSchema.pre("save", function (next) {
  this.status = this.computeStatus();
  next();
});

export default mongoose.model("BpReading", bpReadingSchema);
