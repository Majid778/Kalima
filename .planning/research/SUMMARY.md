# Project Research Summary

**Project:** Kalima — Quran Vocabulary Learning App
**Domain:** Offline-first mobile vocabulary learning app (React Native / Expo)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

Kalima is a focused, offline-first Quran vocabulary app built on Expo SDK 55 with a pre-bundled SQLite database, custom SM-2 spaced repetition, and a 30-level progression system. The research is unambiguous on the core approach: the entire product depends on getting a high-quality, frequency-ranked Arabic vocabulary database built first, and everything else layers on top. Experts build this type of app with a layered architecture — static Quran content in SQLite, user progress in the same database, pure-function SRS logic, and reactive queries via Drizzle's `useLiveQuery`. The closest competitor (Kalaam) validates the market, but its drift into social features creates an opening for a clean, focused alternative.

The recommended approach is a 5-phase build: data pipeline and foundation first, then core UI and navigation shell, then the learning mechanics (SM-2 practice), then quizzes and level progression, and finally polish and the "Today's Verse" engagement feature. The sadaqah (free, no ads) positioning is a genuine differentiator in a space littered with freemium paywalls — lean into it from day one. The single most important differentiator to protect is the "X% of Quran understood" metric, which must be computed correctly (based on word occurrence tokens, not unique forms) or the motivational core of the app collapses.

The top risks are data accuracy (incorrect Quran text is trust-destroying and unrecoverable), Arabic font rendering failures (especially on Samsung devices), and SM-2 implementation errors that silently produce bad review schedules. All three must be addressed in Phase 1 before a single feature screen is built. NativeWind v5 is the one mild uncertainty in the stack — it is new enough that a `StyleSheet.create()` fallback plan should be kept ready. Otherwise the stack has a HIGH confidence rating across the board.

## Key Findings

### Recommended Stack

The stack is tightly integrated around the Expo managed workflow with SDK 55, which provides React Native 0.83, React 19.2, and the New Architecture (Fabric/TurboModules) as defaults. The data layer is expo-sqlite with Drizzle ORM — the official Expo-supported combination with synchronous reads, reactive `useLiveQuery`, and type-safe schema definitions. State management is Zustand (~1kb) over the React Context originally noted in PROJECT.md; Context causes full subtree re-renders on any change, which creates jank on quiz screens with timers and counters. The SM-2 algorithm is implemented as a custom pure function (~30 lines) rather than a dependency, giving full control over tuning for Arabic learners. Animations use Reanimated v4 (New Architecture only, matching SDK 55), and MMKV handles fast synchronous key-value storage for preferences and streak data.

See `.planning/research/STACK.md` for full version table, installation commands, and configuration notes.

**Core technologies:**
- **Expo SDK 55 / React Native 0.83**: App framework — latest stable, New Architecture mandatory, OTA updates via EAS for Quran data corrections
- **expo-sqlite + Drizzle ORM**: Data layer — type-safe SQL, reactive queries, official Expo integration, `useMigrations` prevents race conditions
- **Zustand ~5.x**: State management — replaces Context to avoid quiz screen re-render jank; `persist` middleware with MMKV handles streaks/settings
- **react-native-mmkv**: Key-value storage — 30x faster than AsyncStorage, synchronous JSI reads for settings/streak hydration
- **React Navigation 7.x**: Navigation — bottom tabs + native stacks for 4-5 tab layout; Expo Router adds indirection with no benefit at this scale
- **NativeWind v5**: Styling — Tailwind utility classes, dark mode built-in; fallback to StyleSheet.create() if instability arises (v5 is new)
- **react-native-reanimated v4**: Animations — card flip, progress bars, quiz transitions; UI thread worklets eliminate jank
- **Custom SM-2**: Spaced repetition — owns the algorithm, free to tune; zero dependency overhead for 30 lines of math
- **EAS Build/Update/Submit**: CI/CD — OTA pushes for Quran data fixes; critical for a religious accuracy app post-launch

