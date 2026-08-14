import { useEffect, useState } from "react";
import api from "../api/client.js";

export function useDoctorProfile() {
  const [doctor, setDoctor] = useState(undefined); // undefined = loading, null = not onboarded
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    api
      .get("/doctors/me/profile")
      .then(({ data }) => setDoctor(data.doctor))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  return { doctor, loading, reload };
}
