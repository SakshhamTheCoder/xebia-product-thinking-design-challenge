import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { levelFromXp } from '../utils/gamification.js';

export const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const learners = await User.find({ role: 'learner', isActive: true })
    .sort({ xp: -1, createdAt: 1 })
    .select('username profilePic xp badges');

  const ranked = learners.map((u, i) => ({
    rank: i + 1,
    id: u._id,
    username: u.username,
    profilePic: u.profilePic || '',
    xp: u.xp,
    level: levelFromXp(u.xp),
    badgeCount: (u.badges || []).length,
  }));

  const top = ranked.slice(0, limit);

  let me = null;
  const myIndex = ranked.findIndex((r) => String(r.id) === String(req.user._id));
  if (myIndex !== -1) me = ranked[myIndex];

  res.json({ leaderboard: top, total: ranked.length, me });
});
