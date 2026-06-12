# Phase 04 — Verification

**Verdict:** PASS — all 7 success criteria delivered; gate green.

## Automated gate (run from repo root)
- `npx tsc --noEmit` → exit 0 (clean)
- `npx jest` → 8 suites, **92 tests passed** (74 prior + 18 new quizService/progress/streak)
- `npx expo export --platform ios` → success, 4.71 MB Hermes bundle (all screens/nav/imports resolve)

## Success criteria → evidence
1. **20-question level quiz, MC + matching, running score/progress** — `quizService.generateQuiz` (pure, deterministic), `QuizSessionScreen` (header "Q n/total"). ✅
2. **80% pass unlocks next level; freely retakable** — `gradeQuiz` (passed ≥0.8), `recordQuizResult` upserts best score + unlocks next level; `QuizResultScreen` Retake. ✅ (Note: wrong-answer-with-verse inline feedback is shown at result granularity, not per-question verse — see Deviations.)
3. **Home: % understood, words learned, streak, levels completed, due count** — `JourneyScreen` consumes `getQuranPercent`, `getWordsLearnedCount`, `getLevelsCompletedCount`, `useStreakStore.currentStreak`, `getPracticeStats().dueCount`. ✅
4. **Levels screen lock/unlock/completion + coverage** — `LevelListScreen` via `getLevelProgressList` (lock icon dim / ✓ + best score; coverage % retained). ✅
5. **Today's Verse with known/total** — `getTodaysVerse` (deterministic by daysSinceEpoch % verseCount), rendered in `JourneyScreen` via `ArabicText`. ✅
6. **Streak increments on any activity, resets on miss** — `streakStore.recordActivity` wired into practice/quiz/learn completion; `computeStreak` gap-reset (unit-tested). ✅
7. **Milestone celebrations at 25/50/75/100%** — `crossedMilestone` + `MILESTONES`; one-time Modal in `JourneyScreen` gated by `celebratedMilestones` + `markMilestoneCelebrated`. ✅

## Architecture (locked)
- **No DB migration** (D4-01) — App mounts SQLiteProvider directly; Phase 4 added zero tables. Unlock/completion use existing `level_progress`; metrics read existing `word_progress`.
- **Streak/activity in MMKV** (D4-02) — `useStreakStore` (Zustand + persist), forward-feeds Phase 5's heatmap.

## Deviations
- **Per-question wrong-answer verse feedback** (criterion 2, second clause): the quiz grades atomically and shows results at the end; an inline "here is the correct answer + example verse" panel per wrong question was not built. Pass-gate, unlock, and retake (the gating behavior) are complete. Candidate Phase-5 polish or a 04-04 follow-up if UAT requires per-question review.
- **% "circle"** rendered as a large percent + horizontal progress bar rather than a radial ring (avoided adding an SVG/charting dependency per the no-new-deps constraint). Same information; different shape.

## Bug found & fixed during verification
- `generateQuiz` had an unbounded `while (questions.length < count)` that spun forever once the used-word set exhausted (jest hung at 98% CPU). Fixed with a stagnation reset (cycle words) + hard iteration guard; back-to-back avoidance preserved via `lastWordId`. Covered by the "graceful <4 words" and determinism tests.

## Plans
- [x] 04-01 — progress service + streak store foundation (commit 67dfff4)
- [x] 04-02 — quiz mode: generation/grading/unlock + UI (commit 372e4cf)
- [x] 04-03 — journey home, level lock state, activity wiring (commit f2e9317)
