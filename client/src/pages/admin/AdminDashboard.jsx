import { useEffect, useState } from "react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";

export default function AdminDashboard() {
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => setTotals(data.totals));
  }, []);

  const cards = totals
    ? [
        ["Total patients", totals.totalPatients],
        ["Active patients", totals.activePatients],
        ["Verified doctors", totals.totalDoctors],
        ["Pending doctor reviews", totals.pendingDoctorVerifications],
        ["Upcoming appointments", totals.appointmentsUpcoming],
        ["Completed appointments", totals.appointmentsCompleted],
        ["Open health alerts", totals.openAlerts],
      ]
    : [];

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Admin dashboard</h1>
      <p className="text-gray-500 mt-1">Platform-wide overview.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {cards.map(([label, value]) => (
          <div key={label} className="card">
            <div className="text-3xl font-bold text-ink">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
