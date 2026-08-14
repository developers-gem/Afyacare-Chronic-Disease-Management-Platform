import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import BpReading from "../models/BpReading.js";
import GlucoseReading from "../models/GlucoseReading.js";
import { Medication } from "../models/Medication.js";
import { FamilyLink, Consent } from "../models/Family.js";
import { Doctor, Availability } from "../models/Doctor.js";

async function run() {
  await connectDB();
  console.log("[seed] clearing collections...");
  await Promise.all([
    User.deleteMany({}), PatientProfile.deleteMany({}), BpReading.deleteMany({}),
    GlucoseReading.deleteMany({}), Medication.deleteMany({}), FamilyLink.deleteMany({}),
    Consent.deleteMany({}), Doctor.deleteMany({}), Availability.deleteMany({}),
  ]);

  const chinwe = new User({ fullName: "Chinwe O.", email: "chinwe@example.com", phone: "+2348012345678", role: "patient", isVerified: true });
  await chinwe.setPassword("Password123!");
  await chinwe.save();

  await PatientProfile.create({
    user: chinwe._id, dateOfBirth: new Date("1978-04-12"), gender: "female",
    country: "Nigeria", city: "Lagos", preferredLanguage: "en", timezone: "Africa/Lagos",
    chronicConditions: [{ name: "Hypertension" }, { name: "Type 2 Diabetes" }],
    emergencyContacts: [{ name: "Papa Emeka", relationship: "Father", phone: "+2348011112222" }],
    notificationPreferences: { sms: true, whatsapp: true, email: false, push: false },
  });

  // 14 days of BP + glucose readings similar to the screenshots
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 86400000);
    await BpReading.create({
      patient: chinwe._id,
      systolic: 118 + Math.round(Math.sin(i) * 10 + 8),
      diastolic: 76 + Math.round(Math.cos(i) * 5 + 4),
      pulse: 64 + Math.round(Math.random() * 10),
      measuredAt: date,
    });
    await GlucoseReading.create({
      patient: chinwe._id,
      value: 100 + Math.round(Math.sin(i / 2) * 20 + 15),
      context: i % 3 === 0 ? "fasting" : i % 3 === 1 ? "post_meal" : "random",
      measuredAt: date,
    });
  }

  const meds = [
    { name: "Amlodipine", dose: "5 mg", condition: "Hypertension", frequency: "once_daily", times: ["08:00"] },
    { name: "Metformin", dose: "500 mg", condition: "Diabetes", frequency: "twice_daily", times: ["13:00", "20:00"] },
    { name: "Lisinopril", dose: "10 mg", condition: "Hypertension", frequency: "once_daily", times: ["20:00"] },
    { name: "Glimepiride", dose: "2 mg", condition: "Diabetes", frequency: "once_daily", times: ["07:30"] },
    { name: "Atorvastatin", dose: "20 mg", condition: "Both", frequency: "once_daily", times: ["22:00"] },
  ];
  for (const m of meds) await Medication.create({ patient: chinwe._id, ...m });

  // Family circle
  const mama = new User({ fullName: "Mama Ngozi", email: "mama.ngozi@example.com", phone: "+2348022223333", role: "patient" });
  await mama.setPassword("Password123!"); await mama.save();
  const papa = new User({ fullName: "Papa Emeka", email: "papa.emeka@example.com", phone: "+2348033334444", role: "patient" });
  await papa.setPassword("Password123!"); await papa.save();
  const bisi = new User({ fullName: "Aunty Bisi", email: "aunty.bisi@example.com", phone: "+2348044445555", role: "patient" });
  await bisi.setPassword("Password123!"); await bisi.save();

  for (const [rel, u] of [["Mother", mama], ["Father", papa], ["Aunt", bisi]]) {
    await FamilyLink.create({ patient: u._id, caregiver: chinwe._id, relationship: rel, status: "accepted" });
    await Consent.create({
      patient: u._id, grantee: chinwe._id,
      scopes: { bpReadings: true, glucoseReadings: true, medications: true, emergencyAlerts: true },
    });
  }
  await BpReading.create({ patient: mama._id, systolic: 142, diastolic: 88, pulse: 80 });
  await GlucoseReading.create({ patient: mama._id, value: 156, context: "random" });
  await BpReading.create({ patient: papa._id, systolic: 128, diastolic: 82, pulse: 70 });
  await GlucoseReading.create({ patient: bisi._id, value: 210, context: "random" });

  // Doctors
  const doctorSeed = [
    { name: "Dr. Adaeze Okafor", specialty: "Endocrinologist", hospital: "Lagoon Hospital", city: "Lagos", country: "Nigeria", fee: 12000, currency: "NGN" },
    { name: "Dr. Tunde Bakare", specialty: "Cardiologist", hospital: "Reddington Hospital", city: "Lagos", country: "Nigeria", fee: 15000, currency: "NGN" },
    { name: "Dr. Fatima Ibrahim", specialty: "Family Physician", hospital: "Garki Hospital", city: "Abuja", country: "Nigeria", fee: 8000, currency: "NGN" },
    { name: "Dr. Kwame Mensah", specialty: "Diabetologist", hospital: "Korle Bu Teaching Hospital", city: "Accra", country: "Ghana", fee: 250, currency: "GHS" },
  ];
  for (const d of doctorSeed) {
    const u = new User({ fullName: d.name, email: d.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@afyacare.com", phone: "+234800" + Math.floor(Math.random() * 9000000 + 1000000), role: "doctor", isVerified: true });
    await u.setPassword("Password123!"); await u.save();
    const doc = await Doctor.create({
      user: u._id, specialty: d.specialty, hospital: d.hospital, city: d.city, country: d.country,
      licenseNumber: "LIC-" + Math.floor(Math.random() * 100000),
      consultationFee: { amount: d.fee, currency: d.currency },
      verification: { status: "approved" },
      rating: 4.7, ratingCount: 20,
    });
    await Availability.create({
      doctor: doc._id,
      weeklySchedule: [1, 2, 3, 4, 5].map((dow) => ({ dayOfWeek: dow, blocks: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] })),
      consultationDurationMins: 20, bufferMins: 5,
    });
  }

  // Admin
  const admin = new User({ fullName: "Afyacare Admin", email: "admin@afyacare.com", phone: "+2348099998888", role: "super_admin", isVerified: true });
  await admin.setPassword("AdminPass123!"); await admin.save();

  console.log("[seed] done. Login as chinwe@example.com / Password123! or admin@afyacare.com / AdminPass123!");
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
