import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, HeartPulse, Activity, Pill, Users } from "lucide-react";
import planImage from "../assets/afycare.jpg";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

  const takenCount = doses.filter((dose) => dose.status === "taken").length;

  const chartData = bp.map((reading, index) => ({
    date: new Date(reading.measuredAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    systolic: reading.systolic,
    glucose: glucose[index]?.value,
  }));

  return (
    <AppShell>
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-slate-800">
          Habari, {user?.fullName?.split(" ")[0]} 👋
        </h1>

        <p className="mt-2 text-base md:text-lg text-slate-500">
          Here's how your heart and sugar are doing today. Small steps, every
          day.
        </p>
      </div>

      {/* Today's Plan */}
      {/* Today's Plan */}
      <section className="mt-6 overflow-hidden rounded-3xl bg-[#2D3B5B] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Left Content */}
          <div className="px-6 py-5 md:px-8 md:py-6 md:w-3/4">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full bg-[#4B5978] px-3 py-1">
              <span className="text-xs font-semibold text-white">
                Today's plan
              </span>
            </div>

            {/* Main Content */}
            <h2 className="mt-3 text-xl md:text-2xl font-bold leading-tight text-white">
              You're on track — 3 readings left, dinner is light pepper soup.
            </h2>

            <p className="mt-2 text-sm md:text-base text-slate-300">
              Your BP is trending down for the 3rd day. Keep going and check in
              with Dr. Adaeze at 3:30 PM.
            </p>

            {/* Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-10">
              <Link
                to="/medications"
                className="rounded-full bg-[#E7785A] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Take meds
              </Link>

              <Link
                to="/diet"
                className="rounded-full bg-[#4B5978] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#5A6887]"
              >
                See diet plan
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-48 w-full md:h-auto md:w-1/2">
            <img
              src={planImage}
              alt="Today's health plan"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 mt-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Heart}
          label="Blood pressure"
          value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"}
          unit="mmHg"
          status={latestBp?.status}
        />

        <StatCard
          icon={Activity}
          label="Blood glucose"
          value={latestGlucose ? latestGlucose.value : "—"}
          unit="mg/dL"
          status={latestGlucose?.status}
        />

        <StatCard
          icon={Pill}
          label="Meds today"
          value={`${takenCount}/${doses.length}`}
          unit="taken"
        />

        <StatCard
          icon={Users}
          label="Family circle"
          value={circle.watching?.length ?? 0}
          unit="watching"
        />
      </div>

      {/* 14-Day Trend */}
      <div className="card mt-8">
        <h2 className="font-semibold text-xl text-slate-700 mb-1">
          14-day trend
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Systolic BP and glucose, side by side.
        </p>

        {!loading && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6D8" />

              <XAxis dataKey="date" fontSize={12} stroke="#8891A8" />

              <YAxis fontSize={12} stroke="#8891A8" />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#26355D"
                strokeWidth={2}
                dot={false}
                name="Systolic"
              />

              <Line
                type="monotone"
                dataKey="glucose"
                stroke="#E2725B"
                strokeWidth={2}
                dot={false}
                name="Glucose"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">
            No readings logged yet.
          </div>
        )}
      </div>

      {/* Family Circle and Medication Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        {/* Family Circle */}
        <div className="card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-4">
            Family circle
          </h2>

          <div className="space-y-3">
            {circle.watching?.length ? (
              circle.watching.map((link) => (
                <div
                  key={link._id}
                  className="flex items-center gap-3 bg-sand-50 rounded-lg p-3"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {link.patient?.fullName?.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="text-sm">
                    <div className="font-semibold">
                      {link.patient?.fullName}
                    </div>

                    <div className="text-gray-500 text-xs">
                      {link.relationship}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No one in your family circle yet.
              </p>
            )}
          </div>

          <Link to="/family" className="btn-outline text-sm mt-4 inline-block">
            Manage family
          </Link>
        </div>

        {/* Today's Medication Schedule */}
        <div className="card">
          <h2 className="font-semibold text-lg text-indigo-700 mb-4">
            Today's medication schedule
          </h2>

          <div className="space-y-3">
            {doses.length ? (
              doses.map((dose) => (
                <div
                  key={dose._id}
                  className="flex items-center justify-between bg-sand-50 rounded-lg p-3"
                >
                  <div className="text-sm">
                    <div className="font-semibold">
                      {dose.medication?.name} {dose.medication?.dose}
                    </div>

                    <div className="text-gray-500 text-xs">
                      {new Date(dose.scheduledFor).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <span
                    className={`pill pill-status-${
                      dose.status === "taken"
                        ? "in_range"
                        : dose.status === "missed"
                          ? "high"
                          : "watch"
                    }`}
                  >
                    {dose.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No doses scheduled today.</p>
            )}
          </div>

          <Link
            to="/medications"
            className="btn-outline text-sm mt-4 inline-block"
          >
            Go to medications
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, unit, status }) {
  return (
    <div className="card min-h-[150px] flex flex-col justify-center">
      <div className="flex items-center justify-between mb-3">
        <Icon className="text-slate-700" size={21} />

        {status && (
          <span className={`pill pill-status-${status}`}>
            {status.replace("_", " ")}
          </span>
        )}
      </div>

      <div className="text-3xl font-bold text-slate-800">
        {value}

        <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
      </div>

      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}
