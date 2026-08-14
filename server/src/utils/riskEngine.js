import HealthAlert from "../models/HealthAlert.js";
import Notification from "../models/Notification.js";
import { FamilyLink, Consent } from "../models/Family.js";

/**
 * Rule-based decision support — NOT a diagnostic AI. Every rule here maps a
 * concrete, explainable threshold to an alert + notification fan-out.
 */

export async function evaluateBpReading(reading) {
  if (reading.status === "critical" || reading.status === "high") {
    await raiseAlert({
      patient: reading.patient,
      type: reading.status === "critical" ? "bp_critical" : "bp_high",
      severity: reading.status === "critical" ? "critical" : "alert",
      message: `Blood pressure reading ${reading.systolic}/${reading.diastolic} mmHg is ${reading.status.replace("_", " ")}.`,
      sourceType: "BpReading",
      sourceId: reading._id,
    });
  }
}

export async function evaluateGlucoseReading(reading) {
  if (reading.status === "critical" || reading.status === "high") {
    await raiseAlert({
      patient: reading.patient,
      type: reading.status === "critical" ? "glucose_critical" : "glucose_high",
      severity: reading.status === "critical" ? "critical" : "alert",
      message: `Glucose reading ${reading.value} mg/dL (${reading.context}) is ${reading.status.replace("_", " ")}.`,
      sourceType: "GlucoseReading",
      sourceId: reading._id,
    });
  }
}

export async function evaluateMissedDose(dose) {
  await raiseAlert({
    patient: dose.patient,
    type: "missed_medication",
    severity: "watch",
    message: "A scheduled medication dose was missed.",
    sourceType: "MedicationDose",
    sourceId: dose._id,
  });
}

async function raiseAlert({ patient, type, severity, message, sourceType, sourceId }) {
  const alert = await HealthAlert.create({ patient, type, severity, message, sourceType, sourceId });

  // Always in-app notify the patient
  await Notification.create({
    user: patient,
    channel: "in_app",
    type: "alert",
    title: "Health alert",
    body: message,
    relatedResource: "HealthAlert",
    relatedId: alert._id,
  });

  // Fan out to family members who have emergencyAlerts consent, if severity warrants it
  if (severity === "critical" || severity === "alert") {
    const links = await FamilyLink.find({ patient, status: "accepted" });
    for (const link of links) {
      const consent = await Consent.findOne({ patient, grantee: link.caregiver });
      if (consent?.scopes?.emergencyAlerts) {
        await Notification.create({
          user: link.caregiver,
          channel: "sms",
          type: "alert",
          title: "Family health alert",
          body: message,
          relatedResource: "HealthAlert",
          relatedId: alert._id,
        });
        alert.familyNotified = true;
      }
    }
    await alert.save();
  }

  return alert;
}
