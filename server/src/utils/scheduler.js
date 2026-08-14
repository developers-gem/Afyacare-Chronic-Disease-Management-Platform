import cron from "node-cron";
import { Medication, MedicationDose } from "../models/Medication.js";
import Notification from "../models/Notification.js";
import { processNotificationQueue } from "./notifier.js";
import { evaluateMissedDose } from "./riskEngine.js";

/** Generates today's dose instances for every active medication, once per day. */
async function generateTodaysDoses() {
  const meds = await Medication.find({ isActive: true });
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();

  for (const med of meds) {
    for (const t of med.times || []) {
      const [hh, mm] = t.split(":").map(Number);
      const scheduledFor = new Date(y, m, d, hh, mm);
      const exists = await MedicationDose.findOne({ medication: med._id, scheduledFor });
      if (!exists) {
        await MedicationDose.create({ medication: med._id, patient: med.patient, scheduledFor });
        // queue a reminder 10 mins before
        const reminderTime = new Date(scheduledFor.getTime() - 10 * 60 * 1000);
        await Notification.create({
          user: med.patient,
          channel: "whatsapp",
          type: "medication_reminder",
          title: "Medication reminder",
          body: `Time for ${med.name} ${med.dose} soon.`,
          scheduledFor: reminderTime > new Date() ? reminderTime : new Date(),
          relatedResource: "Medication",
          relatedId: med._id,
        });
      }
    }
  }
}

/** Marks doses more than 2 hours past scheduled time with no action as missed. */
async function sweepMissedDoses() {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const overdue = await MedicationDose.find({ status: "pending", scheduledFor: { $lte: cutoff } });
  for (const dose of overdue) {
    dose.status = "missed";
    await dose.save();
    await evaluateMissedDose(dose);
  }
}

export function startScheduler() {
  // every minute: dispatch due notifications
  cron.schedule("* * * * *", () => {
    processNotificationQueue().catch((e) => console.error("[scheduler] notify error", e));
  });

  // every 15 minutes: sweep missed doses
  cron.schedule("*/15 * * * *", () => {
    sweepMissedDoses().catch((e) => console.error("[scheduler] sweep error", e));
  });

  // once a day at 00:05 server time: generate today's dose instances
  cron.schedule("5 0 * * *", () => {
    generateTodaysDoses().catch((e) => console.error("[scheduler] generate error", e));
  });

  // also run once on boot so demo data is populated immediately
  generateTodaysDoses().catch((e) => console.error("[scheduler] initial generate error", e));

  console.log("[scheduler] started (notifications/min, missed-sweep/15min, dose-gen/daily)");
}
