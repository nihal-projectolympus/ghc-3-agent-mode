import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  focus?: string;
  reason?: string;
};

type WorkoutsResponse = {
  suggestions: WorkoutSuggestion[];
};

const seededUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getJson<WorkoutsResponse>(`/api/workouts/suggestions/${encodeURIComponent(seededUserEmail)}`);
        if (!active) return;
        setSuggestions(response.suggestions ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load workout suggestions right now.');
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading ? <p role="status">Loading workout suggestions...</p> : null}
        {!loading && error ? <p role="alert">{error}</p> : null}
        {!loading && !error && suggestions.length === 0 ? <p>No workout suggestions yet.</p> : null}
        {!loading && !error && suggestions.length > 0 ? (
          <ul className="list-group list-group-flush" aria-label="Workout suggestions">
            {suggestions.map((suggestion, index) => (
              <li className="list-group-item px-0" key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                {suggestion.reason ? <p className="mb-0 mt-1">{suggestion.reason}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
