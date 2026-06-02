import jwt from 'jsonwebtoken';
import { describeBadges } from '../config/badges.js';
import { levelProgress } from './gamification.js';

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function publicUser(user) {
  const progress = levelProgress(user.xp || 0);
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profilePic: user.profilePic || '',
    role: user.role,
    isActive: user.isActive,
    xp: user.xp || 0,
    level: progress.level,
    progress,
    streak: {
      current: user.streak?.current || 0,
      longest: user.streak?.longest || 0,
      lastActiveDate: user.streak?.lastActiveDate || null,
    },
    badges: describeBadges(user.badges || []),
    createdAt: user.createdAt,
  };
}
