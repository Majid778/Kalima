# Roadmap: Kalima

## Overview

Kalima delivers a complete Quran vocabulary learning app in 5 phases, flowing from data foundation through the core learning loop to polish. The build order follows the dependency chain: accurate Quran data and Arabic rendering must exist before any feature screen, the navigation shell must exist before feature screens slot in, learn/practice must work before quizzes can test knowledge, and onboarding requires the full system to place users correctly. Each phase delivers a coherent, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Foundation and Arabic Rendering** - Pre-built SQLite database with frequency-ranked Quran vocabulary, Arabic text component with correct RTL/diacritics rendering, and Expo project scaffolding
- [ ] **Phase 2: Navigation Shell and Settings** - Working tab navigation with placeholder screens, dark theme, and user-configurable Arabic font size and transliteration toggle
- [ ] **Phase 3: Learn Mode and Spaced Repetition** - Swipeable word cards for learning new vocabulary and SM-2 flashcard practice for retention
- [x] **Phase 4: Quiz Mode, Progression, and Streaks** - Level-gated quizzes, the "X% of Quran understood" hero metric, level map, daily streaks, and Today's Verse
- [ ] **Phase 5: Onboarding and Profile** - First-launch onboarding with Arabic level assessment, profile screen with stats and streak calendar

## Phase Details

### Phase 1: Data Foundation and Arabic Rendering
**Goal**: The app has a verified, frequency-ranked Quran vocabulary database and can render Arabic text correctly with full diacritics on both platforms
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, ARAB-01, ARAB-02, ARAB-03
**Success Criteria** (what must be TRUE):
  1. A build-time script processes raw Tanzil.net and corpus.quran.com data into a bundled SQLite database with checksum verification
  2. The database contains all vocabulary words with Arabic text, transliteration, meaning, root, part of speech, frequency rank, occurrence count, and linked example verses
  3. Words are organized into approximately 30 frequency-ordered levels with cumulative Quran coverage percentages
  4. Arabic text renders on screen with full diacritics (tashkeel) using a validated Quranic font, with per-component RTL rendering, while UI labels remain left-to-right
  5. The Expo project builds and runs on both iOS and Android simulators
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Expo scaffolding, dependencies, Drizzle schema, and test infrastructure
- [x] 01-02-PLAN.md — Data pipeline (build-db.js) and database generation
- [x] 01-03-PLAN.md — ArabicText component, KFGQPC font, and rendering verification
- [x] 01-04-PLAN.md — Gap closure: source data checksum verification (DATA-01, DATA-05)

### Phase 2: Navigation Shell and Settings
**Goal**: Users can navigate the app through a tab-based layout and configure Arabic display preferences
**Depends on**: Phase 1
**Requirements**: SETT-01, SETT-02
**Success Criteria** (what must be TRUE):
  1. App displays a bottom tab navigator with placeholder screens for Journey, Learn, Practice, Quiz, and Profile
  2. User can toggle transliteration visibility on and off, and the preference persists across app launches
  3. User can change Arabic font size between at least 3 options (small, medium, large), and the change is immediately visible on Arabic text
  4. Dark theme with green accents is applied consistently across all screens
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Settings store (Zustand + MMKV), tab navigator, placeholder screens, dark theme shell
- [x] 02-02-PLAN.md — Profile settings UI (segmented control, transliteration toggle), ArabicText store integration

### Phase 3: Learn Mode and Spaced Repetition
**Goal**: Users can learn new Quran vocabulary through word cards and retain it through spaced repetition practice
**Depends on**: Phase 2
**Requirements**: LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, PRAC-01, PRAC-02, PRAC-03, PRAC-04, PRAC-05, PRAC-06, PRAC-07
**Success Criteria** (what must be TRUE):
  1. User can swipe through word cards in a level, seeing Arabic word, transliteration, meaning, root, part of speech, occurrence count, and an example verse with the target word highlighted
  2. User can navigate forward and backward through cards and see their position within the level (e.g., "Word 3 of 40")
  3. User can practice due flashcards: front shows Arabic word, tapping reveals meaning and example verse, then user grades with Again/Hard/Good/Easy buttons showing next review intervals
  4. SM-2 algorithm correctly schedules reviews with interval fuzzing, daily review cap, and ease factor floor of 1.3
  5. All learning progress persists in local SQLite across app restarts
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — SM-2 algorithm with TDD, word/practice data services, navigation restructure (GestureHandlerRootView + RootStack)
- [x] 03-02-PLAN.md — Learn mode: level list screen and swipeable word card viewer with gesture navigation
- [x] 03-03-PLAN.md — Practice mode: practice home with stats, flashcard session with tap-to-reveal and SM-2 grading

### Phase 4: Quiz Mode, Progression, and Streaks
**Goal**: Users can test their knowledge, unlock new levels, track their growing Quran comprehension percentage, and maintain daily streaks
**Depends on**: Phase 3
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05, QUIZ-06, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, PROG-07, STRK-01, STRK-02
**Success Criteria** (what must be TRUE):
  1. User can take a 20-question quiz for any unlocked level with multiple choice and matching question types, seeing running score and progress
  2. Wrong answers immediately show the correct answer with an example verse; passing at 80%+ unlocks the next level; quizzes are freely retakable
  3. Home screen displays a large "X% of Quran understood" progress circle, total words learned, current streak, levels completed, and flashcards due for review
  4. Levels screen shows all levels with word count, cumulative coverage percentage, and lock/unlock/completion state
  5. Today's Verse appears on the home screen showing a daily Quran verse with a note like "You know X/Y words in this verse"
  6. Daily streak increments when user completes any learning activity and resets if a day is missed
  7. User sees milestone celebrations at 25%, 50%, 75%, and 100% Quran comprehension
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — progress service + streak store foundation (occurrence-weighted %, unlock rule, Today's Verse, milestone helper)
- [x] 04-02-PLAN.md — quiz mode: deterministic generation, grading, 80% pass/unlock, quiz home/session/result screens
- [x] 04-03-PLAN.md — journey home (% + stats + due CTA + Today's Verse + milestone modal), level lock/completion display, activity wiring

### Phase 5: Onboarding and Profile
**Goal**: New users are welcomed with an introduction to the app and placed at the right starting level, and returning users can view their complete learning history
**Depends on**: Phase 4
**Requirements**: ONBD-01, ONBD-02, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. First-time users see a 3-screen onboarding flow introducing the app concept and approach before reaching the main app
  2. Onboarding includes an Arabic level self-assessment that adjusts initial pacing (complete beginner / know alphabet / can read)
  3. Profile screen shows total words mastered, longest streak, and level completion history
  4. Profile screen displays a streak calendar (heatmap) of learning activity
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation and Arabic Rendering | 3/4 | Gap closure | - |
| 2. Navigation Shell and Settings | 0/2 | Planned | - |
| 3. Learn Mode and Spaced Repetition | 0/3 | Planned | - |
| 4. Quiz Mode, Progression, and Streaks | 3/3 | Complete | 2026-06-12 |
| 5. Onboarding and Profile | 0/1 | Not started | - |
