import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";

const emptyRx = { medicationName: "", dose: "", frequency: "once_daily", durationDays: 7, instructions: "" };

export default function DoctorConsultation() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [form, setForm] = useState({ symptoms: "", assessment: "", diagnosis: "", doctorNotes: "" });
  const [vitals, setVitals] = useState({ systolic: "", diastolic: "", pulse: "", glucose: "" });
  const [followUp, setFollowUp] = useState({ required: false, date: "", notes: "" });
  const [rxItems, setRxItems] = useState([{ ...emptyRx }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ending, setEnding] = useState(false);
  const [prescribing, setPrescribing] = useState(false);
  const [rxDone, setRxDone] = useState(false);

  useEffect(() => {
    api.get(`/appointments/${appointmentId}`).then(({ data }) => setAppointment(data.appointment));
    api.post(`/consultations/start/${appointmentId}`).then(({ data }) => {
      setConsultation(data.consultation);
      setForm({
        symptoms: data.consultation.symptoms || "",
        assessment: data.consultation.assessment || "",
        diagnosis: data.consultation.diagnosis || "",
        doctorNotes: data.consultation.doctorNotes || "",
      });
      if (data.consultation.vitalsSnapshot) {
        const v = data.consultation.vitalsSnapshot;
        setVitals({ systolic: v.systolic || "", diastolic: v.diastolic || "", pulse: v.pulse || "", glucose: v.glucose || "" });
      }
      if (data.consultation.followUp) setFollowUp(data.consultation.followUp);
    });
  }, [appointmentId]);

  const saveNotes = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/consultations/${consultation._id}`, {
        ...form,
        vitalsSnapshot: {
          systolic: Number(vitals.systolic) || undefined,
          diastolic: Number(vitals.diastolic) || undefined,
          pulse: Number(vitals.pulse) || undefined,
          glucose: Number(vitals.glucose) || undefined,
        },
        followUp,
      });
      setConsultation(data.consultation);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const addRxItem = () => setRxItems((items) => [...items, { ...emptyRx }]);
  const updateRxItem = (i, k, v) => setRxItems((items) => items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const removeRxItem = (i) => setRxItems((items) => items.filter((_, idx) => idx !== i));

  const prescribe = async () => {
    setPrescribing(true);
    try {
      await api.post(`/consultations/${consultation._id}/prescribe`, {
        items: rxItems.filter((it) => it.medicationName && it.dose),
        refillsAllowed: 0,
      });
      setRxDone(true);
    } finally {
      setPrescribing(false);
    }
  };

  const endConsultation = async () => {
    setEnding(true);
    try {
      await saveNotes();
      await api.put(`/consultations/${consultation._id}/end`);
      window.location.href = "/doctor/appointments";
    } finally {
      setEnding(false);
    }
  };

  const roomName = `Afyacare-${appointmentId}`;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Consultation — {appointment?.patient?.fullName || "…"}</h1>
          <p className="text-gray-500 mt-1">{appointment ? new Date(appointment.scheduledStart).toLocaleString() : ""} · {appointment?.reasonForVisit || "General consult"}</p>
        </div>
        <Link to="/doctor/appointments" className="btn-outline text-sm">Back to appointments</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <iframe
            title="Consult room"
            src={`https://meet.jit.si/${roomName}`}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-[420px] border-0"
          />
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-3">Vitals snapshot</h2>
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Systolic" value={vitals.systolic} onChange={(e) => setVitals((v) => ({ ...v, systolic: e.target.value }))} />
            <input className="input" placeholder="Diastolic" value={vitals.diastolic} onChange={(e) => setVitals((v) => ({ ...v, diastolic: e.target.value }))} />
            <input className="input" placeholder="Pulse" value={vitals.pulse} onChange={(e) => setVitals((v) => ({ ...v, pulse: e.target.value }))} />
            <input className="input" placeholder="Glucose" value={vitals.glucose} onChange={(e) => setVitals((v) => ({ ...v, glucose: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">Clinical notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Symptoms"><textarea className="input h-24" value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} /></Field>
          <Field label="Assessment"><textarea className="input h-24" value={form.assessment} onChange={(e) => setForm((f) => ({ ...f, assessment: e.target.value }))} /></Field>
          <Field label="Diagnosis"><textarea className="input h-24" value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} /></Field>
          <Field label="Doctor notes"><textarea className="input h-24" value={form.doctorNotes} onChange={(e) => setForm((f) => ({ ...f, doctorNotes: e.target.value }))} /></Field>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={followUp.required} onChange={(e) => setFollowUp((f) => ({ ...f, required: e.target.checked }))} />
            Follow-up required
          </label>
          {followUp.required && (
            <>
              <input type="date" className="input w-44" value={followUp.date ? followUp.date.slice(0, 10) : ""} onChange={(e) => setFollowUp((f) => ({ ...f, date: e.target.value }))} />
              <input className="input flex-1" placeholder="Follow-up notes" value={followUp.notes || ""} onChange={(e) => setFollowUp((f) => ({ ...f, notes: e.target.value }))} />
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveNotes} disabled={saving || !consultation} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : "Save notes"}</button>
          {saved && <span className="text-sage-600 text-sm font-medium">Saved ✓</span>}
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-indigo-700">Prescription</h2>
          <button onClick={addRxItem} className="text-sm text-indigo-600 flex items-center gap-1"><Plus size={16} /> Add medication</button>
        </div>
        <div className="space-y-3">
          {rxItems.map((it, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
              <input className="input" placeholder="Medication" value={it.medicationName} onChange={(e) => updateRxItem(i, "medicationName", e.target.value)} />
              <input className="input" placeholder="Dose (5 mg)" value={it.dose} onChange={(e) => updateRxItem(i, "dose", e.target.value)} />
              <select className="input" value={it.frequency} onChange={(e) => updateRxItem(i, "frequency", e.target.value)}>
                <option value="once_daily">Once daily</option>
                <option value="twice_daily">Twice daily</option>
                <option value="custom">Custom</option>
              </select>
              <input type="number" className="input" placeholder="Duration (days)" value={it.durationDays} onChange={(e) => updateRxItem(i, "durationDays", e.target.value)} />
              <input className="input" placeholder="Instructions" value={it.instructions} onChange={(e) => updateRxItem(i, "instructions", e.target.value)} />
              <button onClick={() => removeRxItem(i)} className="text-terracotta-500 justify-self-start"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={prescribe} disabled={prescribing || !consultation} className="btn-accent disabled:opacity-60">
            {prescribing ? "Prescribing…" : "Prescribe & add to patient's medications"}
          </button>
          {rxDone && <span className="text-sage-600 text-sm font-medium">Prescription sent ✓</span>}
        </div>
      </div>

      <div className="mt-6">
        <button onClick={endConsultation} disabled={ending} className="btn-primary disabled:opacity-60">
          {ending ? "Ending…" : "End consultation & complete appointment"}
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
