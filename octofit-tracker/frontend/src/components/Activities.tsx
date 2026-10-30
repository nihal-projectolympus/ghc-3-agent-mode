import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
};

type ActivitiesResponse = {
  activities: Activity[];
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getJson<ActivitiesResponse>('/api/activities');
        if (!active) return;
        setActivities(response.activities ?? []);
      } catch {
        if (!active) return;
        setError('Unable to load activities right now.');
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
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading ? <p role="status">Loading activities...</p> : null}
        {!loading && error ? <p role="alert">{error}</p> : null}
        {!loading && !error && activities.length === 0 ? <p>No activities yet.</p> : null}
        {!loading && !error && activities.length > 0 ? (
          <ul className="list-group list-group-flush" aria-label="Activity list">
            {activities.map((activity, index) => (
              <li className="list-group-item px-0" key={activity._id ?? `${activity.type}-${index}`}>
                <strong className="text-capitalize">{activity.type}</strong>
                <span className="ms-2">{activity.minutes} min</span>
                <span className="ms-2">{activity.points} pts</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
