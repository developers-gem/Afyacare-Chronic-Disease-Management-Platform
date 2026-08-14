import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

export default function Vitals() {
  const { user } = useAuth();
  const [tab, setTab] = useState("bp");
  const [bp, setBp] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [bpForm, setBpForm] = useState({ systolic: "", diastolic: "", pulse: "" });
  const [glForm, setGlForm] = useState({ value: "", context: "fasting" });
  const [busy, setBusy] = useState(false);

  const loadAll = () => {
    api.get(`/vitals/bp/${user.id}?days=14`).then(({ data }) => setBp(data.readings));
    api.get(`/vitals/glucose/${user.id}?days=14`).then(({ data }) => setGlucose(data.readings));
  };

  useEffect(() => {
    if (user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveBp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/vitals/bp/${user.id}`, {
        systolic: Number(bpForm.systolic), diastolic: Number(bpForm.diastolic), pulse: Number(bpForm.pulse) || undefined,
      });
      setBpForm({ systolic: "", diastolic: "", pulse: "" });
      loadAll();
    } finally {
      setBusy(false);
    }
  };

  const saveGlucose = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/vitals/glucose/${user.id}`, { value: Number(glForm.value), context: glForm.context });
      setGlForm({ value: "", context: "fasting" });
      loadAll();
    } finally {
      setBusy(false);
    }
  };

  const bpChart = bp.slice().reverse().map((r) => ({
    date: new Date(r.measuredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    systolic: r.systolic, diastolic: r.diastolic,
  }));
  const glChart = glucose.slice().reverse().map((r) => ({
    date: new Date(r.measuredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: r.value,
  }));

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">BP & Glucose logs</h1>
      <p className="text-gray-500 mt-1">Tracking is treatment — a few seconds a day catches problems early.</p>

      <div className="flex gap-2 mt-6">
        <button onClick={() => setTab("bp")} className={tab === "bp" ? "btn-primary" : "btn-outline"}>Blood pressure</button>
        <button onClick={() => setTab("glucose")} className={tab === "glucose" ? "btn-primary" : "btn-outline"}>Blood glucose</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-4">
            {tab === "bp" ? "Systolic & diastolic — last 14 days" : "Glucose — last 14 days"}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            {tab === "bp" ? (
              <LineChart data={bpChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D8" />
                <XAxis dataKey="date" fontSize={12} stroke="#8891A8" />
                <YAxis fontSize={12} stroke="#8891A8" />
                <Tooltip />
                <Line type="monotone" dataKey="systolic" stroke="#26355D" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#D9A441" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <LineChart data={glChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D8" />
                <XAxis dataKey="date" fontSize={12} stroke="#8891A8" />
                <YAxis fontSize={12} stroke="#8891A8" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#E2725B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>

          <h3 className="font-semibold text-indigo-700 mt-6 mb-3">Recent readings</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(tab === "bp" ? bp : glucose).map((r) => (
              <div key={r._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-3">
                <div className="text-sm">
                  {tab === "bp" ? (
                    <div className="font-semibold">{r.systolic}/{r.diastolic} mmHg <span className="text-gray-400 font-normal">Pulse {r.pulse}</span></div>
                  ) : (
                    <div className="font-semibold">{r.value} mg/dL <span className="text-gray-400 font-normal capitalize">{r.context.replace("_", " ")}</span></div>
                  )}
                  <div className="text-xs text-gray-500">{new Date(r.measuredAt).toLocaleString()}</div>
                </div>
                <span className={`pill pill-status-${r.status}`}>{r.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card h-fit">
          <h2 className="font-semibold text-lg text-indigo-700 mb-1">
            {tab === "bp" ? "Log a reading" : "Log glucose"}
          </h2>
          <p className="text-sm text-gray-500 mb-4">Sit still for 5 minutes before measuring.</p>

          {tab === "bp" ? (
            <form onSubmit={saveBp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Systolic</label>
                  <input required type="number" className="input mt-1" value={bpForm.systolic} onChange={(e) => setBpForm((f) => ({ ...f, systolic: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Diastolic</label>
                  <input required type="number" className="input mt-1" value={bpForm.diastolic} onChange={(e) => setBpForm((f) => ({ ...f, diastolic: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Pulse</label>
                <input type="number" className="input mt-1" value={bpForm.pulse} onChange={(e) => setBpForm((f) => ({ ...f, pulse: e.target.value }))} />
              </div>
              <button disabled={busy} className="btn-accent w-full justify-center flex disabled:opacity-60">+ Save reading</button>
            </form>
          ) : (
            <form onSubmit={saveGlucose} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Value (mg/dL)</label>
                <input required type="number" className="input mt-1" value={glForm.value} onChange={(e) => setGlForm((f) => ({ ...f, value: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Context</label>
                <select className="input mt-1" value={glForm.context} onChange={(e) => setGlForm((f) => ({ ...f, context: e.target.value }))}>
                  <option value="fasting">Fasting</option>
                  <option value="post_meal">Post-meal</option>
                  <option value="random">Random</option>
                </select>
              </div>
              <button disabled={busy} className="btn-accent w-full justify-center flex disabled:opacity-60">+ Save reading</button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
