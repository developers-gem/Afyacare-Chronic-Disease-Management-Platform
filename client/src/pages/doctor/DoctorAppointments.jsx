import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";
import { useDoctorProfile } from "../../hooks/useDoctorProfile.js";

const TABS = ["upcoming", "completed", "cancelled"];

export default function DoctorAppointments() {
  const { doctor, loading } = useDoctorProfile();
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    api.get("/appointments/mine").then(({ data }) => setAppointments(data.appointments));
  }, []);

  if (loading) return <AppShell><div className="text-gray-400">Loading…</div></AppShell>;
  if (doctor === null) return <Navigate to="/doctor/onboarding" replace />;

  const markNoShow = async (id) => {
    await api.put(`/appointments/${id}/no-show`);
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: "no_show" } : a)));
  };

  const filtered = appointments.filter((a) => {
    if (tab === "upcoming") return ["booked", "confirmed", "rescheduled"].includes(a.status);
    if (tab === "completed") return a.status === "completed";
    return ["cancelled", "no_show"].includes(a.status);
  });

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Appointments</h1>
      <p className="text-gray-500 mt-1">All your bookings, in one place.</p>

      <div className="flex gap-2 mt-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`capitalize ${tab === t ? "btn-primary" : "btn-outline"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3 mt-6">
        {filtered.map((a) => (
          <div key={a._id} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">{a.patient?.fullName}</div>
              <div className="text-sm text-gray-500">{new Date(a.scheduledStart).toLocaleString()} · {a.reasonForVisit || "General consult"}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="pill pill-status-in_range capitalize">{a.status.replace("_", " ")}</span>
              {["booked", "confirmed", "rescheduled"].includes(a.status) && (
                <>
                  <Link to={`/doctor/consult/${a._id}`} className="btn-accent text-xs px-3 py-1.5">Start consult</Link>
                  <button onClick={() => markNoShow(a._id)} className="text-xs text-terracotta-500 hover:underline">No-show</button>
                </>
              )}
              {a.status === "completed" && (
                <Link to={`/doctor/consult/${a._id}`} className="btn-outline text-xs px-3 py-1.5">View notes</Link>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-gray-400">Nothing here.</p>}
      </div>
    </AppShell>
  );
}
