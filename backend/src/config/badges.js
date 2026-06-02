export const BADGES = [
  {
    key: 'first-quest',
    name: 'First Steps',
    icon: '🌱',
    description: 'Completed your first quest.',
    earned: (c) => c.completedCount >= 1,
  },
  {
    key: 'five-quests',
    name: 'Getting Serious',
    icon: '🔥',
    description: 'Completed 5 quests.',
    earned: (c) => c.completedCount >= 5,
  },
  {
    key: 'ten-quests',
    name: 'Quest Machine',
    icon: '⚙️',
    description: 'Completed 10 quests.',
    earned: (c) => c.completedCount >= 10,
  },
  {
    key: 'level-5',
    name: 'Rising Star',
    icon: '⭐',
    description: 'Reached level 5.',
    earned: (c) => c.level >= 5,
  },
  {
    key: 'week-streak',
    name: 'On Fire',
    icon: '📅',
    description: 'Held a 7-day learning streak.',
    earned: (c) => c.longestStreak >= 7,
  },
  {
    key: 'track-master',
    name: 'Track Master',
    icon: '🏆',
    description: 'Completed 3 quests in a single track.',
    earned: (c) => c.topTrackCount >= 3,
  },
];

const BY_KEY = Object.fromEntries(BADGES.map((b) => [b.key, b]));

export function describeBadges(keys = []) {
  return keys.map((k) => BY_KEY[k]).filter(Boolean);
}
