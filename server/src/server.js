import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { startScheduler } from "./utils/scheduler.js";

import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import vitalsRoutes from "./routes/vitals.routes.js";
import glucoseRoutes from "./routes/glucose.routes.js";
import medicationRoutes from "./routes/medication.routes.js";
import familyRoutes from "./routes/family.routes.js";
import consentRoutes from "./routes/consent.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import consultationRoutes from "./routes/consultation.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import dietRoutes from "./routes/diet.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // Local development
  process.env.CLIENT_URL, // Production frontend
  process.env.NETLIFY_CLIENT_URL, // Netlify frontend
];

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 })); // basic API rate limiting

app.get("/api/health", (req, res) => res.json({ ok: true, service: "afyacare-api", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/vitals/bp", vitalsRoutes);
app.use("/api/vitals/glucose", glucoseRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/consent", consentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/diet", dietRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Afyacare API listening on :${PORT}`));
    startScheduler();
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

export default app;
