import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Search, Phone, Mail } from "lucide-react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";
import { useDoctorProfile } from "../../hooks/useDoctorProfile.js";

export default function DoctorPatients() {
  const { doctor, loading } = useDoctorProfile();
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/consultations/doctor/mine/patients").then(({ data }) => setPatients(data.patients));
  }, []);

  if (loading) return <AppShell><div className="text-gray-400">Loading…</div></AppShell>;
  if (doctor === null) return <Navigate to="/doctor/onboarding" replace />;

  const filtered = patients.filter((p) =>
    !q || p.patient?.fullName?.toLowerCase().includes(q.toLowerCase()) || p.patient?.phone?.includes(q)
  );

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">My patients</h1>
      <p className="text-gray-500 mt-1">Everyone you've had an appointment with, sorted by most recent visit.</p>

      <div className="flex items-center gap-2 mt-6 max-w-sm">
        <Search size={16} className="text-gray-400" />
        <input className="input" placeholder="Search by name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="space-y-3 mt-6">
        {filtered.map((entry) => (
          <Link
            key={entry.patient._id}
            to={`/doctor/patients/${entry.patient._id}`}
            className="card flex items-center justify-between hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                {entry.patient.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{entry.patient.fullName}</div>
                <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Phone size={12} /> {entry.patient.phone}</span>
                  {entry.patient.email && <span className="flex items-center gap-1"><Mail size={12} /> {entry.patient.email}</span>}
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-gray-500">Last visit</div>
              <div className="font-medium">{new Date(entry.lastVisit).toLocaleDateString()}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {entry.completedCount} completed · {entry.visitCount} total
                {entry.nextUpcoming && <> · next {new Date(entry.nextUpcoming).toLocaleDateString()}</>}
              </div>
            </div>
          </Link>
        ))}
        {!filtered.length && <p className="text-sm text-gray-400">No patients yet — they'll show up here after your first appointment.</p>}
      </div>
    </AppShell>
  );
}
