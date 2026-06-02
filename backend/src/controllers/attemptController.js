import Attempt from '../models/Attempt.js';
import Quest from '../models/Quest.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../utils/token.js';
import { BADGES } from '../config/badges.js';
import { levelFromXp, bumpStreak } from '../utils/gamification.js';

function publicAttempt(attempt) {
  const quest = attempt.quest;
  const learner = attempt.learner;
  return {
    id: attempt._id,
    status: attempt.status,
    submissionUrl: attempt.submissionUrl,
    submissionNotes: attempt.submissionNotes,
    mentorFeedback: attempt.mentorFeedback,
    xpAwarded: attempt.xpAwarded,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
    quest: quest?._id
      ? {
          id: quest._id,
          title: quest.title,
          track: quest.track,
          difficulty: quest.difficulty,
          xpReward: quest.xpReward,
        }
      : quest,
    learner: learner?._id
      ? { id: learner._id, username: learner.username, profilePic: learner.profilePic }
      : learner,
  };
}

export const startQuest = asyncHandler(async (req, res) => {
  const quest = await Quest.findById(req.body.questId);
  if (!quest || !quest.published) {
    return res.status(404).json({ message: 'Quest not found' });
  }

  let attempt = await Attempt.findOne({ learner: req.user._id, quest: quest._id });
  if (!attempt) {
    attempt = await Attempt.create({
      learner: req.user._id,
      quest: quest._id,
      status: 'in_progress',
    });
  }
  await attempt.populate('quest', 'title track difficulty xpReward');
  res.status(201).json({ message: 'Quest started', attempt: publicAttempt(attempt) });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id);
  if (!attempt || String(attempt.learner) !== String(req.user._id)) {
    return res.status(404).json({ message: 'Attempt not found' });
  }
  if (attempt.status === 'approved') {
    return res.status(400).json({ message: 'This quest is already completed' });
  }

  const submissionUrl = (req.body.submissionUrl || '').trim();
  const submissionNotes = (req.body.submissionNotes || '').trim();
  if (!submissionUrl && !submissionNotes) {
    return res.status(400).json({
      message: 'Add a link to your work or some notes before submitting',
      errors: { submissionUrl: 'Provide a link or notes' },
    });
  }

  attempt.submissionUrl = submissionUrl;
  attempt.submissionNotes = submissionNotes;
  attempt.status = 'submitted';
  attempt.mentorFeedback = '';
  await attempt.save();
  await attempt.populate('quest', 'title track difficulty xpReward');
  res.json({ message: 'Submitted for review', attempt: publicAttempt(attempt) });
});

export const myAttempts = asyncHandler(async (req, res) => {
  const attempts = await Attempt.find({ learner: req.user._id })
    .populate('quest', 'title track difficulty xpReward')
    .sort({ updatedAt: -1 });
  res.json({ attempts: attempts.map(publicAttempt) });
});

export const reviewQueue = asyncHandler(async (req, res) => {
  const filter = { status: 'submitted' };
  if (req.user.role === 'mentor') {
    const myQuests = await Quest.find({ createdBy: req.user._id }).distinct('_id');
    filter.quest = { $in: myQuests };
  }
  const attempts = await Attempt.find(filter)
    .populate('quest', 'title track difficulty xpReward')
    .populate('learner', 'username profilePic')
    .sort({ updatedAt: 1 });
  res.json({ attempts: attempts.map(publicAttempt) });
});

async function refreshBadges(learner) {
  const approved = await Attempt.find({
    learner: learner._id,
    status: 'approved',
  }).populate('quest', 'track');

  const completedCount = approved.length;
  const trackTally = {};
  approved.forEach((a) => {
    const t = a.quest?.track || 'unknown';
    trackTally[t] = (trackTally[t] || 0) + 1;
  });
  const topTrackCount = Math.max(0, ...Object.values(trackTally));

  const ctx = {
    completedCount,
    level: levelFromXp(learner.xp),
    xp: learner.xp,
    longestStreak: learner.streak?.longest || 0,
    topTrackCount,
  };

  const earnedNow = [];
  BADGES.forEach((b) => {
    if (!learner.badges.includes(b.key) && b.earned(ctx)) {
      learner.badges.push(b.key);
      earnedNow.push(b.key);
    }
  });
  return earnedNow;
}

export const reviewAttempt = asyncHandler(async (req, res) => {
  const { decision, feedback } = req.body;
  if (!['approve', 'changes'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be "approve" or "changes"' });
  }

  const attempt = await Attempt.findById(req.params.id).populate(
    'quest',
    'title track difficulty xpReward createdBy'
  );
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'submitted') {
    return res.status(400).json({ message: 'This attempt is not awaiting review' });
  }

  if (
    req.user.role === 'mentor' &&
    String(attempt.quest.createdBy) !== String(req.user._id)
  ) {
    return res.status(403).json({ message: 'You can only review your own quests' });
  }

  attempt.reviewedBy = req.user._id;
  attempt.mentorFeedback = (feedback || '').trim();

  if (decision === 'changes') {
    attempt.status = 'changes_requested';
    await attempt.save();
    return res.json({ message: 'Changes requested', attempt: publicAttempt(attempt) });
  }

  attempt.status = 'approved';
  attempt.xpAwarded = attempt.quest.xpReward;
  await attempt.save();

  const learner = await User.findById(attempt.learner);
  learner.xp += attempt.quest.xpReward;
  learner.streak = bumpStreak(learner.streak);
  const newBadges = await refreshBadges(learner);
  await learner.save();

  res.json({
    message: 'Submission approved',
    attempt: publicAttempt(attempt),
    learner: publicUser(learner),
    newBadges,
  });
});
