import User from '../models/User.js';
import Quest from '../models/Quest.js';
import Attempt from '../models/Attempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../utils/token.js';

const ROLES = ['learner', 'mentor', 'admin'];

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role && ROLES.includes(req.query.role)) filter.role = req.query.role;

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
});

export const setRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'admin' && role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res
        .status(400)
        .json({ message: 'There must be at least one admin remaining' });
    }
  }

  user.role = role;
  await user.save();
  res.json({ message: `Role updated to ${role}`, user: publicUser(user) });
});

export const setActive = (isActive) =>
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: 'You cannot change your own account status' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = isActive;
    await user.save();
    res.json({
      message: isActive ? 'User activated' : 'User deactivated',
      user: publicUser(user),
    });
  });

export const analytics = asyncHandler(async (req, res) => {
  const [usersByRole, questsTotal, questsPublished, attemptsByStatus, xpAgg, trackAgg] =
    await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Quest.countDocuments(),
      Quest.countDocuments({ published: true }),
      Attempt.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$xp' } } }]),
      Attempt.aggregate([
        { $match: { status: 'approved' } },
        {
          $lookup: {
            from: 'quests',
            localField: 'quest',
            foreignField: '_id',
            as: 'quest',
          },
        },
        { $unwind: '$quest' },
        { $group: { _id: '$quest.track', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  const roleCounts = { learner: 0, mentor: 0, admin: 0 };
  usersByRole.forEach((r) => {
    roleCounts[r._id] = r.count;
  });

  const attemptCounts = {
    in_progress: 0,
    submitted: 0,
    approved: 0,
    changes_requested: 0,
  };
  attemptsByStatus.forEach((a) => {
    attemptCounts[a._id] = a.count;
  });

  res.json({
    users: {
      ...roleCounts,
      total: roleCounts.learner + roleCounts.mentor + roleCounts.admin,
    },
    quests: { total: questsTotal, published: questsPublished },
    attempts: attemptCounts,
    totalXpAwarded: xpAgg[0]?.total || 0,
    questsByTrack: trackAgg.map((t) => ({ track: t._id, completed: t.count })),
  });
});
