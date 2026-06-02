import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Card,
  Avatar,
  Button,
  XPBar,
  StreakPill,
  Badge,
  TrackTag,
  DifficultyBadge,
  AttemptStatusBadge,
  Spinner,
  Alert,
} from '../components/ui';
import DeleteAccount from '../components/DeleteAccount';
import ProfileSettings from '../components/ProfileSettings';

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([client.get('/attempts/mine'), client.get('/leaderboard?limit=5')])
      .then(([a, l]) => {
        if (!active) return;
        setAttempts(a.data.attempts);
        setLeaders(l.data.leaderboard);
        setMyRank(l.data.me?.rank ?? null);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const completed = attempts.filter((a) => a.status === 'approved');
  const activeQuests = attempts.filter((a) =>
    ['in_progress', 'submitted', 'changes_requested'].includes(a.status)
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="overflow-hidden rounded-2xl bg-emerald-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={user.profilePic} name={user.username} size="lg" ring="ring-white/40" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hi, {user.username} 👋</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StreakPill days={user.streak.current} onDark />
                <span className="text-sm text-emerald-50">
                  {user.xp} XP total · {completed.length} quests completed
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            className="border-white/30 bg-white/15 text-white hover:bg-white/25"
            onClick={() => setSettingsOpen(true)}
          >
            Account settings
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-emerald-800">Your progress</h2>
          <XPBar progress={user.progress} />
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat label="Level" value={user.level} />
            <Stat label="Total XP" value={user.xp} />
            <Stat label="Best streak" value={`${user.streak.longest}d`} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-emerald-800">Leaderboard</h2>
            <Link to="/leaderboard" className="text-xs font-medium text-emerald-600">
              View all
            </Link>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <ol className="mt-3 space-y-2">
              {leaders.map((l) => (
                <li
                  key={l.id}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                    l.id === user.id ? 'bg-emerald-50' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 truncate text-emerald-800">
                    <span className="w-5 text-right text-xs font-semibold text-slate-400">
                      {l.rank}
                    </span>
                    <span className="truncate">{l.username}</span>
                  </span>
                  <span className="text-xs font-medium text-slate-500">{l.xp} XP</span>
                </li>
              ))}
              {myRank && myRank > leaders.length && (
                <li className="flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1.5 text-sm">
                  <span className="flex items-center gap-2 text-emerald-800">
                    <span className="w-5 text-right text-xs font-semibold text-slate-400">
                      {myRank}
                    </span>
                    <span>You</span>
                  </span>
                  <span className="text-xs font-medium text-slate-500">{user.xp} XP</span>
                </li>
              )}
            </ol>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-6">
        <h2 className="mb-4 text-sm font-semibold text-emerald-800">
          Badges{' '}
          <span className="font-normal text-slate-400">({user.badges.length} earned)</span>
        </h2>
        {user.badges.length === 0 ? (
          <p className="text-sm text-slate-500">
            No badges yet. Complete your first quest to earn{' '}
            <span className="font-medium">First Steps 🌱</span>.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {user.badges.map((b) => (
              <Badge key={b.key} badge={b} />
            ))}
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-emerald-800">Continue learning</h2>
        <Link to="/quests" className="text-xs font-medium text-emerald-600">
          Browse all quests
        </Link>
      </div>
      {loading ? (
        <Spinner />
      ) : activeQuests.length === 0 ? (
        <Card className="mt-2 p-8 text-center text-sm text-slate-500">
          You have no quests in progress.{' '}
          <Link to="/quests" className="font-medium text-emerald-600 underline">
            Pick one to start
          </Link>
          .
        </Card>
      ) : (
        <Card className="mt-2 divide-y divide-slate-100">
          {activeQuests.map((a) => (
            <Link
              key={a.id}
              to={`/quests/${a.quest.id}`}
              className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50/60"
            >
              <div>
                <div className="text-sm font-medium text-emerald-900">{a.quest.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <TrackTag track={a.quest.track} />
                  <DifficultyBadge difficulty={a.quest.difficulty} />
                  <span className="text-xs text-slate-400">+{a.quest.xpReward} XP</span>
                </div>
              </div>
              <AttemptStatusBadge status={a.status} />
            </Link>
          ))}
        </Card>
      )}

      <DeleteAccount />

      <ProfileSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-emerald-50 py-3 ring-1 ring-emerald-100">
      <div className="text-xl font-bold text-emerald-900">{value}</div>
      <div className="text-xs uppercase tracking-wide text-emerald-700/60">{label}</div>
    </div>
  );
}
