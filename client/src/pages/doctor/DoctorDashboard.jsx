import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarClock, Users, ShieldCheck, Clock } from "lucide-react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";
import { useDoctorProfile } from "../../hooks/useDoctorProfile.js";

export default function DoctorDashboard() {
  const { doctor, loading } = useDoctorProfile();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    api.get("/appointments/mine").then(({ data }) => setAppointments(data.appointments));
  }, []);

  if (loading) return <AppShell><div className="text-gray-400">Loading…</div></AppShell>;
  if (doctor === null) return <Navigate to="/doctor/onboarding" replace />;

  const today = new Date().toDateString();
  const todaysAppointments = appointments.filter((a) => new Date(a.scheduledStart).toDateString() === today);
  const upcoming = appointments.filter((a) => ["booked", "confirmed"].includes(a.status));
  const uniquePatients = new Set(appointments.map((a) => a.patient?._id)).size;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Welcome, Dr. {doctor.user?.fullName?.split(" ").pop()}</h1>
          <p className="text-gray-500 mt-1">{doctor.specialty} · {doctor.hospital}, {doctor.city}</p>
        </div>
        <span className={`pill ${doctor.verification?.status === "approved" ? "pill-status-in_range" : "pill-status-watch"}`}>
          <ShieldCheck size={14} /> {doctor.verification?.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card">
          <CalendarClock className="text-indigo-500 mb-2" size={20} />
          <div className="text-2xl font-bold">{todaysAppointments.length}</div>
          <div className="text-sm text-gray-500">Appointments today</div>
        </div>
        <div className="card">
          <Clock className="text-indigo-500 mb-2" size={20} />
          <div className="text-2xl font-bold">{upcoming.length}</div>
          <div className="text-sm text-gray-500">Upcoming</div>
        </div>
        <div className="card">
          <Users className="text-indigo-500 mb-2" size={20} />
          <div className="text-2xl font-bold">{uniquePatients}</div>
          <div className="text-sm text-gray-500">Patients seen</div>
          <Link to="/doctor/patients" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">View all →</Link>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-indigo-700">Today's schedule</h2>
          <Link to="/doctor/appointments" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {todaysAppointments.length ? todaysAppointments.map((a) => (
            <div key={a._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-3">
              <div className="text-sm">
                <div className="font-semibold">{a.patient?.fullName}</div>
                <div className="text-xs text-gray-500">{new Date(a.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {a.reasonForVisit || "General consult"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="pill pill-status-in_range capitalize">{a.status}</span>
                <Link to={`/doctor/consult/${a._id}`} className="btn-accent text-xs px-3 py-1.5">Start</Link>
              </div>
            </div>
          )) : <p className="text-sm text-gray-400">No appointments today.</p>}
        </div>
      </div>
    </AppShell>
  );
}
