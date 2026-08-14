import { useEffect, useState } from "react";
import api from "../api/client.js";
import AppShell from "../components/AppShell.jsx";

export default function Diet() {
  const [assigned, setAssigned] = useState(null);
  const [dayIdx, setDayIdx] = useState(new Date().getDay());

  useEffect(() => {
    api.get("/diet/mine").then(({ data }) => setAssigned(data.assigned)).catch(() => setAssigned(null));
  }, []);

  const day = assigned?.plan?.days?.find((d) => d.dayOfWeek === dayIdx);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const completeMeal = async (slot) => {
    await api.put("/diet/mine/complete", { date: new Date(), slot, completed: true });
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-indigo-700">Diet plans</h1>
      <p className="text-gray-500 mt-1">Built around meals you already love. Tuned for steadier sugar and gentler blood pressure.</p>

      {!assigned ? (
        <div className="card mt-6 text-center py-12">
          <p className="text-gray-500">No diet plan assigned yet. Ask your dietitian on a teleconsult to set one up for you.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mt-6 overflow-x-auto">
            {dayNames.map((name, i) => (
              <button
                key={i}
                onClick={() => setDayIdx(i)}
                className={dayIdx === i ? "btn-primary shrink-0" : "btn-outline shrink-0"}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {(day?.meals || []).map((meal) => (
              <div key={meal._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-sage-600 uppercase tracking-wide">{meal.slot}</span>
                  <div className="flex gap-1">
                    {(meal.tags || []).map((t) => (
                      <span key={t} className="pill bg-gold-50 text-gold-600">{t}</span>
                    ))}
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{meal.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{meal.instructions}</p>
                <button onClick={() => completeMeal(meal.slot)} className="btn-outline text-xs mt-3">Mark eaten</button>
              </div>
            ))}
            {!day?.meals?.length && <p className="text-sm text-gray-400">No meals planned for {dayNames[dayIdx]}.</p>}
          </div>
        </>
      )}
    </AppShell>
  );
}
