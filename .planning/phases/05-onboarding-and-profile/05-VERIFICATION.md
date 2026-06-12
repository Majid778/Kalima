# Phase 05 — Verification

**Verdict:** PASS — all 4 success criteria delivered; gate green. Final phase → milestone v1.0 complete.

## Automated gate (from repo root)
- `npx tsc --noEmit` → exit 0 (clean)
- `npx jest` → 9 suites, **100 tests passed** (92 from Phase 4 + 8 new: onboarding + buildActivityGrid)
- `npx expo export --platform ios` → success (~4.73 MB Hermes bundle; onboarding gate + extended profile resolve)

## Success criteria → evidence
1. **3-screen first-launch onboarding before main app** — `OnboardingScreen` (2 concept steps + assessment step, step dots); `RootStackNavigator` renders ONLY Onboarding while `hasOnboarded === false`, then reactively swaps to Tabs. ✅
2. **Arabic level self-assessment adjusts initial experience** — step 3 offers beginner / alphabet / reader; `completeOnboarding(level)` persists the level and sets the transliteration default (beginner/alphabet → on, reader → off) via settingsStore. ✅
3. **Profile shows words mastered, longest streak, level completion history** — `ProfileScreen` consumes `getWordsMasteredCount` (status='review'), `useStreakStore.longestStreak`, and `getLevelProgressList` filtered to completed (name + best score); Arabic level also shown. ✅
4. **Profile streak calendar (heatmap)** — pure `buildActivityGrid(activityDates, today, 13)` → 13×7 chronological grid, intensity-bucketed; rendered as colored View squares (surfaceLight→primary), horizontally scrollable. ✅

## Architecture (locked)
- **Onboarding state in MMKV** (D5-01), gated synchronously in `RootStackNavigator` (D5-02) — no App.tsx change, SQLiteProvider stays root.
- **No SQLite schema change** — profile stats read existing `word_progress`/`level_progress`; heatmap reads `streakStore.activityDates`.

## Fix applied during verification
- Removed a racy `navigation.reset({routes:[{name:'Tabs'}]})` in the onboarding completion handler: `Tabs` isn't registered until the `hasOnboarded` store flip commits, so the reset targeted a not-yet-present route (spurious "RESET not handled" warning). The reactive gate already lands the user on Tabs (the Skip path, which never reset, proves it). Both completion paths now rely on the gate.

## Plans
- [x] 05-01 — onboarding store + 3-step screen + nav gate (commit e06829e)
- [x] 05-02 — profile stats + streak heatmap (commit 05163e6)
