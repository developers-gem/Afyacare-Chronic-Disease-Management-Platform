import Notification from "../models/Notification.js";

/**
 * Provider integration points. Wire real Twilio / WhatsApp Business API
 * credentials into .env and replace the console.log bodies below — the
 * queue/retry/fallback logic around them is already production-shaped.
 */
async function sendSms({ to, body }) {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[sms:stub] -> ${to}: ${body}`);
    return { ok: true, stub: true };
  }
  // TODO: integrate real Twilio client here
  return { ok: true };
}

async function sendWhatsapp({ to, body }) {
  if (!process.env.WHATSAPP_BUSINESS_TOKEN) {
    console.log(`[whatsapp:stub] -> ${to}: ${body}`);
    return { ok: true, stub: true };
  }
  // TODO: integrate real WhatsApp Business Cloud API here
  return { ok: true };
}

async function sendEmail({ to, subject, body }) {
  console.log(`[email:stub] -> ${to}: ${subject} :: ${body}`);
  return { ok: true, stub: true };
}

/** Processes queued notifications due now, with WhatsApp -> SMS fallback. */
export async function processNotificationQueue() {
  const due = await Notification.find({ status: "queued", scheduledFor: { $lte: new Date() } })
    .populate("user")
    .limit(50);

  for (const n of due) {
    try {
      n.attempts += 1;
      const to = n.channel === "email" ? n.user.email : n.user.phone;

      let result;
      if (n.channel === "whatsapp") {
        result = await sendWhatsapp({ to, body: n.body });
        if (!result.ok) {
          // fallback WhatsApp -> SMS
          n.channel = "sms";
          result = await sendSms({ to, body: n.body });
        }
      } else if (n.channel === "sms") {
        result = await sendSms({ to, body: n.body });
      } else if (n.channel === "email") {
        result = await sendEmail({ to, subject: n.title, body: n.body });
      } else {
        result = { ok: true }; // in_app / push already "delivered" by being queryable
      }

      if (result.ok) {
        n.status = "sent";
        n.sentAt = new Date();
      } else {
        n.status = n.attempts >= 3 ? "failed" : "queued";
        n.lastError = result.error || "unknown error";
      }
      await n.save();
    } catch (err) {
      n.status = n.attempts >= 3 ? "failed" : "queued";
      n.lastError = err.message;
      await n.save();
    }
  }
  return { processed: due.length };
}
