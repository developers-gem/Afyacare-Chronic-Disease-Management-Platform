import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Auth() {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-terracotta-50 flex items-center justify-center mb-3">
            <HeartPulse className="text-terracotta-500" size={26} />
          </div>

          <h1 className="text-2xl font-bold text-indigo-700">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {mode === "login"
              ? "Sign in to continue your care."
              : "We'll text and WhatsApp your medication reminders."}
          </p>
        </div>

        {error && (
          <div className="mb-4 text-sm bg-terracotta-50 text-terracotta-700 border border-terracotta-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Full name
              </label>

              <input
                className="input mt-1"
                value={form.fullName}
                onChange={update("fullName")}
                required
              />
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Phone (with country code)
              </label>

              <input
                className="input mt-1"
                placeholder="+2348012345678"
                value={form.phone}
                onChange={update("phone")}
                required
              />
            </div>
          )}

          {/* Role Dropdown - Only during registration */}
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Select Role
              </label>

              <select
                className="input mt-1"
                value={form.role}
                onChange={update("role")}
                required
              >
                <option value="patient">Patient</option>

                {/* <option value="family_caregiver">Family Caregiver</option> */}

                <option value="doctor">Doctor</option>

                <option value="dietitian">Dietitian</option>

                {/* <option value="admin">Admin</option> */}

                {/* <option value="super_admin">Super Admin</option> */}

                <option value="support_staff">Support Staff</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>

            <input
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              className="input mt-1"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full justify-center flex disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            className="text-indigo-600 font-semibold hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
