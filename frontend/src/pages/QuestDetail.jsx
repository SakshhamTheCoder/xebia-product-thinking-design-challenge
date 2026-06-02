import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Alert,
  Spinner,
  TrackTag,
  DifficultyBadge,
  AttemptStatusBadge,
} from '../components/ui';

export default function QuestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLearner = user.role === 'learner';

  const load = useCallback(() => {
    return client
      .get(`/quests/${id}`)
      .then((res) => setQuest(res.data.quest))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (error && !quest) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Alert kind="error">{error}</Alert>
        <Link to="/quests" className="mt-4 inline-block text-sm text-emerald-600 underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const attempt = quest.myAttempt;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/quests" className="text-sm text-slate-500 hover:text-emerald-800">
        ← Back to catalog
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <TrackTag track={quest.track} />
        <DifficultyBadge difficulty={quest.difficulty} />
        <span className="text-sm font-bold text-emerald-700">
          +{quest.xpReward} XP
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-emerald-900">
        {quest.title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{quest.description}</p>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-emerald-800">Instructions</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {quest.instructions || 'No additional instructions for this quest.'}
        </p>
      </Card>

      {isLearner ? (
        <LearnerPanel quest={quest} attempt={attempt} onChange={load} />
      ) : (
        <Card className="mt-4 p-6 text-sm text-slate-500">
          You are viewing this quest as a {user.role}. Learners submit work here;
          submissions appear in your{' '}
          <Link to="/mentor" className="font-medium text-emerald-600 underline">
            review queue
          </Link>
          .
        </Card>
      )}
    </div>
  );
}

function LearnerPanel({ quest, attempt, onChange }) {
  const [form, setForm] = useState({
    submissionUrl: attempt?.submissionUrl || '',
    submissionNotes: attempt?.submissionNotes || '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function start() {
    setBusy(true);
    setError('');
    try {
      await client.post('/attempts', { questId: quest.id });
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      await client.patch(`/attempts/${attempt.id}/submit`, form);
      await onChange();
    } catch (err) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setBusy(false);
    }
  }

  if (!attempt) {
    return (
      <Card className="mt-4 p-6">
        <p className="text-sm text-slate-600">
          Ready to take this on? Start the quest to unlock the submission form.
        </p>
        <Button className="mt-4" disabled={busy} onClick={start}>
          {busy ? 'Starting…' : 'Start quest'}
        </Button>
        {error && (
          <div className="mt-3">
            <Alert kind="error">{error}</Alert>
          </div>
        )}
      </Card>
    );
  }

  if (attempt.status === 'approved') {
    return (
      <Card className="mt-4 border-emerald-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-700">Quest completed 🎉</h2>
          <AttemptStatusBadge status={attempt.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          You earned <span className="font-semibold">+{attempt.xpAwarded} XP</span> for
          this quest.
        </p>
        {attempt.mentorFeedback && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-medium text-emerald-800">Mentor feedback:</span>{' '}
            {attempt.mentorFeedback}
          </div>
        )}
      </Card>
    );
  }

  if (attempt.status === 'submitted') {
    return (
      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-800">Submitted</h2>
          <AttemptStatusBadge status={attempt.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Your work is in the mentor review queue. You&apos;ll earn XP once it&apos;s
          approved.
        </p>
        <Submission attempt={attempt} />
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-emerald-800">Submit your work</h2>
        <AttemptStatusBadge status={attempt.status} />
      </div>

      {attempt.status === 'changes_requested' && attempt.mentorFeedback && (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
          <span className="font-medium">Changes requested:</span> {attempt.mentorFeedback}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        <Field label="Link to your work" error={fieldErrors.submissionUrl}>
          <Input
            name="submissionUrl"
            value={form.submissionUrl}
            onChange={update}
            placeholder="https://github.com/you/solution"
          />
        </Field>
        <Field label="Notes (optional)">
          <Textarea
            name="submissionNotes"
            value={form.submissionNotes}
            onChange={update}
            rows={4}
            placeholder="Explain your approach, trade-offs, anything the mentor should know."
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Submitting…' : 'Submit for review'}
        </Button>
      </form>
    </Card>
  );
}

function Submission({ attempt }) {
  if (!attempt.submissionUrl && !attempt.submissionNotes) return null;
  return (
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
    </div>
  );
}