### Expected Features

Research identified 11 table-stakes features, 7 differentiators, and 10 explicit anti-features. The competitive landscape (Kalaam, Quranic, Quran Flow, Quran Progress) validates the core loop and reveals where Kalima can win.

See `.planning/research/FEATURES.md` for full competitive analysis and dependency graph.

**Must have (table stakes):**
- Frequency-based word ordering — every serious competitor does this; top 125 words = ~50% Quran coverage is the standard hook
- Spaced repetition review (SM-2) — expected by users; core retention mechanism
- Word cards with Arabic, meaning, transliteration, root, and example verse
- Quiz/test mode — multiple choice minimum; gating for level unlock
- Progress dashboard with clear metrics (words learned, levels, review stats)
- Offline functionality — pre-bundled SQLite; no network needed for core learning
- Adjustable Arabic font size — accessibility, critical for older users
- Dark mode — already planned as primary theme
- Onboarding with level assessment — prevents beginner overwhelm
- Daily streak tracking — lightweight consistency motivation

**Should have (competitive differentiators):**
- "X% of Quran understood" as the persistent hero metric — no competitor makes this the central dashboard number; this is Kalima's core value proposition
- Level unlock system with 80%+ mastery gates — structured progression vs. competitors' loose sequences
- Today's Verse with word knowledge overlay — daily engagement hook showing learned vocabulary applied to real Quran text
- Completely free (sadaqah model) — competitors charge $5-8/month; prominent positioning advantage
- Root word connections on word cards — Arabic intuition building; most competitors skip this
- Clean, focused UX — restraint as a feature; Kalaam and Quranic have become bloated

**Defer to v1.5/v2:**
- Surah-aware progress ("78% of Al-Fatiha") — high value but data-intensive; validate core loop first
- Audio pronunciation — adds 100MB+ to bundle; transliteration covers the v1 need
- Root word exploration mode — showing root on cards is enough; full exploration is scope creep
- Light mode toggle — dark-first is acceptable; add after launch
- Export/backup and cloud sync — local-only for v1; backend adds massive complexity

**Do not build (anti-features):**
- Gamification with XP/leaderboards/hearts — disrespectful to Quran study context; negative user reviews on competitors
- Social features — moderation, safety, backend infrastructure; dilutes focus
- Push notifications — backend dependency, notification fatigue
- Full Quran reader — Quran.com already does this; massive scope with no differentiation
- AI features — backend dependency, API cost, incompatible with free model and offline-first

### Architecture Approach

Kalima uses a layered offline-first architecture: Presentation (screens + shared components), State (React Context providers for learning session, progress aggregates, and settings), Data Access (Drizzle ORM repository modules per domain), and Storage (single pre-bundled `kalima.db` SQLite file with static Quran content and user progress partitions). The SM-2 engine is a pure function in `core/sm2.ts` with no React or database imports — it takes card state and quality rating, returns next state. Drizzle's `useLiveQuery` eliminates manual state synchronization: when progress is written to SQLite, UI components re-render automatically. A Node.js build pipeline runs at build time to process raw Tanzil.net/corpus.quran.com data into the pre-bundled database.

The architecture note in ARCHITECTURE.md recommends React Context + useReducer for state — the STACK.md research challenges this for the quiz screen use case. Recommendation: use Zustand over Context for LearningContext and ProgressContext to avoid re-render jank during active sessions. SettingsContext can remain as React Context given its low-frequency update pattern.

See `.planning/research/ARCHITECTURE.md` for full schema definitions, data flow diagrams, navigation tree, and project directory structure.

