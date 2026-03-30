---
phase: 03-learn-mode-and-spaced-repetition
plan: 01
subsystem: services
tags: [sm2, spaced-repetition, drizzle, react-navigation, gesture-handler, jest]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: "SQLite schema with words, word_verses, word_progress, levels tables"
provides:
  - "SM-2 algorithm (gradeSM2, previewGrades, formatInterval)"
  - "Word service (getWordsForLevel with verse grouping, getLevels, highlightWordInVerse)"
  - "Practice service (getDueCards, gradeCard, getPracticeStats, getNextReviewDate)"
  - "RootStackNavigator with Tabs/WordCard/PracticeSession routes"
  - "GestureHandlerRootView wrapper in App.tsx"
  - "Jest mocks for react-native-reanimated and react-native-gesture-handler"
affects: [03-02-learn-mode-ui, 03-03-practice-mode-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["SM-2 pure function with injectable today parameter", "db-as-first-param service pattern", "Map-based post-processing for grouped SQL joins", "root stack wrapping tab navigator for tab bar hiding"]

key-files:
  created:
    - src/services/sm2.ts
    - src/services/__tests__/sm2.test.ts
    - src/services/wordService.ts
    - src/services/practiceService.ts
    - src/navigation/RootStackNavigator.tsx
    - __mocks__/react-native-reanimated.ts
    - __mocks__/react-native-gesture-handler.ts
  modified:
    - App.tsx

key-decisions:
  - "SM-2 uses injectable today parameter for deterministic testing"
  - "Service functions take db as first parameter (not global import) for testability"
  - "RootStackNavigator uses placeholder components for WordCard and PracticeSession screens"

patterns-established:
  - "Pure algorithm functions with injectable dependencies (today, Math.random)"
  - "db-as-first-param pattern for all service functions"
  - "Map-based verse grouping for LEFT JOIN results"
  - "Root stack wrapping tab navigator for clean tab bar hiding"

requirements-completed: [PRAC-04, PRAC-05, PRAC-07, LEARN-03]

# Metrics
duration: 5min
completed: 2026-03-30
---

# Phase 03 Plan 01: Foundation Services Summary

**SM-2 spaced repetition algorithm with 23 unit tests, word/practice data services with Drizzle queries, and root stack navigator with GestureHandlerRootView wrapper**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-30T13:48:30Z
- **Completed:** 2026-03-30T13:53:56Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- SM-2 algorithm correctly handles all 4 grades (again/hard/good/easy) with EF floor at 1.3, interval fuzzing on intervals > 1 day, and status transitions per D-15/D-18/D-20
- 23 unit tests covering grade behavior, EF floor, fuzzing, status transitions, dueDate computation, previewGrades, and formatInterval
- Word and practice services with proper Drizzle queries, verse grouping via Map post-processing, and SM-2 integration for gradeCard upserts
- Navigation restructured: RootStackNavigator wraps BottomTabNavigator, with WordCard and PracticeSession as root-level screens (tab bar hides cleanly)
- GestureHandlerRootView wraps entire app for gesture support in Plans 02/03
- Jest mocks for react-native-reanimated and react-native-gesture-handler enable Wave 2 test runs

## Task Commits

Each task was committed atomically:

1. **Task 1: SM-2 algorithm with unit tests and Jest mocks** - `736b625` (feat+test)
2. **Task 2: Data services and navigation restructure** - `61c9f98` (feat)

## Files Created/Modified
- `src/services/sm2.ts` - Pure SM-2 algorithm: gradeSM2, previewGrades, formatInterval, addDays, getLocalToday
- `src/services/__tests__/sm2.test.ts` - 23 unit tests for SM-2 algorithm
- `src/services/wordService.ts` - getWordsForLevel (verse grouping), getLevels, highlightWordInVerse
- `src/services/practiceService.ts` - getDueCards (200 cap), gradeCard (SM-2 + upsert), getPracticeStats, getNextReviewDate
- `src/navigation/RootStackNavigator.tsx` - Root stack with Tabs, WordCard, PracticeSession screens and RootStackParamList type
- `__mocks__/react-native-reanimated.ts` - Jest mock for reanimated (useSharedValue, useAnimatedStyle, withTiming, etc.)
- `__mocks__/react-native-gesture-handler.ts` - Jest mock for gesture-handler (GestureHandlerRootView, Gesture.Pan/Tap/Fling, State, Directions)
- `App.tsx` - Wrapped in GestureHandlerRootView, replaced BottomTabNavigator with RootStackNavigator

## Decisions Made
- SM-2 uses injectable `today` parameter for deterministic testing (no reliance on system clock in tests)
- Service functions take `db` as first parameter instead of importing globally -- enables testing and follows SQLiteProvider context pattern
- RootStackNavigator uses placeholder components for WordCard and PracticeSession that will be replaced by Plans 02 and 03
- Math.random mocking uses beforeEach/afterEach with saved original reference for reliable test isolation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Math.random mock cleanup in tests**
- **Found during:** Task 1 (SM-2 tests)
- **Issue:** Initial jest.spyOn(Math, 'random') approach with inline mockRestore destroyed Math.random for subsequent tests
- **Fix:** Switched to beforeEach/afterEach pattern saving originalRandom reference
- **Committed in:** 736b625 (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test infrastructure fix necessary for reliability. No scope creep.

## Known Stubs
- `src/navigation/RootStackNavigator.tsx` lines 17-28: WordCardPlaceholder and PracticeSessionPlaceholder components render static text. Will be replaced by Plan 02 (WordCardScreen) and Plan 03 (PracticeSessionScreen).

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SM-2 algorithm tested and ready for practice mode integration (Plan 03)
- Word service ready for learn mode UI (Plan 02)
- Practice service ready for practice mode UI (Plan 03)
- Navigation structure ready for full-screen card and practice screens
- Jest mocks ready for Wave 2 component tests

---
*Phase: 03-learn-mode-and-spaced-repetition*
*Completed: 2026-03-30*
