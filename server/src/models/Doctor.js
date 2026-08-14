import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialty: { type: String, required: true },
    hospital: String,
    city: String,
    country: String,
    licenseNumber: { type: String, required: true },
    qualifications: [String],
    yearsExperience: Number,
    languages: [String],
    consultationFee: { amount: Number, currency: { type: String, default: "NGN" } },
    profilePhotoUrl: String,
    documents: [{ label: String, url: String }],
    verification: {
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
      notes: String,
    },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);

const availabilitySchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    weeklySchedule: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sunday
        blocks: [{ start: String, end: String }], // "09:00" - "13:00"
      },
    ],
    consultationDurationMins: { type: Number, default: 20 },
    bufferMins: { type: Number, default: 5 },
    timezone: { type: String, default: "Africa/Lagos" },
    blockedDates: [{ date: Date, reason: String }], // leave/holiday
  },
  { timestamps: true }
);

export const Availability = mongoose.model("Availability", availabilitySchema);

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ["booked", "confirmed", "cancelled", "rescheduled", "completed", "no_show"],
      default: "booked",
    },
    reasonForVisit: String,
    fee: { amount: Number, currency: String },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    consultRoomId: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelReason: String,
  },
  { timestamps: true }
);
appointmentSchema.index({ doctor: 1, scheduledStart: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);

const consultationSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    startedAt: Date,
    endedAt: Date,
    status: { type: String, enum: ["waiting", "in_progress", "completed"], default: "waiting" },
    symptoms: String,
    vitalsSnapshot: { systolic: Number, diastolic: Number, glucose: Number, pulse: Number },
    assessment: String,
    diagnosis: String,
    doctorNotes: String,
    followUp: { required: Boolean, date: Date, notes: String },
    chatLog: [{ sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, message: String, sentAt: Date }],
  },
  { timestamps: true }
);

export const Consultation = mongoose.model("Consultation", consultationSchema);

const prescriptionSchema = new mongoose.Schema(
  {
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    items: [
      {
        medicationName: String,
        dose: String,
        frequency: String,
        durationDays: Number,
        instructions: String,
      },
    ],
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    refillsAllowed: { type: Number, default: 0 },
    documentUrl: String,
  },
  { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);
