import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Auth from "./pages/Auth.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Vitals from "./pages/Vitals.jsx";
import Medications from "./pages/Medications.jsx";
import Family from "./pages/Family.jsx";
import Consent from "./pages/Consent.jsx";
import Doctors from "./pages/Doctors.jsx";
import Teleconsult from "./pages/Teleconsult.jsx";
import Diet from "./pages/Diet.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminDoctors from "./pages/admin/AdminDoctors.jsx";
import DoctorOnboarding from "./pages/doctor/DoctorOnboarding.jsx";
import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import DoctorAppointments from "./pages/doctor/DoctorAppointments.jsx";
import DoctorSchedule from "./pages/doctor/DoctorSchedule.jsx";
import DoctorConsultation from "./pages/doctor/DoctorConsultation.jsx";
import DoctorPatients from "./pages/doctor/DoctorPatients.jsx";
import DoctorPatientDetail from "./pages/doctor/DoctorPatientDetail.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />

      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/vitals" element={<ProtectedRoute><Vitals /></ProtectedRoute>} />
      <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
      <Route path="/family" element={<ProtectedRoute><Family /></ProtectedRoute>} />
      <Route path="/consent" element={<ProtectedRoute><Consent /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
      <Route path="/teleconsult/:appointmentId?" element={<ProtectedRoute><Teleconsult /></ProtectedRoute>} />
      <Route path="/diet" element={<ProtectedRoute><Diet /></ProtectedRoute>} />

      <Route
        path="/admin"
        element={<ProtectedRoute roles={["admin", "super_admin", "support_staff"]}><AdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin/doctors"
        element={<ProtectedRoute roles={["admin", "super_admin", "support_staff"]}><AdminDoctors /></ProtectedRoute>}
      />

      <Route path="/doctor/onboarding" element={<ProtectedRoute roles={["doctor"]}><DoctorOnboarding /></ProtectedRoute>} />
      <Route path="/doctor" element={<ProtectedRoute roles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute roles={["doctor"]}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/schedule" element={<ProtectedRoute roles={["doctor"]}><DoctorSchedule /></ProtectedRoute>} />
      <Route path="/doctor/consult/:appointmentId" element={<ProtectedRoute roles={["doctor"]}><DoctorConsultation /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute roles={["doctor"]}><DoctorPatients /></ProtectedRoute>} />
      <Route path="/doctor/patients/:patientId" element={<ProtectedRoute roles={["doctor"]}><DoctorPatientDetail /></ProtectedRoute>} />
    </Routes>
  );
}
