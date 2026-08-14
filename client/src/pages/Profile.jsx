import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get(`/patients/${user.id}`).then(({ data }) => setProfile(data.profile));
  }, [user]);

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const addContact = () =>
    setProfile((p) => ({ ...p, emergencyContacts: [...(p.emergencyContacts || []), { name: "", relationship: "", phone: "" }] }));
  const updateContact = (i, k, v) =>
    setProfile((p) => {
      const list = [...p.emergencyContacts];
      list[i] = { ...list[i], [k]: v };
      return { ...p, emergencyContacts: list };
    });
  const removeContact = (i) =>
    setProfile((p) => ({ ...p, emergencyContacts: p.emergencyContacts.filter((_, idx) => idx !== i) }));

  const addCondition = () =>
    setProfile((p) => ({ ...p, chronicConditions: [...(p.chronicConditions || []), { name: "" }] }));
  const updateCondition = (i, v) =>
    setProfile((p) => {
      const list = [...p.chronicConditions];
      list[i] = { ...list[i], name: v };
      return { ...p, chronicConditions: list };
    });
  const removeCondition = (i) =>
    setProfile((p) => ({ ...p, chronicConditions: p.chronicConditions.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put(`/patients/${user.id}`, profile);
      setProfile(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <AppShell>
        <div className="text-gray-400">Loading profile…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Health profile</h1>
      <p className="text-gray-500 mt-1">Keep this current so your care team and family have the right picture.</p>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">Personal information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date of birth">
            <input type="date" className="input" value={profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : ""} onChange={(e) => update("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className="input" value={profile.gender || ""} onChange={(e) => update("gender", e.target.value)}>
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Country"><input className="input" value={profile.country || ""} onChange={(e) => update("country", e.target.value)} /></Field>
          <Field label="City"><input className="input" value={profile.city || ""} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="Preferred language"><input className="input" value={profile.preferredLanguage || ""} onChange={(e) => update("preferredLanguage", e.target.value)} /></Field>
          <Field label="Timezone"><input className="input" value={profile.timezone || ""} onChange={(e) => update("timezone", e.target.value)} /></Field>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-indigo-700">Chronic conditions</h2>
          <button onClick={addCondition} className="text-sm text-indigo-600 flex items-center gap-1"><Plus size={16} /> Add</button>
        </div>
        <div className="space-y-2">
          {(profile.chronicConditions || []).map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" value={c.name} onChange={(e) => updateCondition(i, e.target.value)} placeholder="e.g. Hypertension" />
              <button onClick={() => removeCondition(i)} className="text-terracotta-500 shrink-0"><Trash2 size={18} /></button>
            </div>
          ))}
          {!profile.chronicConditions?.length && <p className="text-sm text-gray-400">No conditions recorded.</p>}
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-indigo-700">Emergency contacts</h2>
          <button onClick={addContact} className="text-sm text-indigo-600 flex items-center gap-1"><Plus size={16} /> Add</button>
        </div>
        <div className="space-y-3">
          {(profile.emergencyContacts || []).map((c, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <input className="input" placeholder="Name" value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} />
              <input className="input" placeholder="Relationship" value={c.relationship} onChange={(e) => updateContact(i, "relationship", e.target.value)} />
              <input className="input" placeholder="Phone" value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} />
              <button onClick={() => removeContact(i)} className="text-terracotta-500 justify-self-start"><Trash2 size={18} /></button>
            </div>
          ))}
          {!profile.emergencyContacts?.length && <p className="text-sm text-gray-400">No emergency contacts added.</p>}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-lg text-indigo-700 mb-4">Notification preferences</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["sms", "whatsapp", "email", "push"].map((ch) => (
            <label key={ch} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="checkbox"
                checked={!!profile.notificationPreferences?.[ch]}
                onChange={(e) =>
                  update("notificationPreferences", { ...profile.notificationPreferences, [ch]: e.target.checked })
                }
              />
              {ch}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-sage-600 text-sm font-medium">Saved ✓</span>}
      </div>
    </AppShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
