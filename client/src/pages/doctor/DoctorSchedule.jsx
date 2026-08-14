import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";
import { useDoctorProfile } from "../../hooks/useDoctorProfile.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorSchedule() {
  const { doctor, loading } = useDoctorProfile();
  const [availability, setAvailability] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    api.get(`/availability/${doctor._id}`).then(({ data }) => {
      setAvailability(
        data.availability || {
          weeklySchedule: [],
          consultationDurationMins: 20,
          bufferMins: 5,
          blockedDates: [],
        }
      );
    });
  }, [doctor]);

  if (loading) return <AppShell><div className="text-gray-400">Loading…</div></AppShell>;
  if (doctor === null) return <Navigate to="/doctor/onboarding" replace />;
  if (!availability) return <AppShell><div className="text-gray-400">Loading schedule…</div></AppShell>;

  const dayConfig = (dow) => availability.weeklySchedule.find((d) => d.dayOfWeek === dow);

  const toggleDay = (dow) => {
    setAvailability((a) => {
      const exists = a.weeklySchedule.some((d) => d.dayOfWeek === dow);
      return {
        ...a,
        weeklySchedule: exists
          ? a.weeklySchedule.filter((d) => d.dayOfWeek !== dow)
          : [...a.weeklySchedule, { dayOfWeek: dow, blocks: [{ start: "09:00", end: "13:00" }] }],
      };
    });
  };

  const updateBlock = (dow, idx, key, value) => {
    setAvailability((a) => ({
      ...a,
      weeklySchedule: a.weeklySchedule.map((d) =>
        d.dayOfWeek === dow ? { ...d, blocks: d.blocks.map((b, i) => (i === idx ? { ...b, [key]: value } : b)) } : d
      ),
    }));
  };

  const addBlock = (dow) => {
    setAvailability((a) => ({
      ...a,
      weeklySchedule: a.weeklySchedule.map((d) =>
        d.dayOfWeek === dow ? { ...d, blocks: [...d.blocks, { start: "15:00", end: "18:00" }] } : d
      ),
    }));
  };

  const removeBlock = (dow, idx) => {
    setAvailability((a) => ({
      ...a,
      weeklySchedule: a.weeklySchedule.map((d) =>
        d.dayOfWeek === dow ? { ...d, blocks: d.blocks.filter((_, i) => i !== idx) } : d
      ),
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/availability/${doctor._id}`, availability);
      setAvailability(data.availability);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Availability</h1>
      <p className="text-gray-500 mt-1">Set your weekly hours — patients can only book bookable, open slots.</p>

      <div className="card mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Consult duration (mins)</label>
          <input type="number" className="input mt-1" value={availability.consultationDurationMins}
            onChange={(e) => setAvailability((a) => ({ ...a, consultationDurationMins: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Buffer (mins)</label>
          <input type="number" className="input mt-1" value={availability.bufferMins}
            onChange={(e) => setAvailability((a) => ({ ...a, bufferMins: Number(e.target.value) }))} />
        </div>
      </div>

      <div className="space-y-3 mt-6">
        {DAYS.map((name, dow) => {
          const config = dayConfig(dow);
          return (
            <div key={dow} className="card">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 font-semibold">
                  <input type="checkbox" checked={!!config} onChange={() => toggleDay(dow)} />
                  {name}
                </label>
                {config && (
                  <button onClick={() => addBlock(dow)} className="text-sm text-indigo-600 flex items-center gap-1">
                    <Plus size={14} /> Add block
                  </button>
                )}
              </div>
              {config && (
                <div className="mt-3 space-y-2">
                  {config.blocks.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" className="input w-32" value={b.start} onChange={(e) => updateBlock(dow, i, "start", e.target.value)} />
                      <span className="text-gray-400">to</span>
                      <input type="time" className="input w-32" value={b.end} onChange={(e) => updateBlock(dow, i, "end", e.target.value)} />
                      <button onClick={() => removeBlock(dow, i)} className="text-terracotta-500"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : "Save schedule"}</button>
        {saved && <span className="text-sage-600 text-sm font-medium">Saved ✓</span>}
      </div>
    </AppShell>
  );
}
