import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  id?: string | number;
  name?: string;
  team_name?: string;
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/teams/', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load teams');
        return response.json();
      })
      .then((data: Team[] | { teams?: Team[]; results?: Team[]; activities?: Team[] }) => {
        setTeams(Array.isArray(data) ? data : data.teams ?? data.results ?? data.activities ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <>
      <CapabilityCard title="Teams" description="Manage teams and members." />
      {loading ? (
        <p role="status">Loading…</p>
      ) : error ? (
        <p role="alert">Unable to load teams</p>
      ) : teams.length === 0 ? (
        <p>No teams</p>
      ) : (
        <ul>
          {teams.map((team, index) => (
            <li key={team.id ?? index}>{team.name ?? team.team_name ?? `Team ${index + 1}`}</li>
          ))}
        </ul>
      )}
    </>
  );
}
