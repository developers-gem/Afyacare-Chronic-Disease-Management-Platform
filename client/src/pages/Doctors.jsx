import { useEffect, useState } from "react";
import { Star, MapPin } from "lucide-react";
import api from "../api/client.js";
import AppShell from "../components/AppShell.jsx";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [q, setQ] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [booking, setBooking] = useState(false);

  const loadDoctors = () => api.get("/doctors", { params: q ? { q } : {} }).then(({ data }) => setDoctors(data.doctors));
  const loadAppointments = () => api.get("/appointments/mine").then(({ data }) => setAppointments(data.appointments));

  useEffect(() => { loadDoctors(); loadAppointments(); }, []); // eslint-disable-line

  const openBooking = async (doctor) => {
    setSelectedDoctor(doctor);
    const { data } = await api.get(`/availability/${doctor._id}/slots`, { params: { date } });
    setSlots(data.slots);
  };

  const book = async (slot) => {
    setBooking(true);
    try {
      await api.post("/appointments", { doctorId: selectedDoctor._id, start: slot.start, end: slot.end });
      setSelectedDoctor(null);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || "Could not book that slot");
    } finally {
      setBooking(false);
    }
  };

  const cancel = async (id) => {
    await api.put(`/appointments/${id}/cancel`, { reason: "Patient cancelled" });
    loadAppointments();
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Doctors & appointments</h1>
      <p className="text-gray-500 mt-1">Vetted clinicians. Most consults connect within 30 minutes.</p>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">Your appointments</h2>
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-3">
              <div className="text-sm">
                <div className="font-semibold">{a.doctor?.user?.fullName || a.patient?.fullName}</div>
                <div className="text-xs text-gray-500">{new Date(a.scheduledStart).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="pill pill-status-in_range capitalize">{a.status.replace("_", " ")}</span>
                {["booked", "confirmed"].includes(a.status) && (
                  <button onClick={() => cancel(a._id)} className="text-xs text-terracotta-500 hover:underline">Cancel</button>
                )}
              </div>
            </div>
          ))}
          {!appointments.length && <p className="text-sm text-gray-400">No appointments yet.</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <input className="input max-w-sm" placeholder="Search by specialty, city, hospital…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={loadDoctors} className="btn-outline">Search</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {doctors.map((doc) => (
          <div key={doc._id} className="card flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                {doc.user?.fullName?.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="font-semibold flex items-center gap-1">
                  {doc.user?.fullName}
                  <span className="text-gold-600 text-xs flex items-center gap-0.5"><Star size={12} fill="currentColor" /> {doc.rating}</span>
                </div>
                <div className="text-sm text-gray-500">{doc.specialty}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12} /> {doc.hospital} · {doc.city}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">{doc.consultationFee?.currency} {doc.consultationFee?.amount?.toLocaleString()}</div>
              <button onClick={() => openBooking(doc)} className="btn-accent text-sm mt-2">Book</button>
            </div>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setSelectedDoctor(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg text-indigo-700 mb-1">Book {selectedDoctor.user?.fullName}</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedDoctor.specialty} · {selectedDoctor.hospital}</p>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input type="date" className="input mt-1 mb-4" value={date} onChange={async (e) => {
              setDate(e.target.value);
              const { data } = await api.get(`/availability/${selectedDoctor._id}/slots`, { params: { date: e.target.value } });
              setSlots(data.slots);
            }} />
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {slots.map((s, i) => (
                <button key={i} disabled={booking} onClick={() => book(s)} className="btn-outline text-sm py-2 disabled:opacity-50">
                  {new Date(s.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </button>
              ))}
              {!slots.length && <p className="col-span-3 text-sm text-gray-400">No slots available that day.</p>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
