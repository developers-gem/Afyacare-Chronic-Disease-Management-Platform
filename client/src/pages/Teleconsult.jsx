import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client.js";
import AppShell from "../components/AppShell.jsx";

export default function Teleconsult() {
  const { appointmentId } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    api.post(`/consultations/start/${appointmentId}`).then(({ data }) => {
      setConsultation(data.consultation);
      setNotes(data.consultation.symptoms || "");
    });
  }, [appointmentId]);

  const saveNotes = async () => {
    const { data } = await api.put(`/consultations/${consultation._id}`, { symptoms: notes });
    setConsultation(data.consultation);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const roomName = `Afyacare-${appointmentId || "demo"}`;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Teleconsultation</h1>
      <p className="text-gray-500 mt-1">Secure, end-to-end encrypted video — no downloads required.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <iframe
            title="Afyacare consult room"
            src={`https://meet.jit.si/${roomName}`}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-[520px] border-0"
          />
        </div>
        <div className="card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-3">Consultation notes</h2>
          <textarea
            className="input h-56 resize-none"
            placeholder="Symptoms, questions for the doctor, observations…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button onClick={saveNotes} disabled={!consultation} className="btn-primary w-full justify-center flex mt-3 disabled:opacity-50">
            Save to visit record
          </button>
          {saved && <p className="text-sage-600 text-sm mt-2">Saved ✓</p>}
        </div>
      </div>
    </AppShell>
  );
}
