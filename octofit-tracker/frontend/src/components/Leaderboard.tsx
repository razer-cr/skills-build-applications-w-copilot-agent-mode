import { useEffect, useState } from 'react';

type Ranking = Record<string, unknown>;

export default function Leaderboard() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadRankings() {
      try {
        const response = await fetch('/api/leaderboard/');
        if (!response.ok) throw new Error('Request failed');
        const data: unknown = await response.json();
        const records = Array.isArray(data)
          ? data
          : data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)
            ? data.results
            : data && typeof data === 'object' && 'leaderboard' in data && Array.isArray(data.leaderboard)
              ? data.leaderboard
              : [];
        if (active) setRankings(records as Ranking[]);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRankings();
    return () => { active = false; };
  }, []);

  return (
    <section aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title">Leaderboard</h2>
      <p>Compare team point totals.</p>
      {loading ? <p role="status">Loading…</p> : error ? <p role="alert">Unable to load leaderboard</p> : rankings.length === 0 ? <p>No leaderboard rankings</p> : (
        <ol>
          {rankings.map((ranking, index) => (
            <li key={String(ranking.id ?? ranking.team_id ?? index)}>
              {String(ranking.teamName ?? ranking.team_name ?? ranking.team ?? ranking.name ?? `Team ${index + 1}`)}
              {(ranking.totalPoints ?? ranking.points) != null ? ` — ${String(ranking.totalPoints ?? ranking.points)} points` : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
