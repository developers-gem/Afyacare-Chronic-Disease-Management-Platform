import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

export default function Family() {
  const { user } = useAuth();
  const [circle, setCircle] = useState({ watchedBy: [], watching: [] });
  const [readings, setReadings] = useState({});
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ emailOrPhone: "", relationship: "" });
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get("/family/my-circle").then(async ({ data }) => {
      setCircle(data);
      const map = {};
      for (const link of data.watching) {
        try {
          const [bpRes, glRes] = await Promise.all([
            api.get(`/vitals/bp/${link.patient._id}?days=1&limit=1`),
            api.get(`/vitals/glucose/${link.patient._id}?days=1&limit=1`),
          ]);
          map[link.patient._id] = { bp: bpRes.data.readings[0], glucose: glRes.data.readings[0] };
        } catch {
          map[link.patient._id] = {};
        }
      }
      setReadings(map);
    });
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const sendInvite = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/family/invite", invite);
      setInvite({ emailOrPhone: "", relationship: "" });
      setShowInvite(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  const respond = async (linkId, accept) => {
    await api.put(`/family/invite/${linkId}/respond`, { accept });
    load();
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Family circle</h1>
          <p className="text-gray-500 mt-1">Stay close to the people you love. Consent first, always.</p>
        </div>
        <button onClick={() => setShowInvite((s) => !s)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Invite family
        </button>
      </div>

      {showInvite && (
        <form onSubmit={sendInvite} className="card mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-gray-700">Email or phone</label>
            <input required className="input mt-1" value={invite.emailOrPhone} onChange={(e) => setInvite((f) => ({ ...f, emailOrPhone: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Relationship</label>
            <input required className="input mt-1" placeholder="Mother, Father, Aunt…" value={invite.relationship} onChange={(e) => setInvite((f) => ({ ...f, relationship: e.target.value }))} />
          </div>
          <button disabled={busy} className="btn-accent justify-center flex disabled:opacity-60">Send invite</button>
        </form>
      )}

      {circle.watchedBy?.some((l) => l.status === "pending") && (
        <div className="card mt-6">
          <h2 className="font-semibold text-lg text-indigo-700 mb-3">Pending invitations</h2>
          {circle.watchedBy.filter((l) => l.status === "pending").map((l) => (
            <div key={l._id} className="flex items-center justify-between bg-gold-50 rounded-lg p-3 mb-2">
              <div className="text-sm">{l.caregiver?.fullName || l.invitedEmailOrPhone} wants to watch your health as your {l.relationship}.</div>
              <div className="flex gap-2">
                <button onClick={() => respond(l._id, true)} className="btn-accent text-xs px-3 py-1.5">Accept</button>
                <button onClick={() => respond(l._id, false)} className="btn-outline text-xs px-3 py-1.5">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">People you care for</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {circle.watching?.filter((l) => l.status === "accepted").map((link) => {
            const r = readings[link.patient._id] || {};
            const alertGlucose = r.glucose?.status === "high" || r.glucose?.status === "critical";
            const alertBp = r.bp?.status === "high" || r.bp?.status === "critical";
            return (
              <div key={link._id} className="border border-sand-200 rounded-xl2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {link.patient.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{link.patient.fullName}</div>
                      <div className="text-xs text-gray-500">{link.relationship}</div>
                    </div>
                  </div>
                  {(alertGlucose || alertBp) && <span className="pill pill-status-high">Alert</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm bg-sand-50 rounded-lg p-3">
                  <div><div className="text-gray-500 text-xs">Last BP</div><div className="font-semibold">{r.bp ? `${r.bp.systolic}/${r.bp.diastolic}` : "—"}</div></div>
                  <div><div className="text-gray-500 text-xs">Last glucose</div><div className="font-semibold">{r.glucose ? `${r.glucose.value} mg/dL` : "—"}</div></div>
                </div>
              </div>
            );
          })}
          {!circle.watching?.filter((l) => l.status === "accepted").length && (
            <p className="text-sm text-gray-400">No one in your family circle yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
