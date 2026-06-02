import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Card, Avatar, LevelChip, Spinner, Alert } from '../components/ui';

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    client
      .get('/leaderboard?limit=50')
      .then((res) => {
        if (!active) return;
        setRows(res.data.leaderboard);
        setMe(res.data.me);
        setTotal(res.data.total);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Leaderboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Top learners ranked by XP · {total} learner{total === 1 ? '' : 's'} competing.
      </p>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Card className="mt-6 p-10 text-center text-sm text-slate-500">
          No ranked learners yet. Complete a quest to get on the board!
        </Card>
      ) : (
        <Card className="mt-6 divide-y divide-slate-100">
          {rows.map((r) => {
            const mine = r.id === user.id;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-4 p-4 ${mine ? 'bg-emerald-50' : ''}`}
              >
                <div className="w-8 text-center text-base font-bold text-slate-500">
                  {medal(r.rank) || r.rank}
                </div>
                <Avatar src={r.profilePic} name={r.username} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                    <span className="truncate">{r.username}</span>
                    {mine && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                        you
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {r.badgeCount} badge{r.badgeCount === 1 ? '' : 's'}
                  </div>
                </div>
                <LevelChip level={r.level} />
                <div className="w-20 text-right text-sm font-bold text-emerald-800">
                  {r.xp} XP
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {me && !rows.some((r) => r.id === user.id) && (
        <Card className="mt-3 bg-emerald-50 p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-sm font-bold text-slate-500">{me.rank}</div>
            <Avatar src={user.profilePic} name={user.username} size="sm" />
            <div className="flex-1 text-sm font-medium text-emerald-900">
              {user.username}{' '}
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                you
              </span>
            </div>
            <LevelChip level={me.level} />
            <div className="w-20 text-right text-sm font-bold text-emerald-800">
              {me.xp} XP
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
