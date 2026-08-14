import { useEffect, useState } from "react";
import api from "../api/client.js";
import AppShell from "../components/AppShell.jsx";

const SCOPES = [
  ["bpReadings", "Blood pressure readings"],
  ["glucoseReadings", "Glucose readings"],
  ["medications", "Medications"],
  ["appointments", "Appointments"],
  ["dietPlans", "Diet plans"],
  ["healthTrends", "Health trends"],
  ["emergencyAlerts", "Emergency alerts"],
];

export default function Consent() {
  const [consents, setConsents] = useState([]);

  const load = () => api.get("/consent/granted-by-me").then(({ data }) => setConsents(data.consents));
  useEffect(() => { load(); }, []);

  const toggle = async (consent, key) => {
    const scopes = { ...consent.scopes, [key]: !consent.scopes[key] };
    await api.put(`/consent/${consent.grantee._id}`, { scopes });
    load();
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Consent & privacy</h1>
      <p className="text-gray-500 mt-1">Family members choose exactly what to share — readings, medications, or just emergency alerts.</p>

      <div className="space-y-4 mt-6">
        {consents.map((c) => (
          <div key={c._id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {c.grantee?.fullName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{c.grantee?.fullName}</div>
                <div className="text-xs text-gray-500 capitalize">{c.grantee?.role?.replace("_", " ")}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCOPES.map(([key, label]) => (
                <label key={key} className="flex items-center justify-between bg-sand-50 rounded-lg px-3 py-2 text-sm">
                  {label}
                  <input type="checkbox" checked={!!c.scopes[key]} onChange={() => toggle(c, key)} />
                </label>
              ))}
            </div>
          </div>
        ))}
        {!consents.length && <p className="text-sm text-gray-400">No one has consent to view your data yet.</p>}
      </div>
    </AppShell>
  );
}
