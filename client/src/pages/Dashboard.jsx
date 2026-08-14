import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartPulse, Activity, Pill, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [bp, setBp] = useState([]);
  const [glucose, setGlucose] = useState([]);
  const [doses, setDoses] = useState([]);
  const [circle, setCircle] = useState({ watching: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get(`/vitals/bp/${user.id}?days=14`),
      api.get(`/vitals/glucose/${user.id}?days=14`),
      api.get(`/medications/${user.id}/schedule/today`),
      api.get(`/family/my-circle`),
    ])
      .then(([bpRes, glRes, doseRes, circleRes]) => {
        setBp(bpRes.data.readings.slice().reverse());
        setGlucose(glRes.data.readings.slice().reverse());
        setDoses(doseRes.data.doses);
        setCircle(circleRes.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const latestBp = bp[bp.length - 1];
  const latestGlucose = glucose[glucose.length - 1];
  const takenCount = doses.filter((d) => d.status === "taken").length;

  const chartData = bp.map((b, i) => ({
    date: new Date(b.measuredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    systolic: b.systolic,
    glucose: glucose[i]?.value,
  }));

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Habari, {user?.fullName?.split(" ")[0]} 👋</h1>
      <p className="text-gray-500 mt-1">Here's how your heart and sugar are doing today.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <StatCard icon={HeartPulse} label="Blood pressure" value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"} unit="mmHg" status={latestBp?.status} />
        <StatCard icon={Activity} label="Blood glucose" value={latestGlucose ? latestGlucose.value : "—"} unit="mg/dL" status={latestGlucose?.status} />
        <StatCard icon={Pill} label="Meds today" value={`${takenCount}/${doses.length}`} unit="taken" />
        <StatCard icon={Users} label="Family circle" value={circle.watching?.length ?? 0} unit="watching" />
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-1">14-day trend</h2>
        <p className="text-sm text-gray-500 mb-4">Systolic BP and glucose, side by side.</p>
        {!loading && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D8" />
              <XAxis dataKey="date" fontSize={12} stroke="#8891A8" />
              <YAxis fontSize={12} stroke="#8891A8" />
              <Tooltip />
              <Line type="monotone" dataKey="systolic" stroke="#26355D" strokeWidth={2} dot={false} name="Systolic" />
              <Line type="monotone" dataKey="glucose" stroke="#E2725B" strokeWidth={2} dot={false} name="Glucose" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-gray-400 py-10 text-center">No readings logged yet.</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-4">Family circle</h2>
          <div className="space-y-3">
            {circle.watching?.length ? circle.watching.map((link) => (
              <div key={link._id} className="flex items-center gap-3 bg-sand-50 rounded-lg p-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {link.patient?.fullName?.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{link.patient?.fullName}</div>
                  <div className="text-gray-500 text-xs">{link.relationship}</div>
                </div>
              </div>
            )) : <p className="text-sm text-gray-400">No one in your family circle yet.</p>}
          </div>
          <Link to="/family" className="btn-outline text-sm mt-4 inline-block">Manage family</Link>
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-4">Today's medication schedule</h2>
          <div className="space-y-3">
            {doses.length ? doses.map((d) => (
              <div key={d._id} className="flex items-center justify-between bg-sand-50 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-semibold">{d.medication?.name} {d.medication?.dose}</div>
                  <div className="text-gray-500 text-xs">{new Date(d.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <span className={`pill pill-status-${d.status === "taken" ? "in_range" : d.status === "missed" ? "high" : "watch"}`}>
                  {d.status}
                </span>
              </div>
            )) : <p className="text-sm text-gray-400">No doses scheduled today.</p>}
          </div>
          <Link to="/medications" className="btn-outline text-sm mt-4 inline-block">Go to medications</Link>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, unit, status }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <Icon className="text-indigo-500" size={20} />
        {status && <span className={`pill pill-status-${status}`}>{status.replace("_", " ")}</span>}
      </div>
      <div className="text-2xl font-bold text-ink">{value} <span className="text-sm font-medium text-gray-400">{unit}</span></div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