**Major components:**
1. **Build-time data pipeline** (`scripts/build-database.ts`) — Node.js script processing Tanzil.net XML + corpus.quran.com morphology into `assets/kalima.db`; runs before app build, not at runtime
2. **DatabaseProvider** — wraps `SQLiteProvider` with `assetSource`, runs Drizzle migrations via `useMigrations`, blocks render until ready; one-time copy of bundled DB on first launch
3. **Repository layer** (`data/repositories/`) — all Drizzle queries grouped by domain (words, levels, progress, stats); screens and contexts never write raw SQL
4. **SM-2 engine** (`core/sm2.ts`) — pure function with ease factor floor (1.3 minimum), repetition counter reset on failure, interval fuzzing; fully unit-testable without mocking
5. **LearningContext + ProgressContext** — session state and aggregate stats; write every answer to SQLite immediately (no crash data loss), recompute coverage % on mount and after writes
6. **ArabicText component** — encapsulates `writingDirection: 'rtl'`, `textAlign: 'right'`, Amiri font, configurable size; used everywhere Arabic text appears

### Critical Pitfalls

PITFALLS.md identified 4 critical, 5 moderate, and 4 minor pitfalls with specific technical causes and proven mitigations. All 4 critical pitfalls must be addressed before any feature screen is built.

See `.planning/research/PITFALLS.md` for full descriptions, detection strategies, and phase warnings.

1. **Inaccurate Quran text data** — Use Tanzil.net as primary source (letter-by-letter checksums verified against Medina Mushaf since 2008); build automated checksum validation into the database build pipeline; manually spot-check the 125 highest-frequency words before every release; cross-verify frequency counts against multiple sources (corpus.quran.com, qurananalysis.com)

2. **Arabic font rendering failure** — Bundle KFGQPC Uthmanic Script HAFS (Unicode, single file) via `expo-font` config plugin (build-time embedding, no runtime FOUT); do NOT use QCF glyph-based fonts (designed for Mushaf page reproduction, not individual word display); test on Samsung devices specifically (known character truncation bug from custom rendering engine); set generous `lineHeight` (diacritics need vertical space); disable `allowFontScaling` on Arabic text

