export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

type BadgeStats = {
  wordsLearned: number;
  quranPercent: number;
  levelsCompleted: number;
  kindStreak: number;
  longestStreak: number;
};

type BadgeRule = Badge & {
  earned: (stats: BadgeStats) => boolean;
};

const BADGE_RULES: BadgeRule[] = [
  {
    id: 'first-word',
    title: 'First word',
    description: 'You began recognizing a word from the Qur\'an.',
    icon: 'leaf',
    earned: stats => stats.wordsLearned >= 1,
  },
  {
    id: 'seven-days-consistency',
    title: 'Seven days of consistency',
    description: 'A steady rhythm of return and review.',
    icon: 'calendar',
    earned: stats => Math.max(stats.kindStreak, stats.longestStreak) >= 7,
  },
  {
    id: 'first-level',
    title: 'First level completed',
    description: 'You completed a level with care and comprehension.',
    icon: 'school',
    earned: stats => stats.levelsCompleted >= 1,
  },
  {
    id: 'hundred-words',
    title: 'One hundred words',
    description: 'One hundred words opened through steady study.',
    icon: 'library',
    earned: stats => stats.wordsLearned >= 100,
  },
  {
    id: 'first-percent',
    title: 'One percent understood',
    description: 'You reached 1% Qur\'an comprehension by vocabulary coverage.',
    icon: 'book',
    earned: stats => stats.quranPercent >= 0.01,
  },
  {
    id: 'thirty-days-consistency',
    title: 'Thirty days of consistency',
    description: 'A month-long rhythm of practice and reflection.',
    icon: 'sparkles',
    earned: stats => Math.max(stats.kindStreak, stats.longestStreak) >= 30,
  },
];

export function evaluateBadges(stats: BadgeStats): Badge[] {
  return BADGE_RULES
    .filter(rule => rule.earned(stats))
    .map(({ earned: _earned, ...badge }) => badge);
}