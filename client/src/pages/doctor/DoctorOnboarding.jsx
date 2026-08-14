import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client.js";
import AppShell from "../../components/AppShell.jsx";

const empty = {
  specialty: "", hospital: "", city: "", country: "", licenseNumber: "",
  qualifications: "", yearsExperience: "", languages: "", feeAmount: "", feeCurrency: "NGN",
};

export default function DoctorOnboarding() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/doctors", {
        specialty: form.specialty,
        hospital: form.hospital,
        city: form.city,
        country: form.country,
        licenseNumber: form.licenseNumber,
        qualifications: form.qualifications.split(",").map((q) => q.trim()).filter(Boolean),
        yearsExperience: Number(form.yearsExperience) || undefined,
        languages: form.languages.split(",").map((l) => l.trim()).filter(Boolean),
        consultationFee: { amount: Number(form.feeAmount) || 0, currency: form.feeCurrency },
      });
      navigate("/doctor");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Set up your doctor profile</h1>
      <p className="text-gray-500 mt-1">This goes to Afyacare admin for license verification before you appear in the directory.</p>

      {error && <div className="mt-4 text-sm bg-terracotta-50 text-terracotta-700 border border-terracotta-100 rounded-lg px-3 py-2">{error}</div>}

      <form onSubmit={submit} className="card mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Specialty"><input required className="input" value={form.specialty} onChange={update("specialty")} /></Field>
        <Field label="License number"><input required className="input" value={form.licenseNumber} onChange={update("licenseNumber")} /></Field>
        <Field label="Hospital"><input className="input" value={form.hospital} onChange={update("hospital")} /></Field>
        <Field label="City"><input className="input" value={form.city} onChange={update("city")} /></Field>
        <Field label="Country"><input className="input" value={form.country} onChange={update("country")} /></Field>
        <Field label="Years of experience"><input type="number" className="input" value={form.yearsExperience} onChange={update("yearsExperience")} /></Field>
        <Field label="Qualifications (comma-separated)"><input className="input" value={form.qualifications} onChange={update("qualifications")} placeholder="MBBS, FWACP" /></Field>
        <Field label="Languages (comma-separated)"><input className="input" value={form.languages} onChange={update("languages")} placeholder="English, Yoruba" /></Field>
        <Field label="Consultation fee">
          <div className="flex gap-2">
            <select className="input w-28" value={form.feeCurrency} onChange={update("feeCurrency")}>
              <option>NGN</option><option>GHS</option><option>KES</option><option>USD</option>
            </select>
            <input type="number" className="input" value={form.feeAmount} onChange={update("feeAmount")} />
          </div>
        </Field>

        <button disabled={busy} className="btn-primary md:col-span-2 justify-center flex disabled:opacity-60">
          {busy ? "Submitting…" : "Submit for verification"}
        </button>
      </form>
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
