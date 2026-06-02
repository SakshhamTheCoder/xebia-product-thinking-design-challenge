import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Card,
  Button,
  Select,
  TrackTag,
  DifficultyBadge,
  AttemptStatusBadge,
  Spinner,
  Alert,
} from '../components/ui';

export default function QuestCatalog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quests, setQuests] = useState([]);
  const [meta, setMeta] = useState({ tracks: [], difficulties: [] });
  const [filters, setFilters] = useState({ track: '', difficulty: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const isLearner = user.role === 'learner';

  useEffect(() => {
    let active = true;
    client
      .get('/quests/meta')
      .then((res) => active && setMeta(res.data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filters.track) params.set('track', filters.track);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    client
      .get(`/quests?${params.toString()}`)
      .then((res) => active && setQuests(res.data.quests))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  async function start(quest) {
    setBusyId(quest.id);
    setError('');
    try {
      await client.post('/attempts', { questId: quest.id });
      navigate(`/quests/${quest.id}`);
    } catch (err) {
      setError(err.message);
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-900">
            Quest catalog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLearner
              ? 'Pick a quest, build something real, and earn XP when a mentor approves it.'
              : 'Browse the published learning catalog.'}
          </p>
        </div>
        {(user.role === 'mentor' || user.role === 'admin') && (
          <Link to="/mentor">
            <Button variant="secondary">Author a quest</Button>
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="w-44">
          <Select
            value={filters.track}
            onChange={(e) => setFilters({ ...filters, track: e.target.value })}
          >
            <option value="">All tracks</option>
            {meta.tracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">All difficulties</option>
            {meta.difficulties.map((d) => (
              <option key={d} value={d} className="capitalize">
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : quests.length === 0 ? (
        <Card className="mt-6 p-10 text-center text-sm text-slate-500">
          No quests match these filters yet.
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quests.map((q) => (
            <Card
              key={q.id}
              className="flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <TrackTag track={q.track} />
                <DifficultyBadge difficulty={q.difficulty} />
              </div>
              <Link to={`/quests/${q.id}`} className="mt-3 block">
                <h3 className="text-base font-semibold text-emerald-900 hover:text-emerald-700">
                  {q.title}
                </h3>
              </Link>
              <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-slate-500">
                {q.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-700">
                  +{q.xpReward} XP
                </span>
                {isLearner ? (
                  q.myAttempt ? (
                    <Link to={`/quests/${q.id}`}>
                      <AttemptStatusBadge status={q.myAttempt.status} />
                    </Link>
                  ) : (
                    <Button disabled={busyId === q.id} onClick={() => start(q)}>
                      {busyId === q.id ? 'Starting…' : 'Start quest'}
                    </Button>
                  )
                ) : (
                  <Link to={`/quests/${q.id}`}>
                    <Button variant="secondary">View</Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
