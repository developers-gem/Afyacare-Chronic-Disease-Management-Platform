import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    channel: { type: String, enum: ["sms", "whatsapp", "email", "push", "in_app"], required: true },
    type: {
      type: String,
      enum: ["medication_reminder", "appointment_reminder", "family_invite", "alert", "otp", "general"],
      default: "general",
    },
    title: String,
    body: String,
    status: { type: String, enum: ["queued", "sent", "delivered", "failed"], default: "queued" },
    scheduledFor: { type: Date, default: Date.now },
    sentAt: Date,
    attempts: { type: Number, default: 0 },
    lastError: String,
    relatedResource: { type: String },
    relatedId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);
notificationSchema.index({ status: 1, scheduledFor: 1 });

export default mongoose.model("Notification", notificationSchema);
