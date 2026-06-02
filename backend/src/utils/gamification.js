export function xpForLevel(level) {
  return 50 * (level - 1) * level;
}

export function levelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const intoLevel = xp - floor;
  const levelSpan = ceil - floor;
  return {
    level,
    xp,
    xpIntoLevel: intoLevel,
    xpForNextLevel: levelSpan,
    xpToNextLevel: ceil - xp,
    percent: Math.round((intoLevel / levelSpan) * 100),
  };
}

function dayStamp(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

export function bumpStreak(streak, now = new Date()) {
  const today = dayStamp(now);
  const last = streak?.lastActiveDate ? dayStamp(streak.lastActiveDate) : null;

  let current = streak?.current || 0;
  if (!last) {
    current = 1;
  } else {
    const gap = daysBetween(last, today);
    if (gap === 0) {
      current = current || 1;
    } else if (gap === 1) {
      current += 1;
    } else {
      current = 1;
    }
  }

  const longest = Math.max(streak?.longest || 0, current);
  return { current, longest, lastActiveDate: now };
}