3. **RTL/LTR layout chaos** — Keep the app in LTR mode; do NOT call `I18nManager.forceRTL()`; use `writingDirection: 'rtl'` and `textAlign: 'right'` exclusively on the `<ArabicText>` component; test every screen on both iOS and Android; avoid `textAlign: 'justify'` (known React Native bug #32146 causes Arabic text overflow)

4. **SM-2 algorithm errors** — Implement `Math.max(1.3, newEF)` ease factor floor; reset repetition counter to 0 on failure (quality < 3); add interval fuzzing (+/- 5-10%) to prevent same-day cards clustering; cap overdue card bonus; implement daily review cap (30-50/day); unit-test every edge case including first review, repeated failure, long-overdue card, minimum EF boundary

5. **"% of Quran understood" miscalculation** — Base percentage on word occurrence tokens (77,430 total), NOT unique forms (14,000); learning top 125 words = ~50% occurrence coverage; validate against published benchmarks: top 100 words should yield ~45-50%, top 500 should yield ~75-80%; document and communicate the methodology to users

## Implications for Roadmap

Based on the combined research, the dependency graph is clear: the data pipeline is the absolute foundation, and the build order flows naturally from data to UI shell to learning mechanics to progression to polish.

### Phase 1: Data Foundation and Project Setup

**Rationale:** Everything in the app — word cards, quiz questions, SRS scheduling, coverage percentage — depends on having accurate, frequency-ranked, verse-mapped vocabulary data in a pre-built SQLite database. This is not optional; the app cannot be developed in any meaningful way without it. Font and RTL infrastructure must also be established here since every feature screen uses Arabic text.

**Delivers:** Pre-built `kalima.db` with verified Quran vocabulary data; Expo project scaffolding; DatabaseProvider with migrations; ArabicText component; Zustand stores and Drizzle schema

**Addresses from FEATURES.md:** Word database (foundation for all features), offline-first architecture, frequency-based ordering

**Avoids from PITFALLS.md:** Inaccurate Quran text (Tanzil checksums, multi-source frequency validation), Arabic font failure (KFGQPC Unicode font, build-time embed), RTL chaos (ArabicText component established early), pre-bundled DB mismanagement (correct metro config, `SQLiteProvider assetSource`), bundle size explosion (target <15MB for DB, normalize aggressively)

**Research flag:** Low — Tanzil.net and corpus.quran.com are well-documented data sources; expo-sqlite/Drizzle integration is officially documented with high confidence

### Phase 2: Navigation Shell and Core UI Components

**Rationale:** The navigation structure and shared components (WordCard, ProgressBar, QuizOption) must exist before any feature screen can be built. Establishing these as a skeleton with placeholder screens early allows all subsequent phases to slot in cleanly without structural refactoring.

**Delivers:** Working 5-tab navigation shell (Journey, Learn, Practice, Quiz, Profile + Onboarding stack); shared reusable components; dark theme; SettingsContext (font size, transliteration toggle)

**Uses from STACK.md:** React Navigation 7.x (bottom tabs + native stacks), NativeWind v5, react-native-reanimated v4, expo-haptics

**Implements from ARCHITECTURE.md:** Navigation shell, shared component library, SettingsContext, theme layer

**Research flag:** Low — React Navigation 7.x is well-documented; NativeWind v5 is the one moderate risk (relatively new); keep StyleSheet.create() fallback plan ready

### Phase 3: Learn Mode and Spaced Repetition

**Rationale:** The core learning loop — introducing new words and scheduling reviews — is the heart of the product. SM-2 must be implemented correctly and unit-tested before any user can interact with it. Practice mode (SRS reviews) depends on Learn mode having introduced words. Both ship together as the primary retention mechanism.

**Delivers:** WordCardScreen (flashcard introduction with Arabic, meaning, transliteration, root, example verse); PracticeSessionScreen (SM-2 review cards); LearningContext (active session management); progressRepository (SRS state writes with immediate persistence); daily review queue with cap (30-50/day)

**Uses from STACK.md:** Custom SM-2 pure function, Drizzle `useLiveQuery`, Reanimated card flip animations, expo-haptics for answer feedback

**Implements from ARCHITECTURE.md:** SM-2 engine (pure function), LearningContext, progressRepository, write-on-answer pattern (crash-safe)

**Avoids from PITFALLS.md:** SM-2 algorithm errors (ease factor floor, repetition reset, interval fuzzing, unit tests), review overload (daily cap, new word limit), SQLite performance (indexed `due_date`, paginated queries)

**Research flag:** Medium — SM-2 edge case behavior (overdue cards, leech detection, interval fuzzing) needs careful unit test coverage; the overdueness bonus behavior is empirically documented but implementation details require validation

### Phase 4: Quiz Mode and Level Progression System

**Rationale:** The level unlock system (80%+ gate) and quiz mode depend on having Learn + Practice already working. Users need to have encountered words in Learn mode before being tested. The "X% of Quran understood" hero metric becomes meaningful once multiple levels can be completed.

**Delivers:** QuizSessionScreen (multiple choice, optional matching); QuizResultScreen (score + level unlock animation); JourneyScreen (level map with progress/locks); LevelDetailScreen; ProgressContext with coverage % calculation; levelRepository with unlock logic

**Uses from STACK.md:** core/quizGenerator.ts (pure function, randomly samples level word pool), core/scoring.ts, Drizzle queries with JOIN across words + word_progress, Reanimated for unlock celebration

**Implements from ARCHITECTURE.md:** Quiz flow with level unlock, ProgressContext coverage % computation (on-demand, not cached in DB), quizResults table

**Avoids from PITFALLS.md:** Coverage % miscalculation (token-based, validated against benchmarks), level unlock frustration (fair test sampling from full pool, show wrong answers, allow SRS to continue while retrying), tashkeel matching (strip diacritics for answer comparison)

**Research flag:** Low — level gating and MCQ quiz patterns are standard; the coverage % calculation deserves a standalone unit test suite against published frequency benchmarks before shipping

### Phase 5: Onboarding, Profile, and Today's Verse

**Rationale:** Onboarding requires the full navigation shell and level system to exist so it can place users at the right starting level. Profile/stats screens aggregate data that is only meaningful after Phase 3-4 generates real progress data. Today's Verse is the daily engagement hook — the last feature to add because it has no dependencies blocked by other phases, but benefits from having the full word-to-verse mapping validated.

**Delivers:** OnboardingStack (welcome, Arabic level self-assessment, setup complete); ProfileScreen (streak calendar, coverage metrics); SettingsScreen (font size, transliteration toggle); Today's Verse screen with word knowledge color overlay; streak tracking with dailyActivity writes

**Uses from STACK.md:** react-native-mmkv for onboarding completion flag, statsRepository for aggregation queries, expo-haptics for streak celebration

**Implements from ARCHITECTURE.md:** App startup flow (onboarding gate check), ProgressContext streak hydration, Today's Verse word-knowledge overlay

**Avoids from PITFALLS.md:** OTA + DB schema mismatch awareness (version pinning, graceful degradation messaging)

**Research flag:** Low — all patterns are standard for this stack; Today's Verse word overlay calculation should be validated against the same frequency data validated in Phase 4

### Phase Ordering Rationale

- **Data before UI:** The architecture research is explicit — `kalima.db` is the absolute dependency for every feature. No meaningful development can proceed without real word data.
- **ArabicText early:** The font and RTL component must be established in Phase 1 and used everywhere from day one. Retrofitting RTL handling later is a documented cause of layout chaos across the codebase.
- **Navigation shell before feature screens:** Avoids structural refactoring when adding the 4th and 5th tabs. Placeholder screens in Phase 2 keep the shell buildable without feature dependencies.
- **Learn before Quiz:** Users must encounter words in Learn/Practice before being tested. The quiz word pool comes from level completion in the learning flow.
- **Progression after core loop:** The level unlock system is motivationally meaningful only once users have experienced the core learn-practice loop. Building the journey map before the cards exist would produce an empty shell.
- **Onboarding last:** Counterintuitively, onboarding is the last thing to polish because it requires the full system to exist in order to place users correctly. A stub "skip to level 1" is sufficient for internal development builds.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (SM-2 / Practice):** The overdue card handling, leech detection thresholds, and interval fuzzing percentages are empirically informed but not definitively established for Quran vocabulary specifically. Plan to analyze beta retention data and adjust before public launch.
- **Phase 1 (Data pipeline):** corpus.quran.com has documented gaps in root mappings for non-noun word forms and time adverbs. The build script will need custom disambiguation logic — this is more complex than importing a clean dataset. Budget extra time.

Phases with standard patterns (skip deeper research):
- **Phase 2 (Navigation shell):** React Navigation 7.x bottom tabs + native stacks is thoroughly documented with official examples. No research needed.
- **Phase 4 (Quiz/Levels):** Multiple choice quiz patterns and level gating are standard mobile patterns. No novel technical territory.
- **Phase 5 (Onboarding/Profile):** Standard mobile patterns for both. Today's Verse overlay uses the same word-frequency join already built in Phase 4.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core packages are officially documented; Expo SDK 55 is current stable; only NativeWind v5 is new enough to warrant a fallback plan |
| Features | HIGH | Competitive landscape well-researched with direct competitor comparisons; feature decisions are grounded in user review analysis and published app comparisons |
| Architecture | HIGH | Expo official docs confirm assetSource pattern, SQLiteProvider, useLiveQuery; Drizzle integration is officially documented; single-database design is well-justified |
| Pitfalls | HIGH | Most pitfalls sourced from official issue trackers (React Native, Expo) and primary sources (Tanzil, Quran Foundation font docs); SM-2 overdue analysis from 13 years of Anki data |

**Overall confidence:** HIGH

### Gaps to Address

- **NativeWind v5 stability:** Released early 2026; community feedback is limited. Validate styling approach by implementing the ArabicText component and a sample word card early in Phase 1. If any blocker appears, switch to StyleSheet.create() before more UI is built.
- **corpus.quran.com data completeness:** Known gaps in root mappings (time adverbs, non-noun forms) and potential frequency count discrepancies (e.g., "yawm" under-counted). The build pipeline must include explicit validation checks and cross-referencing against qurananalysis.com before the database is considered production-ready.
- **Zustand vs. Context decision:** ARCHITECTURE.md specifies React Context + useReducer; STACK.md argues for Zustand on performance grounds. This should be resolved explicitly in requirements or early Phase 1 prototyping. Recommendation: Zustand for LearningContext and ProgressContext (high-frequency updates), Context acceptable for SettingsContext (low-frequency).
- **Coverage % word grouping policy:** Research recommends grouping by lemma (so "kitab" and "al-kitab" both count when the lemma is learned), but this must be formally defined and encoded in the data pipeline before Phase 4 ships the metric to users. Changing the definition post-launch resets everyone's displayed percentage.
- **Samsung Arabic rendering:** A documented character truncation bug exists on Samsung devices. Physical device testing on a Samsung Android is required before beta — this cannot be caught in simulators.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Release](https://expo.dev/changelog/sdk-55-beta) — SDK 55 features, React Native 0.83, React 19.2, New Architecture
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) — assetSource, SQLiteProvider, enableChangeListener, synchronous API
- [Drizzle ORM — Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) — official integration, useLiveQuery, migrations
- [Expo Local-First Architecture Guide](https://docs.expo.dev/guides/local-first/) — offline-first patterns
- [React Navigation 7](https://reactnavigation.org/) — bottom tabs, native stack, nesting navigators
- [Tanzil Project — Quranic Fonts Documentation](https://tanzil.net/docs/quranic_fonts) — verified Arabic text, checksums
- [Quranic Arabic Corpus — Lemmas by Frequency](https://corpus.quran.com/lemmas.jsp) — morphological data, frequency lists
- [Quran Foundation — Font Rendering Documentation](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) — QCF vs Unicode font distinction
- [React Native I18nManager](https://reactnative.dev/docs/i18nmanager) — RTL layout API
- [React Native Issue #32146](https://github.com/facebook/react-native/issues/32146) — Arabic text overflow with justify
- [Expo SQLite Issue #16637](https://github.com/expo/expo/issues/16637) — memory leak in long sessions
- [Expo Android Bundled DB Issue #15267](https://github.com/expo/expo/issues/15267) — Android asset loading
- [SM-2 Algorithm — Anki FAQ](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) — authoritative SM-2 reference

### Secondary (MEDIUM confidence)
- [NativeWind v5](https://www.nativewind.dev/docs/getting-started/installation) — Tailwind v4.1+, React Native 0.81+; limited community track record
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) — 30x faster than AsyncStorage, JSI sync
- [SM-2 Overdue Card Analysis](https://controlaltbackspace.org/overdue-handling/) — 13 years of Anki data; empirical, not authoritative
- [Kalaam App](https://www.kalaamapp.com/) — closest competitor; feature comparison
- [Quran Flow](https://apps.apple.com/us/app/quran-flow-quran-vocabulary/id6757132321) — FSRS algorithm, mastery heatmap, competitor
- [ResearchGate — User Review Analysis](https://www.researchgate.net/publication/337532502) — app user review analysis
- [Building Offline-First Expo App with Drizzle](https://medium.com/@detl/building-an-offline-first-production-ready-expo-app-with-drizzle-orm-and-sqlite-f156968547a2) — production patterns
- [Architecting RTL in React Native (Feb 2026)](https://medium.com/@ancybhairavi/architecting-rtl-in-react-native-what-breaks-and-what-works-8d96c8cba62b) — selective RTL approach

### Tertiary (LOW confidence — needs validation during implementation)
- Expo EAS Build asset size limits (~25MB practical limit) — community forum, not official docs; validate with actual kalima.db size during Phase 1
- KFGQPC Uthmanic font completeness on all Android devices — needs physical device validation in Phase 1

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
