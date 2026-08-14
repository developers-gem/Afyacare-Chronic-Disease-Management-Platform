import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Activity, Pill, Salad, Video, Users, ShieldCheck,
  Stethoscope, LayoutList, HeartPulse, CalendarClock, Clock4,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const patientNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Health Profile", icon: HeartPulse },
  { to: "/vitals", label: "BP & Glucose", icon: Activity },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/diet", label: "Diet Plans", icon: Salad },
  { to: "/doctors", label: "Doctors & Appointments", icon: Stethoscope },
  { to: "/teleconsult", label: "Teleconsult", icon: Video },
  { to: "/family", label: "Family", icon: Users },
  { to: "/consent", label: "Consent & Privacy", icon: ShieldCheck },
];

const doctorNav = [
  { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/doctor/patients", label: "My Patients", icon: Users },
  { to: "/doctor/schedule", label: "Availability", icon: Clock4 },
];

const adminNav = [
  { to: "/admin", label: "Admin Dashboard", icon: LayoutList },
  { to: "/admin/doctors", label: "Doctor Verification", icon: Stethoscope },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = ["admin", "super_admin", "support_staff"].includes(user?.role)
    ? adminNav
    : user?.role === "doctor"
      ? doctorNav
      : patientNav;

  return (
    <aside className="w-64 shrink-0 bg-indigo-600 text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-10 h-10 rounded-xl2 bg-terracotta-500 flex items-center justify-center">
          <HeartPulse size={20} />
        </div>
        <div>
          <div className="font-bold leading-tight">Afyacare</div>
          <div className="text-xs text-indigo-100">Chronic care, simplified</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/" || to === "/admin" || to === "/doctor"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-white/15 text-white" : "text-indigo-100 hover:bg-white/10"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gold-400 text-indigo-900 flex items-center justify-center text-sm font-bold">
            {user?.fullName?.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-sm">
            <div className="font-semibold">{user?.fullName}</div>
            <div className="text-indigo-100 text-xs capitalize">{user?.role?.replace("_", " ")}</div>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-indigo-100 hover:text-white underline">
          Sign out
        </button>
      </div>
    </aside>
  );
}
