import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getJson<LeaderboardResponse>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(response.leaderboard ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load leaderboard right now.');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading ? <p role="status">Loading leaderboard...</p> : null}
        {!loading && error ? <p role="alert">{error}</p> : null}
        {!loading && !error && leaderboard.length === 0 ? <p>No leaderboard scores yet.</p> : null}
        {!loading && !error && leaderboard.length > 0 ? (
          <ol className="list-group list-group-numbered" aria-label="Leaderboard results">
            {leaderboard.map((entry) => (
              <li className="list-group-item d-flex justify-content-between align-items-start" key={`${entry.teamName}-${entry.rank}`}>
                <div>
                  <div className="fw-semibold">{entry.teamName}</div>
                  <small>Rank {entry.rank}</small>
                </div>
                <span>{entry.totalPoints}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
