import { CapabilityCard } from './CapabilityCard.js';
import { useEffect, useState } from 'react';

type Workout = {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then((data: { suggestions?: Workout[] }) => {
        setWorkouts(data.suggestions ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." />
      {loading ? (
        <p role="status">Loading…</p>
      ) : error ? (
        <p role="alert">Unable to load workout suggestions</p>
      ) : workouts.length === 0 ? (
        <p>No workout suggestions</p>
      ) : (
        <ul>
          {workouts.map((workout, index) => (
            <li key={workout.id ?? index}>
              <strong>{workout.name ?? workout.title ?? 'Workout'}</strong>
              {workout.description && <p>{workout.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
