import { useEffect, useState } from "react";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);

  const load = () => api.get("/admin/doctors/pending").then(({ data }) => setDoctors(data.doctors));
  useEffect(() => { load(); }, []);

  const verify = async (id, status) => {
    await api.put(`/doctors/${id}/verify`, { status });
    load();
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Doctor verification</h1>
      <p className="text-gray-500 mt-1">Review license and documents before approving a doctor to the directory.</p>

      <div className="space-y-3 mt-6">
        {doctors.map((d) => (
          <div key={d._id} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">{d.user?.fullName}</div>
              <div className="text-sm text-gray-500">{d.specialty} · {d.hospital}, {d.city} · License {d.licenseNumber}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => verify(d._id, "approved")} className="btn-accent text-sm">Approve</button>
              <button onClick={() => verify(d._id, "rejected")} className="btn-outline text-sm">Reject</button>
            </div>
          </div>
        ))}
        {!doctors.length && <p className="text-sm text-gray-400">No pending doctor applications.</p>}
      </div>
    </AppShell>
  );
}
