import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Select, Alert, Avatar, Spinner, LevelChip } from '../components/ui';
import DeleteAccount from '../components/DeleteAccount';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Admin portal</h1>
      <p className="mt-1 text-sm text-slate-500">
        Platform analytics and people management.
      </p>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          People
        </TabButton>
      </div>

      <div className="mt-6">{tab === 'overview' ? <Overview /> : <UsersTab />}</div>

      <DeleteAccount />
    </div>
  );
}

function TabButton({ active, children, ...props }) {
  return (
    <button
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-emerald-600 text-emerald-700'
          : 'border-transparent text-slate-500 hover:text-emerald-800'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    client
      .get('/admin/analytics')
      .then((res) => active && setData(res.data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert kind="error">{error}</Alert>;

  const maxTrack = Math.max(1, ...data.questsByTrack.map((t) => t.completed));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Learners" value={data.users.learner} />
        <StatCard label="Mentors" value={data.users.mentor} />
        <StatCard label="Admins" value={data.users.admin} />
        <StatCard label="Total XP awarded" value={data.totalXpAwarded} />
        <StatCard label="Quests" value={data.quests.total} />
        <StatCard label="Published" value={data.quests.published} />
        <StatCard label="Awaiting review" value={data.attempts.submitted} />
        <StatCard label="Completed" value={data.attempts.approved} />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-emerald-800">
          Completed quests by track
        </h2>
        {data.questsByTrack.length === 0 ? (
          <p className="text-sm text-slate-500">No quests completed yet.</p>
        ) : (
          <div className="space-y-3">
            {data.questsByTrack.map((t) => (
              <div key={t.track} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-sm text-slate-600">{t.track}</div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${(t.completed / maxTrack) * 100}%` }}
                  />
                </div>
                <div className="w-8 text-right text-sm font-medium text-emerald-800">
                  {t.completed}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-emerald-800">Attempt funnel</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="In progress" value={data.attempts.in_progress} subtle />
          <StatCard label="Submitted" value={data.attempts.submitted} subtle />
          <StatCard label="Changes requested" value={data.attempts.changes_requested} subtle />
          <StatCard label="Approved" value={data.attempts.approved} subtle />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, subtle = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        subtle ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <div className="text-2xl font-bold text-emerald-800">{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    const query = filter === 'all' ? '' : `?role=${filter}`;
    return client
      .get(`/admin/users${query}`)
      .then((res) => {
        setUsers(res.data.users);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(id, role) {
    setBusyId(id);
    setError('');
    try {
      const res = await client.patch(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data.user : u)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(u) {
    setBusyId(u.id);
    setError('');
    try {
      const action = u.isActive ? 'deactivate' : 'activate';
      const res = await client.patch(`/admin/users/${u.id}/${action}`);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? res.data.user : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const filters = ['all', 'learner', 'mentor', 'admin'];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">No users to show.</Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {users.map((u) => {
            const isSelf = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                  u.isActive ? '' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={u.profilePic} name={u.username} size="sm" />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                      {u.username}
                      {isSelf && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                          you
                        </span>
                      )}
                      {u.role === 'learner' && <LevelChip level={u.level} />}
                    </div>
                    <div className="text-xs text-slate-500">
                      {u.email}
                      {u.role === 'learner' && ` · ${u.xp} XP`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-32">
                    <Select
                      value={u.role}
                      disabled={isSelf || busyId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value="learner">Learner</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </div>
                  {!isSelf && (
                    <Button
                      variant={u.isActive ? 'subtle' : 'success'}
                      disabled={busyId === u.id}
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
