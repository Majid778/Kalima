# Phase 3: Learn Mode and Spaced Repetition - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can learn new Quran vocabulary through swipeable word cards within a level, and retain it through SM-2 spaced repetition flashcard practice. Learning progress persists in local SQLite.

Creating quizzes, progression tracking, streaks, and the home screen hero metric are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Word card layout and interaction
- **D-01:** Full-screen card layout — one card fills the screen below the header, swipe left/right to navigate
- **D-02:** Card field order (top to bottom): Arabic word (large, centered), transliteration (conditional on `showTransliteration`), meaning, root + part of speech on one line, occurrence count, divider, example verse section
- **D-03:** Example verse section: full Arabic ayah with the target word highlighted in green (`colors.primary`), English translation below in `textSecondary`
- **D-04:** Swipe gesture: left = next card, right = previous card (using react-native-gesture-handler + reanimated)
- **D-05:** Position indicator in header: "Word 3 of 40" — simple text, not a progress bar
- **D-06:** Header shows level name (e.g., "Level 1: Most Common") with back button to return to level list
- **D-07:** No "mark as learned" or completion tracking on word cards — cards are for browsing/learning only; spaced repetition handles retention

### Flashcard reveal mechanics
- **D-08:** Front of flashcard shows Arabic word only (large, centered) — nothing else
- **D-09:** Tap anywhere on card to reveal back — no flip animation, simple fade-in of content below the Arabic word
- **D-10:** Back reveals: transliteration (if enabled), meaning, example verse with target word highlighted
- **D-11:** After reveal, four grading buttons appear at bottom: Again (red), Hard (orange), Good (green), Easy (blue)
- **D-12:** Each button shows the next review interval (e.g., "Again — 1m", "Good — 1d", "Easy — 4d")
- **D-13:** After grading, automatically advance to next due card
- **D-14:** Practice session header shows: cards remaining count ("12 cards left")

### SM-2 algorithm parameters
- **D-15:** Standard SM-2 with these parameters: initial interval = 1 day, second interval = 6 days, ease factor start = 2.5, ease factor floor = 1.3
- **D-16:** Interval fuzzing: ±10% random variation on intervals > 1 day to prevent card clumping
- **D-17:** Daily review cap: 200 cards max per practice session; show "You've hit today's limit" when reached
- **D-18:** Grade mapping: Again = reset to interval 1, ease -0.20; Hard = interval × 1.2, ease -0.15; Good = interval × ease factor; Easy = interval × ease factor × 1.3, ease +0.15
- **D-19:** New cards introduced per day: no cap for now — user controls pace by choosing which level to study
- **D-20:** `word_progress.status` values: `'new'` (never reviewed), `'learning'` (interval < 21 days), `'review'` (interval ≥ 21 days)

### Navigation flow
- **D-21:** Learn tab shows a list of levels — each row shows level number, name, word count, and cumulative coverage %
- **D-22:** Tapping a level opens the word card viewer (stack navigator push from Learn tab)
- **D-23:** Practice tab shows: count of due cards, "Start Practice" button, and a summary of new/learning/review counts
- **D-24:** If no cards are due: Practice tab shows "All caught up! No cards due for review" with next review date
- **D-25:** Root stack wraps the tab navigator — card/practice screens are top-level stack screens above the tabs, which cleanly hides the tab bar without flicker (React Navigation recommended pattern)

### Transliteration integration
- **D-26:** Word cards and flashcards respect `showTransliteration` from settings store — when off, transliteration row is hidden (not collapsed/grayed, just absent)
- **D-27:** Arabic font size from settings store applies to the Arabic word display on both word cards and flashcards

### Claude's Discretion
- Card transition animation style (slide, fade, etc.)
- Exact spacing, padding, margins on cards
- Level list row design details
- Loading states for database queries
- How to handle levels with 0 words (edge case)
- Practice session completion celebration (if any)

</decisions>

<specifics>
## Specific Ideas

- Word cards should feel like a focused study experience — minimal chrome, maximum readability
- The Arabic word should be the visual hero of every card — large and centered
- Grading buttons should be clearly differentiated by color so users build muscle memory
- Practice session should feel snappy — no unnecessary transitions between cards

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema (source of truth for data model)
- `src/data/schema.ts` — `words`, `word_verses`, `word_progress`, `level_progress`, `levels` tables with all columns and indexes
- `src/data/database.ts` — Drizzle ORM instance creation via `openDatabaseSync`

### Existing components to reuse
- `src/components/ArabicText.tsx` — Arabic text rendering with global font size from settings store; use for all Arabic display
- `src/stores/settingsStore.ts` — `showTransliteration` and `arabicFontSize` state; word cards and flashcards must read these
- `src/stores/mmkvStorage.ts` — MMKV storage adapter for Zustand persist

### Theme constants
- `src/theme/colors.ts` — All color constants (`primary`, `background`, `surface`, `text`, etc.)
- `src/theme/typography.ts` — `arabicFontSizes`, `arabicLineHeights`, `ArabicFontSize` type, `fonts.arabic`

### Navigation
- `src/navigation/BottomTabNavigator.tsx` — Current flat tab setup; needs stack navigators added for Learn and Practice drill-downs
- `@react-navigation/native-stack` — Installed but not yet wired up

### Requirements
- `LEARN-01` through `LEARN-05` — Word card browsing within levels
- `PRAC-01` through `PRAC-07` — SM-2 flashcard practice

### Tech stack
- `react-native-reanimated` ~4.1.1 — Card swipe animations (worklet-based, UI thread)
- `react-native-gesture-handler` ~2.28.0 — Swipe gesture detection
- `expo-haptics` ~15.0.8 — Haptic feedback on card grade

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ArabicText` component — use for all Arabic rendering on cards; accepts `size` override prop, reads global setting
- `SegmentedControl` component — reusable but not needed for this phase
- `colors.*` constants — all UI colors; never hardcode hex values
- `arabicFontSizes` / `arabicLineHeights` — sizing constants for Arabic text
- Drizzle schema with `word_progress` table — SM-2 fields already defined (`ease_factor`, `interval`, `repetitions`, `due_date`, `last_reviewed`, `status`)

### Established Patterns
- Zustand stores with MMKV persistence for user preferences
- `StyleSheet.create()` for component styling (not NativeWind)
- Per-component RTL via `writingDirection: 'rtl'` on Arabic text only
- Dark theme via NavigationContainer theme + per-screen `backgroundColor: colors.background`

### Integration Points
- `BottomTabNavigator.tsx` — Learn and Practice tabs currently render placeholder screens; replace with stack navigators wrapping level list → card viewer / practice session
- `App.tsx` — No changes needed; NavigationContainer already wraps everything
- `src/data/database.ts` — Drizzle `db` instance for all SQLite queries
- `word_progress` table — SM-2 state per word; `due_date` index enables efficient "cards due today" query

</code_context>

<deferred>
## Deferred Ideas

- Quiz mode — Phase 4
- Level unlock/lock progression — Phase 4
- Streak tracking — Phase 4
- Home screen progress metrics — Phase 4
- Daily card limit as a user setting — future enhancement
- Card flip animation (3D) — revisit if simple reveal feels too flat

</deferred>

---

*Phase: 03-learn-mode-and-spaced-repetition*
*Context gathered: 2026-03-30 via --auto (recommended defaults)*
