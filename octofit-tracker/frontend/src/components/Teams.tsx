import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: string[];
};

type TeamsResponse = {
  teams: Team[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getJson<TeamsResponse>('/api/teams');
        if (!active) return;
        setTeams(response.teams ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load teams right now.');
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading ? <p role="status">Loading teams...</p> : null}
        {!loading && error ? <p role="alert">{error}</p> : null}
        {!loading && !error && teams.length === 0 ? <p>No teams yet.</p> : null}
        {!loading && !error && teams.length > 0 ? (
          <ul className="list-group list-group-flush" aria-label="Team list">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot ? <span className="ms-2">{team.mascot}</span> : null}
                <span className="ms-2">{team.members?.length ?? 0} members</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
