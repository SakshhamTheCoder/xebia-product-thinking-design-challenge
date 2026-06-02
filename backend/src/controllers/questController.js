import Quest, { TRACKS, DIFFICULTIES, XP_BY_DIFFICULTY } from '../models/Quest.js';
import Attempt from '../models/Attempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function publicQuest(quest, attempt) {
  return {
    id: quest._id,
    title: quest.title,
    description: quest.description,
    instructions: quest.instructions,
    track: quest.track,
    difficulty: quest.difficulty,
    xpReward: quest.xpReward,
    published: quest.published,
    createdBy: quest.createdBy?._id
      ? { id: quest.createdBy._id, username: quest.createdBy.username }
      : quest.createdBy,
    createdAt: quest.createdAt,
    myAttempt: attempt
      ? { id: attempt._id, status: attempt.status, xpAwarded: attempt.xpAwarded }
      : null,
  };
}

function validateQuest(body) {
  const errors = {};
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  if (title.length < 3) errors.title = 'Title must be at least 3 characters';
  if (description.length < 10)
    errors.description = 'Description must be at least 10 characters';
  if (!TRACKS.includes(body.track)) errors.track = 'Pick a valid track';
  if (body.difficulty && !DIFFICULTIES.includes(body.difficulty))
    errors.difficulty = 'Pick a valid difficulty';
  return errors;
}

export const listQuests = asyncHandler(async (req, res) => {
  const { track, difficulty, mine } = req.query;
  const filter = {};

  if (req.user.role === 'learner') {
    filter.published = true;
  } else if (mine === 'true') {
    filter.createdBy = req.user._id;
  }
  if (track) filter.track = track;
  if (difficulty) filter.difficulty = difficulty;

  const quests = await Quest.find(filter)
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });

  let attemptByQuest = {};
  if (req.user.role === 'learner' && quests.length) {
    const attempts = await Attempt.find({
      learner: req.user._id,
      quest: { $in: quests.map((q) => q._id) },
    });
    attemptByQuest = Object.fromEntries(attempts.map((a) => [String(a.quest), a]));
  }

  res.json({
    quests: quests.map((q) => publicQuest(q, attemptByQuest[String(q._id)])),
  });
});

export const getMeta = asyncHandler(async (req, res) => {
  res.json({ tracks: TRACKS, difficulties: DIFFICULTIES, xpByDifficulty: XP_BY_DIFFICULTY });
});

export const getQuest = asyncHandler(async (req, res) => {
  const quest = await Quest.findById(req.params.id).populate('createdBy', 'username');
  if (!quest) return res.status(404).json({ message: 'Quest not found' });

  if (req.user.role === 'learner' && !quest.published) {
    return res.status(404).json({ message: 'Quest not found' });
  }

  let attempt = null;
  if (req.user.role === 'learner') {
    attempt = await Attempt.findOne({ learner: req.user._id, quest: quest._id });
  }
  res.json({ quest: publicQuest(quest, attempt) });
});

export const createQuest = asyncHandler(async (req, res) => {
  const errors = validateQuest(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the errors below', errors });
  }

  const difficulty = req.body.difficulty || 'beginner';
  const xpReward =
    req.body.xpReward != null && req.body.xpReward !== ''
      ? Number(req.body.xpReward)
      : XP_BY_DIFFICULTY[difficulty];

  const quest = await Quest.create({
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    instructions: (req.body.instructions || '').trim(),
    track: req.body.track,
    difficulty,
    xpReward,
    createdBy: req.user._id,
    published: !!req.body.published,
  });

  res.status(201).json({ message: 'Quest created', quest: publicQuest(quest) });
});

async function findManageableQuest(req, res) {
  const quest = await Quest.findById(req.params.id);
  if (!quest) {
    res.status(404).json({ message: 'Quest not found' });
    return null;
  }
  const isOwner = String(quest.createdBy) === String(req.user._id);
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403).json({ message: 'You can only manage quests you created' });
    return null;
  }
  return quest;
}

export const updateQuest = asyncHandler(async (req, res) => {
  const quest = await findManageableQuest(req, res);
  if (!quest) return;

  const errors = validateQuest({ ...quest.toObject(), ...req.body });
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the errors below', errors });
  }

  const fields = ['title', 'description', 'instructions', 'track', 'difficulty'];
  fields.forEach((f) => {
    if (req.body[f] != null)
      quest[f] = typeof req.body[f] === 'string' ? req.body[f].trim() : req.body[f];
  });
  if (req.body.xpReward != null && req.body.xpReward !== '') {
    quest.xpReward = Number(req.body.xpReward);
  }
  await quest.save();
  res.json({ message: 'Quest updated', quest: publicQuest(quest) });
});

export const setPublished = (published) =>
  asyncHandler(async (req, res) => {
    const quest = await findManageableQuest(req, res);
    if (!quest) return;
    quest.published = published;
    await quest.save();
    res.json({
      message: published ? 'Quest published' : 'Quest unpublished',
      quest: publicQuest(quest),
    });
  });

export const deleteQuest = asyncHandler(async (req, res) => {
  const quest = await findManageableQuest(req, res);
  if (!quest) return;
  await Attempt.deleteMany({ quest: quest._id });
  await quest.deleteOne();
  res.json({ message: 'Quest deleted' });
});
