import { useEffect, useState } from 'react';

type Activity = {
  id?: string | number;
  _id?: string;
  name?: string;
  activity?: string;
  activity_type?: string;
  minutes?: number;
  points?: number;
  type?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/activities/')
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then((data) => setActivities(Array.isArray(data) ? data : data.activities ?? data.results ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Activities</h2>
      <p>Track student activity minutes and points.</p>
      {loading ? (
        <p role="status">Loading…</p>
      ) : error ? (
        <p role="alert">Unable to load activities</p>
      ) : activities.length === 0 ? (
        <p>No activities</p>
      ) : (
        <ul>
          {activities.map((activity, index) => (
            <li key={activity.id ?? activity._id ?? index}>
              {activity.name ?? activity.activity ?? activity.activity_type ?? activity.type ?? 'Activity'}
              {activity.minutes != null && ` — ${activity.minutes} minutes`}
              {activity.points != null && ` — ${activity.points} points`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
