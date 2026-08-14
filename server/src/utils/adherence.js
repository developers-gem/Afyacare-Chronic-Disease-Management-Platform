import { MedicationDose } from "../models/Medication.js";

/**
 * Calculates adherence % over a window of days for a patient (optionally
 * scoped to one medication). taken / (taken + missed) — pending doses whose
 * scheduled time hasn't passed yet are excluded from the denominator.
 */
export async function calculateAdherence(patientId, { days = 7, medicationId = null } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const match = { patient: patientId, scheduledFor: { $gte: since, $lte: new Date() } };
  if (medicationId) match.medication = medicationId;

  const doses = await MedicationDose.find(match).lean();
  const taken = doses.filter((d) => d.status === "taken").length;
  const missed = doses.filter((d) => d.status === "missed").length;
  const skipped = doses.filter((d) => d.status === "skipped").length;
  const total = taken + missed + skipped;

  const percentage = total === 0 ? null : Math.round((taken / total) * 100);

  // Current streak of consecutive days with 100% of scheduled doses taken
  const byDay = {};
  for (const d of doses) {
    const key = new Date(d.scheduledFor).toISOString().slice(0, 10);
    byDay[key] = byDay[key] || [];
    byDay[key].push(d.status);
  }
  let streak = 0;
  const dayKeys = Object.keys(byDay).sort().reverse();
  for (const key of dayKeys) {
    const statuses = byDay[key];
    if (statuses.every((s) => s === "taken")) streak += 1;
    else break;
  }

  return { percentage, taken, missed, skipped, total, streakDays: streak, windowDays: days };
}
