# Afyacare — Chronic Disease Management Platform

Node.js + Express + MongoDB backend, React + Vite frontend. Built from the
Lovable prototype's screens, with a real backend replacing the demo data,
custom JWT auth/RBAC, and a new "Sahel Clinical" color palette (deep indigo
`#26355D`, terracotta `#E2725B`, gold `#D9A441`).

## Quick start

### 1. Backend
```bash
cd server
cp .env.example .env      # edit MONGO_URI, JWT secrets, etc.
npm install
npm run seed               # populates demo data matching the original screens
npm run dev                # starts on :5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev                 # starts on :5173, proxies /api -> :5000
```

Seeded logins (from `npm run seed`):
- Patient: `chinwe@example.com` / `Password123!`
- Admin: `admin@afyacare.com` / `AdminPass123!`
- Doctors: `johnDoe@doctor.com` / `john@123` (role is `doctor`, but no
  doctor-side UI is wired yet — see "Not built" below)

## What's implemented (P0, end-to-end: schema → API → connected UI)

| Module | Backend | Frontend |
|---|---|---|
| Auth (JWT access+refresh, bcrypt, sessions, OTP scaffold) | ✅ | ✅ login/register |
| RBAC (7 roles, middleware-enforced) | ✅ | ✅ route gating |
| Patient health profile | ✅ | ✅ editable form |
| BP tracking + clinical status thresholds | ✅ | ✅ log + trend chart |
| Glucose tracking + clinical status thresholds | ✅ | ✅ log + trend chart |
| Medications + dose schedule | ✅ | ✅ CRUD + today's schedule |
| Medication adherence engine (%, streaks) | ✅ | ✅ dashboard cards |
| Health alert / risk engine (rule-based, not AI) | ✅ | ⚠️ alerts generated + queryable, no dedicated inbox UI yet |
| Notification scheduler (cron: reminders, missed-dose sweep) | ✅ | — (server-side only) |
| SMS/WhatsApp dispatch (stubbed providers, real queue/retry/fallback) | ✅ | — |
| Family/caregiver invites + accept/reject | ✅ | ✅ |
| Consent/permission scopes, enforced at API middleware | ✅ | ✅ toggle UI |
| Doctor directory + verification workflow | ✅ | ✅ browse; ⚠️ admin approve UI only, no doctor self-onboarding form |
| Doctor availability + real slot computation | ✅ | ✅ (booking modal) |
| Appointment booking, double-booking protection, cancel/reschedule | ✅ | ✅ |
| Consultation/EMR (symptoms, diagnosis, notes, follow-up) | ✅ | ✅ full doctor-side notes form |
| Prescription → medication → schedule → adherence flow | ✅ | ✅ doctor can prescribe, auto-creates patient medications |
| **Doctor portal**: self-onboarding, dashboard, appointments, availability editor, video consult room | ✅ | ✅ |
| Admin dashboard (aggregate stats) | ✅ | ✅ |
| Audit log (every sensitive action) | ✅ | — (API only, no viewer UI) |
| Diet plans (P1, added for completeness) | ✅ basic | ✅ basic |
| Teleconsultation room | — (Jitsi is free/public, no backend needed) | ✅ embedded Jitsi + notes |

## Not built yet (be aware before you rely on this)

- **Payment/billing** (P1) — fee fields exist on appointments/doctors but no checkout/payment gateway integration.
- **Push notifications** — schema/consent flags exist, no actual push provider wired.
- **Bluetooth/Apple Health/Google Health Connect device sync** — `source` field on BP readings supports it, no integration.
- **Audit log viewer UI, alert inbox UI** — data is there, needs a page.
- **Mobile apps** — explicitly out of scope per your priority list (P2).
- **Real SMS/WhatsApp** — provider integration points are in `server/src/utils/notifier.js`, currently stubbed to `console.log`. Add Twilio/WhatsApp Business credentials to `.env` and fill in the two `TODO`s.

## Security notes

- **Consent enforcement is server-side**, not just UI-hidden: `middleware/consent.js` checks the `Consent` collection before returning any patient's BP/glucose/medication data to a caregiver or doctor.
- **Doctor-to-doctor isolation**: doctors are scoped to their own resources server-side, not just by role. `PUT /availability/:doctorId` now verifies the authenticated doctor owns that `doctorId` before allowing an edit (previously any `doctor`-role user could overwrite *any* doctor's schedule by ID — fixed). Similarly, `GET /consultations/patient/:patientId/history` only lets a doctor view a patient's history if they've actually had an appointment with that patient.
- **Risk engine** (`utils/riskEngine.js`) is explicitly rule-based decision support — thresholds are readable and adjustable, not a black-box model, per your requirement to avoid an "uncontrolled AI diagnosis engine."
- **Scheduler** (`utils/scheduler.js`) runs independently of any frontend request, as required — dose generation, missed-dose sweep, and notification dispatch are all cron-driven.
- Verified end-to-end with a live smoke test (register → login → profile → log BP → alert fires → medication → adherence) before packaging.

## Doctor portal (new)

Log in as a `doctor`-role user (seed script doesn't create one with a known
password by default — register via `/auth/register` with `role: "doctor"`,
or check the seeded `dr.*@afyacare.com` accounts, password `Password123!`,
though those are pre-verified with no login flow tested against them yet).

Flow: `/doctor/onboarding` (submit license + specialty for admin review) →
admin approves at `/admin/doctors` → `/doctor` dashboard shows today's
appointments → `/doctor/schedule` sets weekly availability (patients can then
book against it) → `/doctor/consult/:appointmentId` opens the video room,
lets the doctor record vitals/symptoms/diagnosis/notes/follow-up, and
prescribe medications that automatically become the patient's active
medications with a dose schedule. `/doctor/patients` lists everyone the
doctor has had an appointment with (visit counts, last/next visit); clicking
through to `/doctor/patients/:id` shows full visit history and active
medications. Access to a patient's history is scoped server-side — a doctor
can only pull up patients they've actually had an appointment with.

## Next steps I'd suggest

1. Wire real Twilio + WhatsApp Business credentials.
2. Add payment (Paystack/Flutterwave are the common choices for NGN/GHS).
3. Add the audit log + alert inbox admin views.
