import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

const emptyForm = { name: "", dose: "", condition: "", frequency: "once_daily", times: "08:00" };

export default function Medications() {
  const { user } = useAuth();
  const [meds, setMeds] = useState([]);
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get(`/medications/${user.id}`).then(({ data }) => setMeds(data.medications));
    api.get(`/medications/${user.id}/schedule/today`).then(({ data }) => setDoses(data.doses));
    api.get(`/medications/${user.id}/adherence?days=7`).then(({ data }) => setAdherence(data.adherence));
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markDose = async (doseId, status) => {
    await api.put(`/medications/dose/${doseId}`, { status });
    load();
  };

  const addMedication = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/medications/${user.id}`, {
        ...form,
        times: form.times.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Medications</h1>
          <p className="text-gray-500 mt-1">Tap a dose to mark it taken. WhatsApp & SMS reminders are on.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add medication
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMedication} className="card mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input required className="input mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Dose</label>
            <input required className="input mt-1" placeholder="5 mg" value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Condition</label>
            <input className="input mt-1" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Frequency</label>
            <select className="input mt-1" value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
              <option value="once_daily">Once daily</option>
              <option value="twice_daily">Twice daily</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Times (comma-sep)</label>
            <input className="input mt-1" placeholder="08:00, 20:00" value={form.times} onChange={(e) => setForm((f) => ({ ...f, times: e.target.value }))} />
          </div>
          <button disabled={busy} className="btn-accent md:col-span-5 justify-center flex disabled:opacity-60">
            {busy ? "Saving…" : "Save medication"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card">
          <div className="text-sm text-gray-500">Adherence (7 days)</div>
          <div className="text-3xl font-bold text-ink mt-1">{adherence?.percentage ?? "—"}%</div>
          <div className="text-xs text-gray-400 mt-1">{adherence?.streakDays ?? 0}-day streak</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-3xl font-bold text-ink mt-1">
            {doses.filter((d) => d.status === "taken").length}/{doses.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">doses taken so far</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Missed (7 days)</div>
          <div className="text-3xl font-bold text-terracotta-600 mt-1">{adherence?.missed ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">out of {adherence?.total ?? 0} scheduled</div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">Today's schedule</h2>
        <div className="space-y-3">
          {doses.length ? doses.map((d) => (
            <div key={d._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => markDose(d._id, d.status === "taken" ? "pending" : "taken")}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    d.status === "taken" ? "bg-sage-500 border-sage-500 text-white" : "border-gray-300"
                  }`}
                >
                  {d.status === "taken" ? "✓" : ""}
                </button>
                <div>
                  <div className="font-semibold">{d.medication?.name} {d.medication?.dose}</div>
                  <div className="text-xs text-gray-500">{d.medication?.condition}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{new Date(d.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="flex gap-2 mt-1 justify-end">
                  <button onClick={() => markDose(d._id, "missed")} className="text-xs text-terracotta-500 hover:underline">Missed</button>
                  <button onClick={() => markDose(d._id, "skipped")} className="text-xs text-gray-400 hover:underline">Skip</button>
                </div>
              </div>
            </div>
          )) : <p className="text-sm text-gray-400">No doses scheduled today.</p>}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">All medications</h2>
        <div className="space-y-2">
          {meds.map((m) => (
            <div key={m._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-3">
              <div>
                <div className="font-semibold text-sm">{m.name} {m.dose}</div>
                <div className="text-xs text-gray-500">{m.condition} · {m.frequency.replace("_", " ")} · {(m.times || []).join(", ")}</div>
              </div>
              <span className={`pill ${m.isActive ? "pill-status-in_range" : "pill-status-watch"}`}>{m.isActive ? "Active" : "Inactive"}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
