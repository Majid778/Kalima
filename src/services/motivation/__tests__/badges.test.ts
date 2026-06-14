import { evaluateBadges } from '../badges';

describe('evaluateBadges', () => {
  it('returns no badges before any threshold is met', () => {
    expect(evaluateBadges({
      wordsLearned: 0,
      quranPercent: 0,
      levelsCompleted: 0,
      kindStreak: 0,
      longestStreak: 0,
    })).toEqual([]);
  });

  it('awards first-word at one learned word', () => {
    expect(evaluateBadges({
      wordsLearned: 1,
      quranPercent: 0,
      levelsCompleted: 0,
      kindStreak: 0,
      longestStreak: 0,
    }).map(badge => badge.id)).toContain('first-word');
  });

  it('awards seven-days-consistency from current kind streak', () => {
    expect(evaluateBadges({
      wordsLearned: 0,
      quranPercent: 0,
      levelsCompleted: 0,
      kindStreak: 7,
      longestStreak: 0,
    }).map(badge => badge.id)).toContain('seven-days-consistency');
  });

  it('awards first-level at one completed level', () => {
    expect(evaluateBadges({
      wordsLearned: 0,
      quranPercent: 0,
      levelsCompleted: 1,
      kindStreak: 0,
      longestStreak: 0,
    }).map(badge => badge.id)).toContain('first-level');
  });

  it('awards hundred-words at one hundred learned words', () => {
    expect(evaluateBadges({
      wordsLearned: 100,
      quranPercent: 0,
      levelsCompleted: 0,
      kindStreak: 0,
      longestStreak: 0,
    }).map(badge => badge.id)).toContain('hundred-words');
  });

  it("awards first-percent at one percent Qur'an comprehension", () => {
    expect(evaluateBadges({
      wordsLearned: 0,
      quranPercent: 0.01,
      levelsCompleted: 0,
      kindStreak: 0,
      longestStreak: 0,
    }).map(badge => badge.id)).toContain('first-percent');
  });

  it('awards thirty-days-consistency from the longest recorded rhythm', () => {
    expect(evaluateBadges({
      wordsLearned: 0,
      quranPercent: 0,
      levelsCompleted: 0,
      kindStreak: 0,
      longestStreak: 30,
    }).map(badge => badge.id)).toContain('thirty-days-consistency');
  });
});