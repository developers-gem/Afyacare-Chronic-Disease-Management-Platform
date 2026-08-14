import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Dashboard from "./Dashboard.jsx";

export default function Home() {
  const { user } = useAuth();
  if (["admin", "super_admin", "support_staff"].includes(user?.role))
    return <Navigate to="/admin" replace />;
  if (user?.role === "doctor") return <Navigate to="/doctor" replace />;
  return <Dashboard />;
}
