import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, FileText, Pill } from "lucide-react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";
import { useDoctorProfile } from "../../hooks/useDoctorProfile.js";

export default function DoctorPatientDetail() {
  const { patientId } = useParams();
  const { doctor, loading } = useDoctorProfile();
  const [visits, setVisits] = useState(null);
  const [meds, setMeds] = useState([]);
  const [error, setError] = useState("");
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    api
      .get(`/consultations/patient/${patientId}/history`)
      .then(({ data }) => {
        setVisits(data.visits);
        if (data.visits[0]?.doctor) setPatientName("");
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load visit history"));
    api.get(`/medications/${patientId}`).then(({ data }) => setMeds(data.medications)).catch(() => setMeds([]));
    api.get("/consultations/doctor/mine/patients").then(({ data }) => {
      const match = data.patients.find((p) => p.patient._id === patientId);
      if (match) setPatientName(match.patient.fullName);
    });
  }, [patientId]);

  if (loading) return <AppShell><div className="text-gray-400">Loading…</div></AppShell>;
  if (doctor === null) return <Navigate to="/doctor/onboarding" replace />;

  return (
    <AppShell>
      <Link to="/doctor/patients" className="text-sm text-indigo-600 flex items-center gap-1 mb-3 hover:underline">
        <ArrowLeft size={14} /> Back to patients
      </Link>
      <h1 className="text-3xl font-bold text-indigo-700">{patientName || "Patient"}</h1>
      <p className="text-gray-500 mt-1">Visit history and active medications.</p>

      {error && <div className="card mt-6 text-terracotta-600 text-sm">{error}</div>}

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4 flex items-center gap-2"><Pill size={18} /> Active medications</h2>
        <div className="space-y-2">
          {meds.filter((m) => m.isActive).map((m) => (
            <div key={m._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-3">
              <div className="text-sm">
                <div className="font-semibold">{m.name} {m.dose}</div>
                <div className="text-xs text-gray-500">{m.condition} · {m.frequency.replace("_", " ")} · {(m.times || []).join(", ")}</div>
              </div>
              {m.prescriptionSource === "prescription" && <span className="pill pill-status-in_range">Prescribed</span>}
            </div>
          ))}
          {!meds.filter((m) => m.isActive).length && <p className="text-sm text-gray-400">No active medications on file.</p>}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4 flex items-center gap-2"><FileText size={18} /> Visit history</h2>
        <div className="space-y-4">
          {visits?.map((v) => (
            <div key={v._id} className="border border-sand-200 rounded-xl2 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm">{new Date(v.endedAt || v.createdAt).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Dr. {v.doctor?.user?.fullName}</div>
              </div>
              {v.diagnosis && <p className="text-sm mb-1"><span className="text-gray-500">Diagnosis:</span> {v.diagnosis}</p>}
              {v.assessment && <p className="text-sm mb-1"><span className="text-gray-500">Assessment:</span> {v.assessment}</p>}
              {v.symptoms && <p className="text-sm mb-1"><span className="text-gray-500">Symptoms:</span> {v.symptoms}</p>}
              {v.doctorNotes && <p className="text-sm mb-1"><span className="text-gray-500">Notes:</span> {v.doctorNotes}</p>}
              {v.vitalsSnapshot && (v.vitalsSnapshot.systolic || v.vitalsSnapshot.glucose) && (
                <p className="text-sm text-gray-500 mt-2">
                  Vitals at visit: {v.vitalsSnapshot.systolic ? `${v.vitalsSnapshot.systolic}/${v.vitalsSnapshot.diastolic} mmHg` : ""}
                  {v.vitalsSnapshot.glucose ? ` · ${v.vitalsSnapshot.glucose} mg/dL` : ""}
                </p>
              )}
              {v.followUp?.required && (
                <p className="text-xs text-gold-600 mt-2">Follow-up: {v.followUp.date ? new Date(v.followUp.date).toLocaleDateString() : "TBD"} — {v.followUp.notes}</p>
              )}
            </div>
          ))}
          {visits && !visits.length && <p className="text-sm text-gray-400">No completed visits yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}
