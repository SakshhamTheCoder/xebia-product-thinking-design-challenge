import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import {
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Alert,
  Modal,
  Spinner,
  TrackTag,
  DifficultyBadge,
  Avatar,
} from '../components/ui';

export default function MentorDashboard() {
  const [tab, setTab] = useState('quests');

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-emerald-900">
        Mentor workspace
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Author quests and review learner submissions.
      </p>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'quests'} onClick={() => setTab('quests')}>
          My quests
        </TabButton>
        <TabButton active={tab === 'review'} onClick={() => setTab('review')}>
          Review queue
        </TabButton>
      </div>

      <div className="mt-6">{tab === 'quests' ? <QuestsTab /> : <ReviewTab />}</div>
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

function QuestsTab() {
  const [quests, setQuests] = useState([]);
  const [meta, setMeta] = useState({ tracks: [], difficulties: [], xpByDifficulty: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    return client
      .get('/quests?mine=true')
      .then((res) => {
        setQuests(res.data.quests);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    client.get('/quests/meta').then((res) => setMeta(res.data)).catch(() => {});
    load();
  }, [load]);

  async function togglePublish(q) {
    setBusyId(q.id);
    try {
      const action = q.published ? 'unpublish' : 'publish';
      await client.patch(`/quests/${q.id}/${action}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(q) {
    if (!confirm(`Delete "${q.title}"? This also removes learner attempts.`)) return;
    setBusyId(q.id);
    try {
      await client.delete(`/quests/${q.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing({})}>+ New quest</Button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : quests.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          You haven&apos;t authored any quests yet. Create your first one!
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {quests.map((q) => (
            <div
              key={q.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-emerald-900">{q.title}</span>
                  {q.published ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Published
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                      Draft
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <TrackTag track={q.track} />
                  <DifficultyBadge difficulty={q.difficulty} />
                  <span className="text-xs text-slate-400">+{q.xpReward} XP</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="subtle"
                  disabled={busyId === q.id}
                  onClick={() => togglePublish(q)}
                >
                  {q.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button variant="secondary" onClick={() => setEditing(q)}>
                  Edit
                </Button>
                <Button variant="danger" disabled={busyId === q.id} onClick={() => remove(q)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit quest' : 'New quest'}
      >
        {editing && (
          <QuestForm
            quest={editing}
            meta={meta}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function QuestForm({ quest, meta, onSaved }) {
  const isEdit = !!quest.id;
  const [form, setForm] = useState({
    title: quest.title || '',
    description: quest.description || '',
    instructions: quest.instructions || '',
    track: quest.track || meta.tracks[0] || '',
    difficulty: quest.difficulty || 'beginner',
    xpReward: quest.xpReward ?? '',
    published: quest.published ?? false,
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function update(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  const xpPlaceholder = meta.xpByDifficulty?.[form.difficulty] ?? 50;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      const payload = { ...form };
      if (payload.xpReward === '') delete payload.xpReward;
      if (isEdit) {
        await client.patch(`/quests/${quest.id}`, payload);
      } else {
        await client.post('/quests', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}

      <Field label="Title" error={fieldErrors.title}>
        <Input name="title" value={form.title} onChange={update} />
      </Field>
      <Field label="Short description" error={fieldErrors.description}>
        <Textarea
          name="description"
          rows={2}
          value={form.description}
          onChange={update}
          placeholder="One or two sentences shown on the catalog card."
        />
      </Field>
      <Field label="Instructions" error={fieldErrors.instructions}>
        <Textarea
          name="instructions"
          rows={4}
          value={form.instructions}
          onChange={update}
          placeholder="What should the learner build and submit?"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Track" error={fieldErrors.track}>
          <Select name="track" value={form.track} onChange={update}>
            {meta.tracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Difficulty" error={fieldErrors.difficulty}>
          <Select name="difficulty" value={form.difficulty} onChange={update}>
            {meta.difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="XP reward (leave blank to use the default)">
        <Input
          name="xpReward"
          type="number"
          min="0"
          value={form.xpReward}
          onChange={update}
          placeholder={`Default: ${xpPlaceholder} XP`}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-emerald-800">
        <input
          type="checkbox"
          name="published"
          checked={form.published}
          onChange={update}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-300"
        />
        Publish immediately (visible to learners)
      </label>

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create quest'}
      </Button>
    </form>
  );
}

function ReviewTab() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    return client
      .get('/attempts/review-queue')
      .then((res) => {
        setAttempts(res.data.attempts);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onReviewed(message) {
    setNotice(message);
    load();
  }

  return (
    <div>
      {error && <Alert kind="error">{error}</Alert>}
      {notice && (
        <div className="mb-4">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : attempts.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          Nothing to review right now. 🎉
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((a) => (
            <ReviewCard key={a.id} attempt={a} onReviewed={onReviewed} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ attempt, onReviewed }) {
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  async function review(decision) {
    setBusy(decision);
    setError('');
    try {
      const res = await client.patch(`/attempts/${attempt.id}/review`, {
        decision,
        feedback,
      });
      const msg =
        decision === 'approve'
          ? `Approved — ${attempt.learner.username} earned +${res.data.attempt.xpAwarded} XP.`
          : `Changes requested from ${attempt.learner.username}.`;
      onReviewed(msg);
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar src={attempt.learner.profilePic} name={attempt.learner.username} size="sm" />
          <div>
            <div className="text-sm font-medium text-emerald-900">
              {attempt.learner.username}
            </div>
            <div className="text-xs text-slate-500">submitted “{attempt.quest.title}”</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrackTag track={attempt.quest.track} />
          <DifficultyBadge difficulty={attempt.quest.difficulty} />
          <span className="text-xs font-semibold text-emerald-600">
            +{attempt.quest.xpReward} XP
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
        {attempt.submissionUrl && (
          <div className="truncate">
            <span className="font-medium text-emerald-800">Link:</span>{' '}
            <a
              href={attempt.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 underline"
            >
              {attempt.submissionUrl}
            </a>
          </div>
        )}
        {attempt.submissionNotes && (
          <div className="text-slate-600">
            <span className="font-medium text-emerald-800">Notes:</span>{' '}
            {attempt.submissionNotes}
          </div>
        )}
        {!attempt.submissionUrl && !attempt.submissionNotes && (
          <span className="text-slate-400">No submission details provided.</span>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      <div className="mt-3">
        <Textarea
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback for the learner…"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="subtle" disabled={!!busy} onClick={() => review('changes')}>
          {busy === 'changes' ? 'Sending…' : 'Request changes'}
        </Button>
        <Button variant="success" disabled={!!busy} onClick={() => review('approve')}>
          {busy === 'approve' ? 'Approving…' : 'Approve & award XP'}
        </Button>
      </div>
    </Card>
  );
}
