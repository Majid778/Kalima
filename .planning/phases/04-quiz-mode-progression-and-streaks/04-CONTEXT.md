# Phase 04 — Quiz Mode, Progression & Streaks — Context & Decisions

**Goal:** Users can test knowledge (level-gated quizzes), unlock levels, track a growing "% of Quran understood" metric, and maintain daily streaks.

**Requirements covered:** QUIZ-01..06, PROG-01..07, STRK-01..02.

## Architectural decisions (locked before implementation)

- **D4-01 — No DB schema migration.** App.tsx mounts `SQLiteProvider` directly (no `useMigrations` gate), so runtime migrations don't apply; user tables already live in the bundled `kalima.db`. Phase 4 therefore adds **no new SQLite tables**. Unlock/completion uses the existing `level_progress` table; progress metrics read the existing `word_progress` table.
- **D4-02 — Streak & daily activity live in MMKV (Zustand store), not SQLite.** A new `streakStore` (Zustand + `persist` + `mmkvStorage`) holds `activityDates: Record<string,number>`, `currentStreak`, `longestStreak`, `lastActivityDate`. This avoids any DB rebuild and forward-feeds Phase 5's streak heatmap (PROF-02). Streak is recomputed from `activityDates` on read.
- **D4-03 — "% of Quran understood" is occurrence-weighted.** `percentUnderstood = Σ occurrenceCount(words with word_progress.status = 'review') / Σ occurrenceCount(all words)`. A word counts as "understood" once SM-2 graduates it to `review`. The all-words occurrence total is computed once via SQL `SUM`. This is the headline metric; it is tunable (the status threshold is the single knob).
- **D4-04 — "Words learned" = count(word_progress.status != 'new')** (seen at least once). "Levels completed" = count(level_progress.completed_at IS NOT NULL).
- **D4-05 — Unlock model.** Level 1 is always unlocked. A level is unlocked iff `id === 1` OR a `level_progress` row has `unlocked = 1`. Passing a level quiz at ≥80% (D4-07) upserts that level's `level_progress` (`best_quiz_score`, `completed_at`) and unlocks the next level (`unlocked = 1`). Quizzes are hard-gated on unlock; the Learn tab stays open but **displays** lock/completion state (criterion only requires display there).
- **D4-06 — Quiz = 20 questions, 2 types.** Multiple-choice ("What does ⟨arabic⟩ mean?", 4 options, 1 correct + 3 distractors) and matching (match 4 words to 4 meanings). Distractors are other words' meanings, preferring same-level then global, never duplicating the correct answer. If a level has <20 words, questions cycle words but never repeat a word back-to-back; question count = min(20, words*types-ish) but target 20. Generation is a pure function (injectable RNG seed) for deterministic tests.
- **D4-07 — Pass gate = 80%.** `score / total >= 0.8` passes and unlocks next level. Retakes are free and always allowed (QUIZ-05); only the best score is kept (`bestQuizScore = max(old, new)`).
- **D4-08 — Today's Verse is deterministic by date.** Pick a verse from `word_verses` by `dayIndex = daysSinceEpoch(today) % verseCount`. "You know X/Y words" where Y = number of words whose example verse is this (surah,ayah) and X = how many of those have `status != 'new'`.
- **D4-09 — Milestones at 25/50/75/100%.** A `milestoneStore` (or field in streakStore) records the highest milestone celebrated; when `percentUnderstood` crosses a new threshold, show a one-time celebration modal. Persist "seen" milestones so it fires once.
- **D4-10 — Activity recording is centralized.** A single `recordActivity(today)` (streakStore action) is called on: completing a practice session, finishing a quiz, and finishing a learn session. Increments `activityDates[today]` and recomputes streak.

## Conventions Codex must follow (from existing code)
- Services: `export async function fn(db, ...)` — `db` is first param; type `DB = ExpoSQLiteDatabase<typeof schema>`. Pure logic (sm2-style) split into testable functions with injectable `today`/seed.
- DB singleton import in screens: `import { db } from '../data/database'`; date via `getLocalToday()` from `services/sm2`.
- Stores: Zustand `create<...>()(persist((set)=>({...}), { name, storage: createJSONStorage(()=>mmkvStorage) }))`.
- Screens: function components, `StyleSheet.create`, `colors` from `theme/colors`, `useFocusEffect` to reload on focus. Dark bg `colors.background`, green `colors.primary`.
- Navigation: add new stack routes to `RootStackParamList` in `RootStackNavigator.tsx`; tab screens wired in `BottomTabNavigator.tsx`.
- Arabic text: render via the existing `ArabicText` component (respects font-size + transliteration settings + RTL).
- Tests: Jest, co-located in `__tests__/`. New pure logic (quiz gen, percent calc, streak calc) gets unit tests, mirroring `sm2.test.ts`.

## Plan breakdown
- **04-01** — Progress + streak foundation: `progressService.ts`, `streakStore.ts`, pure helpers + unit tests. No UI.
- **04-02** — Quiz mode: `quizService.ts` (generation + grading + unlock), quiz level-picker + session + results UI, nav routes, unit tests.
- **04-03** — Home (Journey) screen: % circle, stats, Continue, due count, Today's Verse, milestone celebration; Levels screen lock/completion state; wire `recordActivity` into all activity completions.
