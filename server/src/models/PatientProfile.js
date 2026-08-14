import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    relationship: String,
    phone: String,
    email: String,
  },
  { _id: true }
);

const conditionSchema = new mongoose.Schema(
  {
    name: String, // e.g. Hypertension, Type 2 Diabetes
    diagnosedDate: Date,
    severity: { type: String, enum: ["mild", "moderate", "severe"], default: "moderate" },
    notes: String,
  },
  { _id: true }
);

const allergySchema = new mongoose.Schema(
  {
    substance: String,
    reaction: String,
    severity: { type: String, enum: ["mild", "moderate", "severe"], default: "mild" },
  },
  { _id: true }
);

const patientProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["female", "male", "other", "prefer_not_to_say"] },
    country: String,
    city: String,
    address: String,
    profilePhotoUrl: String,
    preferredLanguage: { type: String, default: "en" },
    timezone: { type: String, default: "Africa/Lagos" },

    emergencyContacts: [emergencyContactSchema],
    chronicConditions: [conditionSchema],
    allergies: [allergySchema],
    existingMedicationsNote: String, // free text for meds from before onboarding
    medicalHistoryNote: String,

    healthcarePreferences: {
      preferredHospital: String,
      preferredDoctorGender: { type: String, enum: ["no_preference", "female", "male"], default: "no_preference" },
    },
    notificationPreferences: {
      sms: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("PatientProfile", patientProfileSchema);
