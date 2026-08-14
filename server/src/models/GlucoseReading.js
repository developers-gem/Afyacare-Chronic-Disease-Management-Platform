import mongoose from "mongoose";

const glucoseReadingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value: { type: Number, required: true }, // mg/dL
    context: { type: String, enum: ["fasting", "post_meal", "random"], default: "random" },
    measuredAt: { type: Date, default: Date.now },
    notes: String,
    status: { type: String, enum: ["low", "in_range", "high", "critical"], default: "in_range" },
  },
  { timestamps: true }
);

glucoseReadingSchema.methods.computeStatus = function () {
  const { value, context } = this;
  if (context === "fasting") {
    if (value < 70) return "low";
    if (value > 250) return "critical";
    if (value > 130) return "high";
    return "in_range";
  }
  // post_meal / random
  if (value < 70) return "low";
  if (value > 300) return "critical";
  if (value > 180) return "high";
  return "in_range";
};

glucoseReadingSchema.pre("save", function (next) {
  this.status = this.computeStatus();
  next();
});

export default mongoose.model("GlucoseReading", glucoseReadingSchema);
