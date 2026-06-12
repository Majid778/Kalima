# Phase 05 — Onboarding & Profile — Context & Decisions

**Goal:** New users get a 3-screen first-launch onboarding (with an Arabic level self-assessment that adjusts the initial experience) and placed into the app; returning users can view a profile with stats + a streak-activity heatmap.

**Requirements:** ONBD-01, ONBD-02, PROF-01, PROF-02.

## Architectural decisions (locked before implementation)

- **D5-01 — Onboarding state in MMKV (Zustand store), gated synchronously.** New `useOnboardingStore` (Zustand + persist + mmkvStorage, name `kalima-onboarding`): `hasOnboarded: boolean` (default false), `arabicLevel: ArabicLevel | null`. MMKV storage hydrates synchronously (same pattern settingsStore already relies on), so the first-launch gate needs no async loading screen.
- **D5-02 — Gate lives in `RootStackNavigator`.** When `hasOnboarded === false`, the stack renders only the `Onboarding` screen (initial route). On `completeOnboarding()`, the store flips reactively and the navigator swaps to `Tabs`. No change to `App.tsx` (SQLiteProvider stays the root). This keeps the DB mounted during onboarding (the assessment writes nothing to SQLite, but the gate must not unmount providers).
- **D5-03 — 3 screens + assessment.** Onboarding is one screen component with internal step state (no new pager dependency): Step 1 + Step 2 are intro/concept screens ("Learn the Qur'an's most frequent words first"; "Track the % of the Qur'an you understand"); Step 3 is the **Arabic level self-assessment** (3 choices). "Next" advances steps; choosing a level on step 3 calls `completeOnboarding(level)`. A "Skip" affordance also completes onboarding with a default level.
- **D5-04 — `ArabicLevel = 'beginner' | 'alphabet' | 'reader'` adjusts the initial experience concretely.** `completeOnboarding(level)` stores the level AND sets one real, defensible initial default: `beginner`/`alphabet` → `settingsStore.setShowTransliteration(true)`; `reader` → `setShowTransliteration(false)`. (Transliteration is the one pacing lever the current learn/practice surfaces actually honor; we wire the honest one rather than fabricate a fake "pacing" knob.) The stored `arabicLevel` is also shown on the Profile screen.
- **D5-05 — "Words mastered" = count(word_progress.status = 'review').** Stronger than "words learned" (status != 'new'). Add `getWordsMasteredCount(db)` to progressService. Longest streak comes from `streakStore.longestStreak`. Level completion history = `getLevelProgressList(db)` filtered to `completed`.
- **D5-06 — Streak heatmap is a dependency-free RN View grid.** A pure helper `buildActivityGrid(activityDates, today, weeks=13)` returns a weeks×7 matrix of `{ date, count, intensity }` (intensity 0–3 bucketed by count), rendered as colored squares (GitHub-style) using `colors.surfaceLight`→`colors.primary`. The grid builder is pure and unit-tested. No charting/SVG dependency.

## Conventions Codex must follow (from existing code)
- Stores: Zustand `create<...>()(persist((set)=>({...}), { name, storage: createJSONStorage(()=>mmkvStorage) }))`. See `settingsStore.ts`.
- Cross-store action: call another store imperatively via `useSettingsStore.getState().setShowTransliteration(...)`.
- Screens: function components, `StyleSheet.create`, `colors` from `theme/colors`, dark bg + green accent. Profile already uses `SafeAreaView` from `react-native-safe-area-context`.
- Services: `export async function fn(db, ...)`, `type DB = ExpoSQLiteDatabase<typeof schema>`; pure helpers split out and unit-tested (mirror `sm2.test.ts`).
- Navigation: stack routes in `RootStackParamList` (`RootStackNavigator.tsx`).
- Ionicons from `@expo/vector-icons` (already a dependency) for any icons.

## Plan breakdown
- **05-01** — Onboarding: `onboardingStore.ts`, `OnboardingScreen.tsx` (3 steps + assessment), gate in `RootStackNavigator`, level→transliteration wiring, store unit test. No SQLite.
- **05-02** — Profile: extend `ProfileScreen` with stats (words mastered, longest streak, arabic level, level completion history) + streak heatmap; add `getWordsMasteredCount` + pure `buildActivityGrid` with unit tests.
