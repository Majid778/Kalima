# Architecture Patterns

**Domain:** Offline-first Quran vocabulary learning mobile app (React Native / Expo)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Recommended Architecture

Kalima follows a **layered offline-first architecture** with four tiers: Presentation (screens + components), State (React Context + useReducer), Data Access (Drizzle ORM over expo-sqlite with repositories), and Storage (single pre-bundled SQLite database).

```
+-------------------------------------------------------------+
|                     PRESENTATION LAYER                       |
|  Screens (Journey, Learn, Practice, Quiz, Profile)           |
|  Shared Components (ArabicText, WordCard, ProgressBar)       |
+-------------------------------------------------------------+
          |  useContext / props          ^  re-render
          v                             |
+-------------------------------------------------------------+
|                     STATE LAYER                              |
|  LearningContext     ProgressContext     SettingsContext      |
|  (active session,    (SRS aggregates,    (font size,         |
|   card queue)         streaks, %)         transliteration)   |
+-------------------------------------------------------------+
          |  repository calls            ^  useLiveQuery
          v                             |
+-------------------------------------------------------------+
|                   DATA ACCESS LAYER                          |
|  Drizzle ORM schema + typed queries                          |
|  Repository modules (words, progress, stats)                 |
|  useLiveQuery for reactive UI updates                        |
+-------------------------------------------------------------+
          |  SQL via Drizzle             ^  change events
          v                             |
+-------------------------------------------------------------+
|                   STORAGE LAYER                              |
|  expo-sqlite (single kalima.db file)                         |
|  Static partition: words, verses, levels (pre-bundled)       |
|  User partition: word_progress, streaks, settings (runtime)  |
+-------------------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **SQLite Database** | Single source of truth for all data -- Quran content (read-only) and user progress (read-write) | Data Access Layer only |
| **Data Access Layer** | Typed queries via Drizzle ORM, repository pattern per domain, reactive queries via useLiveQuery | Database (down), State Layer / Screens (up) |
| **LearningContext** | Active learning session state: current word, card queue, session timer, quiz answers | Data Access (reads words, writes progress), Presentation (provides session data) |
| **ProgressContext** | Aggregated stats: level unlock status, "X% of Quran understood", streak count | Data Access (reads/writes SRS data), Presentation (provides progress metrics) |
| **SettingsContext** | User preferences: Arabic font size, transliteration toggle, onboarding status | AsyncStorage or settings table for persistence, Presentation (provides settings) |
| **Navigation Shell** | Bottom tab bar + per-tab stack navigators, onboarding gate | All screens |
| **Screen Components** | Full-screen views that compose shared components and consume contexts | Contexts (consume), Navigation (route), Shared Components (compose) |
| **Shared Components** | Reusable UI: ArabicText, WordCard, ProgressBar, QuizOption -- receive props, no direct context access | Receive props from screens |
| **SM-2 Engine** | Pure function: takes current card state + quality rating, returns next state | Called by LearningContext, no database access |
| **Build Pipeline** | Node.js script that processes raw Quran data into kalima.db at build time | Tanzil.net XML, corpus.quran.com data (inputs), kalima.db (output) |

### Data Flow

**Read flow -- displaying a word card:**
```
User opens Learn screen for Level 3
  -> Screen calls wordRepository.getWordsForLevel(3)
  -> Drizzle query: select from words where levelId = 3
  -> Results returned as typed Word[] array
  -> Screen renders WordCard components with Arabic text + meaning
  -> useLiveQuery keeps UI reactive if progress writes change joined data
```

**Write flow -- answering a practice card:**
```
User grades recall quality (0-5) on a practice card
  -> PracticeScreen calls LearningContext.recordAnswer(wordId, quality)
  -> LearningContext calls sm2.calculateNextReview(currentState, quality)
     (pure function, no DB access, returns new ease/interval/dueDate)
  -> LearningContext calls progressRepository.updateProgress(wordId, newState)
  -> Drizzle runs: UPDATE word_progress SET ease_factor, interval, due_date, repetitions
  -> useLiveQuery triggers re-render of any listening components
  -> ProgressContext recomputes "X% of Quran understood" from aggregated progress data
```

**App startup flow:**
```
App launches
  -> SQLiteProvider loads kalima.db from assetSource (first launch copies from bundle)
  -> Drizzle migrations run via useMigrations hook
  -> SettingsContext loads user preferences
  -> ProgressContext hydrates aggregate stats (streak, level status, coverage %)
  -> Navigation checks onboarding_complete setting
  -> Renders OnboardingStack (first launch) or MainTabs (returning user)
```

**Quiz flow with level unlock:**
```
User completes level quiz with 85% score
  -> QuizScreen calls progressRepository.saveQuizResult(levelId, score, answers)
  -> Score >= 80% threshold triggers level unlock
  -> progressRepository.unlockLevel(nextLevelId)
  -> ProgressContext recalculates coverage % with newly accessible words
  -> QuizResultScreen shows score + "Level X Unlocked!" animation
  -> Journey screen reflects updated level status via useLiveQuery
```

## Database Architecture

### Single Database, Two Logical Partitions (Confidence: HIGH)

Use a **single SQLite file** (`kalima.db`) with two logical partitions: static Quran data (pre-bundled, read-only at runtime) and user data (empty at install, written at runtime).

**Why single-file over two separate databases:**
- Enables JOIN queries across content and progress (e.g., "get all Level 3 words with their SRS status") -- not possible across separate SQLite databases
- Simpler migration story -- one Drizzle config, one migration set
- expo-sqlite's `assetSource` pattern bundles one file cleanly
- Transactional consistency when writing progress that references content IDs

**Data update strategy for app updates:**
- User progress tables are never dropped or overwritten
- Content corrections use Drizzle ALTER/INSERT migrations
- For major data refreshes, a migration can UPDATE static table rows while preserving user tables
- The `assetSource.forceOverwrite` option is available but should NOT be used in production (destroys user data)

### Drizzle Schema Definitions

**Static Quran Data (pre-populated at build time):**

```typescript
// src/data/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const levels = sqliteTable('levels', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  wordCount: integer('word_count').notNull(),
  cumulativeCoverage: real('cumulative_coverage').notNull(), // e.g., 0.12 = 12%
});

export const words = sqliteTable('words', {
  id: integer('id').primaryKey(),
  arabic: text('arabic').notNull(),
  transliteration: text('transliteration').notNull(),
  meaning: text('meaning').notNull(),
  root: text('root'),                    // nullable for particles
  partOfSpeech: text('part_of_speech').notNull(),
  frequency: integer('frequency').notNull(),
  levelId: integer('level_id').notNull().references(() => levels.id),
  levelOrder: integer('level_order').notNull(),
});

export const wordVerses = sqliteTable('word_verses', {
  id: integer('id').primaryKey(),
  wordId: integer('word_id').notNull().references(() => words.id),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  arabicText: text('arabic_text').notNull(),
  translation: text('translation').notNull(),
  wordPosition: integer('word_position'),
});

export const verses = sqliteTable('verses', {
  id: integer('id').primaryKey(),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  surahNameArabic: text('surah_name_arabic').notNull(),
  surahNameEnglish: text('surah_name_english').notNull(),
  arabicText: text('arabic_text').notNull(),
  translation: text('translation').notNull(),
});
```

**User Data (empty at install, populated at runtime):**

```typescript
export const wordProgress = sqliteTable('word_progress', {
  wordId: integer('word_id').primaryKey().references(() => words.id),
  easeFactor: real('ease_factor').notNull().default(2.5),
  interval: integer('interval').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  dueDate: text('due_date').notNull().default('1970-01-01'),
  lastReviewed: text('last_reviewed'),
  status: text('status').notNull().default('new'), // new, learning, review, mastered
});

export const levelProgress = sqliteTable('level_progress', {
  levelId: integer('level_id').primaryKey().references(() => levels.id),
  unlocked: integer('unlocked').notNull().default(0),
  bestQuizScore: real('best_quiz_score'),
  completedAt: text('completed_at'),
});

export const dailyActivity = sqliteTable('daily_activity', {
  date: text('date').primaryKey(),           // ISO 'YYYY-MM-DD'
  wordsStudied: integer('words_studied').notNull().default(0),
  wordsReviewed: integer('words_reviewed').notNull().default(0),
  quizScore: real('quiz_score'),
});

export const quizResults = sqliteTable('quiz_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  levelId: integer('level_id').notNull(),
  score: real('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  completedAt: text('completed_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
```

### Key Indexes

```sql
CREATE INDEX idx_words_level ON words(level_id);
CREATE INDEX idx_words_frequency ON words(frequency DESC);
CREATE INDEX idx_word_verses_word ON word_verses(word_id);
CREATE INDEX idx_word_progress_due ON word_progress(due_date);
CREATE INDEX idx_word_progress_status ON word_progress(status);
CREATE INDEX idx_daily_activity_date ON daily_activity(date DESC);
```

### Database Size Estimate

| Data | Estimated Size |
|------|---------------|
| ~14,000 word forms with metadata | ~2 MB |
| ~6,236 verses with translations | ~5 MB |
| Word-verse example mappings | ~2 MB |
| Indexes | ~1 MB |
| **Total bundled** | **~10-12 MB** |
| User progress (max ~14K rows) | < 1 MB |

This is well within acceptable app bundle size. Audio (out of scope for v1) would add 200+ MB.

## Navigation Architecture (Confidence: HIGH)

```
RootStack (Native Stack Navigator)
  |
  +-- OnboardingStack (conditional, first launch only)
  |     +-- WelcomeScreen
  |     +-- AssessmentScreen (Arabic level self-assessment)
  |     +-- SetupCompleteScreen
  |
  +-- MainTabs (Bottom Tab Navigator -- 5 tabs)
        |
        +-- JourneyTab (Stack)
        |     +-- JourneyScreen (level list with progress/locks)
        |     +-- LevelDetailScreen (words in a level)
        |
        +-- LearnTab (Stack)
        |     +-- LearnHomeScreen (today's words, continue learning)
        |     +-- WordCardScreen (flashcard-style word introduction)
        |     +-- WordDetailScreen (full word info + example verses)
        |
        +-- PracticeTab (Stack)
        |     +-- PracticeHomeScreen (review queue summary)
        |     +-- PracticeSessionScreen (SRS review cards)
        |
        +-- QuizTab (Stack)
        |     +-- QuizSelectScreen (pick level to test)
        |     +-- QuizSessionScreen (MCQ, matching, fill-blank)
        |     +-- QuizResultScreen (score + level unlock)
        |
        +-- ProfileTab (Stack)
              +-- ProfileScreen (stats, streak calendar)
              +-- SettingsScreen (font size, transliteration toggle)
```

**Why this structure:**
- **Native Stack** for each tab: platform-native transitions, better performance than JS-based Stack
- **Per-tab stacks**: navigation state preserved when switching tabs (user doesn't lose their place)
- **Onboarding as separate stack**: replaced entirely after completion, never shown again
- **No modal routes for quizzes**: quizzes are full screens within the QuizTab stack, not modals, because they involve multi-step flows

### Bottom Tab Configuration

| Tab | Icon | Label | Badge |
|-----|------|-------|-------|
| Journey | map-outline | Journey | Current level number |
| Learn | book-open | Learn | New words available today |
| Practice | refresh-cw | Practice | Reviews due count |
| Quiz | check-circle | Quiz | -- |
| Profile | user | Profile | Streak fire icon if active |

## RTL and Arabic Text Handling (Confidence: HIGH)

### Approach: Selective RTL, NOT Full App RTL

**Do NOT call `I18nManager.forceRTL(true)`.** The app UI language is English (LTR). Only Arabic text content should render RTL. Forcing global RTL flips navigation direction, button layouts, padding, progress bars -- everything -- and requires overriding RTL on every non-Arabic element.

### ArabicText Component Pattern

```typescript
// src/components/ArabicText.tsx
import { Text, StyleSheet } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

interface ArabicTextProps {
  children: string;
  style?: any;
  scalable?: boolean;  // responds to user font size setting
}

export function ArabicText({ children, style, scalable = true }: ArabicTextProps) {
  const { arabicFontSize } = useSettings();

  return (
    <Text
      style={[
        styles.arabic,
        scalable && { fontSize: arabicFontSize },
        style,
      ]}
      allowFontScaling={false}  // control size via app settings, not system
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  arabic: {
    fontFamily: 'Amiri',           // bundled Arabic font
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 48,                // Arabic diacritics need vertical space
  },
});
```

### Font Strategy

Use **Amiri** (Google Fonts, OFL license) as the primary Arabic font. It is designed for Quranic text, supports full tashkeel (diacritical marks), and renders consistently across devices. Bundle via `expo-font` -- do not rely on system Arabic fonts, as rendering varies significantly between iOS and Android devices.

**Key considerations:**
- Arabic glyphs need ~1.5x the font size of Latin text for equivalent readability
- Store Arabic text WITH full diacritics (tashkeel) in the database
- Set generous `lineHeight` -- diacritics above and below letters need vertical space
- Disable system `allowFontScaling` on Arabic text to prevent layout breakage with heavy diacritics
- When Arabic and English appear on the same line, nest `<Text>` components with different `writingDirection`

## Patterns to Follow

### Pattern 1: Repository Module per Domain

Group all Drizzle queries for a domain into a repository module. Components and contexts never write raw queries.

```typescript
// src/data/repositories/wordRepository.ts
import { db } from '../database';
import { words, wordProgress } from '../schema';
import { eq, and, lte } from 'drizzle-orm';

export const wordRepository = {
  async getWordsForLevel(levelId: number) {
    return db.select().from(words)
      .where(eq(words.levelId, levelId))
      .orderBy(words.levelOrder);
  },

  async getDueWords(limit = 20) {
    const today = new Date().toISOString().split('T')[0];
    return db.select()
      .from(words)
      .innerJoin(wordProgress, eq(words.id, wordProgress.wordId))
      .where(lte(wordProgress.dueDate, today))
      .limit(limit);
  },

  async getWordsWithProgress(levelId: number) {
    return db.select()
      .from(words)
      .leftJoin(wordProgress, eq(words.id, wordProgress.wordId))
      .where(eq(words.levelId, levelId));
  },
};
```

### Pattern 2: Pure SM-2 Function

The SM-2 algorithm is a pure function with no side effects. Takes current card state + quality rating, returns next state. Testable in isolation.

```typescript
// src/core/sm2.ts
export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result extends SM2State {
  dueDate: string;
}

export function calculateNextReview(state: SM2State, quality: number): SM2Result {
  if (quality < 3) {
    return {
      easeFactor: state.easeFactor,
      interval: 1,
      repetitions: 0,
      dueDate: addDays(new Date(), 1),
    };
  }

  const newEF = Math.max(1.3,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval: number;
  if (state.repetitions === 0) newInterval = 1;
  else if (state.repetitions === 1) newInterval = 6;
  else newInterval = Math.round(state.interval * newEF);

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: state.repetitions + 1,
    dueDate: addDays(new Date(), newInterval),
  };
}
```

### Pattern 3: DatabaseProvider with Migration Gate

A provider that initializes expo-sqlite with the bundled asset, runs Drizzle migrations, and blocks rendering until ready.

```typescript
// src/data/DatabaseProvider.tsx
import { SQLiteProvider } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider
      databaseName="kalima.db"
      assetSource={{ assetId: require('../../assets/kalima.db') }}
      options={{ enableChangeListener: true }}
    >
      <MigrationGate>{children}</MigrationGate>
    </SQLiteProvider>
  );
}

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  if (error) return <MigrationErrorScreen error={error} />;
  if (!success) return <SplashScreen />;  // branded, not blank white
  return <>{children}</>;
}
```

### Pattern 4: Reactive Queries with useLiveQuery

Use Drizzle's `useLiveQuery` to automatically re-render when underlying data changes, eliminating manual state synchronization.

```typescript
// In a screen component
const { data: dueWords } = useLiveQuery(
  db.select().from(words)
    .innerJoin(wordProgress, eq(words.id, wordProgress.wordId))
    .where(lte(wordProgress.dueDate, today))
);
// Component re-renders automatically when word_progress rows are updated
```

**Requirement:** `enableChangeListener: true` must be set when opening the database.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Full App RTL Mode

**What:** Calling `I18nManager.forceRTL(true)` because the app has Arabic content.
**Why bad:** Flips all navigation, buttons, padding, progress bars. App UI is English -- global RTL creates a confusing experience. Also requires app restart on iOS (pre-RN 0.79).
**Instead:** Use `writingDirection: 'rtl'` and `textAlign: 'right'` only on Arabic text components.

### Anti-Pattern 2: Two Separate SQLite Databases

**What:** One database for Quran content, another for user progress.
**Why bad:** SQLite cannot JOIN across databases. Every query combining word data with progress (the most common pattern in this app) requires two separate queries and application-level merging. Doubles migration complexity. The supposed benefit of "safe content updates" is handled better by targeted migrations.
**Instead:** Single database with logical partitions. Migrations update static content without touching user tables.

### Anti-Pattern 3: Raw SQL Strings in Components

**What:** Writing SQL strings directly in screen components or context providers.
**Why bad:** No type safety, no autocomplete, SQL injection risk with string interpolation, scattered query logic that's hard to refactor.
**Instead:** Drizzle ORM query builder in repository modules. Components never see SQL.

### Anti-Pattern 4: Storing SRS State Only in React State

**What:** Keeping spaced repetition progress in Context/useState without persisting to SQLite after every answer.
**Why bad:** App crash or force-close loses entire session. User reviews 50 cards, app crashes, all progress lost.
**Instead:** Write each answer to SQLite immediately. Use useLiveQuery so UI stays reactive without manual state sync.

### Anti-Pattern 5: Eagerly Loading All Words into Memory

**What:** Loading all ~14,000 word forms into state on app launch.
**Why bad:** Unnecessary memory pressure. Most sessions touch 20-50 words.
**Instead:** Query per-level or per-session batches. SQLite is fast enough for on-demand reads. Use useLiveQuery for reactivity.

### Anti-Pattern 6: Caching Derived Percentages in the Database

**What:** Storing "52% of Quran understood" as a persisted value.
**Why bad:** Drifts from reality as users learn and forget words. The cached number becomes stale.
**Instead:** Compute coverage on-demand by joining word_progress with word frequency data. Cache in context (memory) but recompute on mount and after progress writes.

## Pre-Bundling Strategy (Confidence: HIGH)

### Build-Time Data Pipeline

```
Raw Quran data sources
  |
  +-- Tanzil.net (verified Arabic text, XML/text format)
  +-- corpus.quran.com (word-by-word morphology, roots, POS)
  +-- Sahih International + Pickthall translations
  |
  v
Node.js build script (scripts/build-database.ts)
  |---> Uses better-sqlite3 (Node.js SQLite driver)
  |---> Parses and normalizes source data
  |---> Computes frequency rankings
  |---> Assigns words to ~30 levels (25-50 words each)
  |---> Calculates cumulative coverage per level
  |---> Selects example verses for each word
  |---> Creates indexes
  |---> Outputs: assets/kalima.db
  |
  v
Metro bundler includes .db in app binary
  (requires metro.config.js: assetExts.push('db'))
  |
  v
expo-sqlite copies bundled DB to app documents on first launch
  (subsequent launches use the local copy, preserving user data)
```

### Metro + Babel Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db');
module.exports = config;

// babel.config.js (for Drizzle SQL migrations)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
```

## Recommended Project Structure

```
src/
  app/                           # App entry, root layout, providers
    _layout.tsx                  # Root: DatabaseProvider > SettingsProvider > ProgressProvider > Nav
  navigation/                    # Navigation configuration
    TabNavigator.tsx             # Bottom tab navigator (5 tabs)
    JourneyStack.tsx
    LearnStack.tsx
    PracticeStack.tsx
    QuizStack.tsx
    ProfileStack.tsx
  screens/                       # Screen components (thin, compose components + hooks)
    onboarding/
      WelcomeScreen.tsx
      AssessmentScreen.tsx
      SetupCompleteScreen.tsx
    journey/
      JourneyScreen.tsx          # Level list with progress indicators
      LevelDetailScreen.tsx      # Words in a level
    learn/
      LearnHomeScreen.tsx        # Today's words / continue
      WordCardScreen.tsx         # Flashcard introduction
      WordDetailScreen.tsx       # Full word info + verses
    practice/
      PracticeHomeScreen.tsx     # Review queue summary
      PracticeSessionScreen.tsx  # SRS card review
    quiz/
      QuizSelectScreen.tsx       # Pick level to test
      QuizSessionScreen.tsx      # MCQ / matching / fill-blank
      QuizResultScreen.tsx       # Score + unlock
    profile/
      ProfileScreen.tsx          # Stats, streak calendar
      SettingsScreen.tsx         # Font size, transliteration
  components/                    # Shared UI components
    ArabicText.tsx               # RTL Arabic text with font sizing
    WordCard.tsx                 # Word display card
    ProgressBar.tsx              # Level/overall progress
    QuizOption.tsx               # Answer option button
    StreakCalendar.tsx            # Activity heatmap
    PercentBadge.tsx             # "52% understood" badge
  contexts/                      # React Context providers
    LearningContext.tsx          # Active session state
    ProgressContext.tsx          # Aggregate stats, streak, level status
    SettingsContext.tsx          # User preferences
  core/                          # Pure business logic (no React, no DB)
    sm2.ts                       # SM-2 algorithm (pure function)
    scoring.ts                   # Quiz scoring, coverage % calculation
    quizGenerator.ts             # Generate quiz questions from word pool
    constants.ts                 # Level thresholds, SRS defaults
  data/                          # Data layer
    database.ts                  # Drizzle instance + DB initialization
    schema.ts                    # Drizzle table definitions
    DatabaseProvider.tsx         # SQLiteProvider + migration wrapper
    repositories/
      wordRepository.ts          # Word + verse queries
      levelRepository.ts         # Level queries
      progressRepository.ts      # SRS state + level progress
      statsRepository.ts         # Aggregation queries
    drizzle/                     # Generated SQL migrations
      migrations.ts
      0000_initial.sql
  hooks/                         # Custom React hooks
    useDueWords.ts               # Due review queue
    useLevelProgress.ts          # Progress for a specific level
    useStreak.ts                 # Current streak data
    useQuranCoverage.ts          # "X% understood" calculation
  theme/                         # Design tokens
    colors.ts                    # Dark theme, green accents (#4ade80)
    typography.ts                # Font families, sizes, line heights
    spacing.ts                   # Layout constants
  utils/                         # Date helpers, formatters
    dates.ts                     # addDays, formatDate, isToday
    arabic.ts                    # Diacritics stripping, text utilities

scripts/
  build-database.ts              # Node.js: raw data -> kalima.db
  import-tanzil.ts               # Tanzil.net XML parser
  import-corpus.ts               # corpus.quran.com data parser
  validate-data.ts               # Integrity checks on built DB

assets/
  kalima.db                      # Pre-built SQLite database
  fonts/
    Amiri-Regular.ttf
    Amiri-Bold.ttf
```

### Structure Rationale

- **`core/` has no React or DB imports.** SM-2, quiz generation, and scoring are pure functions, testable without mocking. This is critical for SRS algorithm correctness.
- **`data/repositories/` separate from `core/`.** Repositories handle Drizzle queries. Core handles business logic. A repository returns data; core decides what to do with it.
- **`components/` are prop-driven.** ArabicText, WordCard, etc. receive data via props. They do not call repositories or access contexts directly (with the exception of ArabicText reading font size from SettingsContext).
- **`screens/` are thin.** Screens compose components, consume contexts, and call hooks. Business logic lives in `core/`, data access in `data/`.
- **`hooks/` bridge data to React.** Custom hooks wrap repository calls with loading/error states and useLiveQuery reactivity.
- **`scripts/` is a separate Node.js concern.** The build pipeline runs in Node.js (not React Native) and uses `better-sqlite3` directly.

## Suggested Build Order (Dependencies)

Components should be built in this order based on dependency analysis:

```
Phase 1: Data Foundation (nothing else works without this)
  [1] Drizzle schema definitions (schema.ts)
      Dependencies: None
  [2] Build-time data pipeline (scripts/build-database.ts -> kalima.db)
      Dependencies: [1] schema for table structure reference
  [3] DatabaseProvider + Drizzle instance + migration setup
      Dependencies: [1] schema, [2] kalima.db asset
  [4] SM-2 pure function (core/sm2.ts)
      Dependencies: None (pure logic, can be built and tested in parallel)

Phase 2: Data Access + Core Components
  [5] Repository modules (wordRepository, progressRepository, etc.)
      Dependencies: [1] schema, [3] database
  [6] ArabicText component + font loading
      Dependencies: None (leaf component)
  [7] WordCard, ProgressBar, QuizOption components
      Dependencies: [6] ArabicText

Phase 3: State + Navigation Shell
  [8] Navigation shell (tabs + stacks, placeholder screens)
      Dependencies: None (structural)
  [9] SettingsContext, ProgressContext, LearningContext
      Dependencies: [5] repositories, [4] SM-2

Phase 4: Feature Screens (each depends on Phase 1-3)
  [10] Journey screens (level list, level detail)
       Dependencies: [5] levelRepository, [9] ProgressContext, [7] components
  [11] Learn screens (word cards, word detail with verses)
       Dependencies: [5] wordRepository, [9] LearningContext, [7] components
  [12] Practice screens (SRS review session)
       Dependencies: [4] SM-2, [5] progressRepository, [9] LearningContext
  [13] Quiz screens (test mode, scoring, level unlock)
       Dependencies: [5] repositories, [9] contexts, core/quizGenerator

Phase 5: Polish + Secondary Features
  [14] Profile + Stats screen (streak calendar, coverage %)
       Dependencies: [5] statsRepository, [9] ProgressContext
  [15] Onboarding flow (welcome, assessment, setup)
       Dependencies: [8] navigation, [9] SettingsContext
  [16] Today's Verse feature
       Dependencies: [5] wordRepository, [6] ArabicText
  [17] Settings screen (font size, transliteration toggle)
       Dependencies: [9] SettingsContext
```

**Key insight:** The data pipeline ([2]) and Drizzle schema ([1]) are the absolute foundation. Everything else depends on having real data in the database. The SM-2 function ([4]) and UI components ([6], [7]) have zero data dependencies and can be built in parallel with the data layer. Screens ([10]-[13]) can also be built in parallel once Phase 1-3 is complete.

## Scalability Considerations

| Concern | At v1 (current) | At v2 (future) |
|---------|-----------------|-----------------|
| Database size | ~10-12 MB bundled, trivial | Add audio: download per-level, not bundled (~200MB total) |
| Query performance | ~14K words, 6K verses, indexed -- trivial for SQLite | No concern at this data scale |
| SRS queue | Max ~14K cards, indexed on due_date | No concern. Anki handles 100K+ cards in SQLite |
| App bundle size | ~20-25 MB (DB + font + app) | Audio would push to 200MB+ (use on-demand download) |
| State management | React Context sufficient for 3 contexts | If v2 adds cloud sync, consider Zustand or TanStack Query |
| Offline -> Online | Fully offline, no sync needed | Cloud sync: last-write-wins per card is sufficient for SRS data |

## Sources

- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) -- assetSource, SQLiteProvider, enableChangeListener, database API (HIGH confidence)
- [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) -- Drizzle + expo-sqlite connection, useLiveQuery, migrations (HIGH confidence)
- [Expo Local-First Architecture Guide](https://docs.expo.dev/guides/local-first/) -- offline-first patterns with Expo (HIGH confidence)
- [React Navigation - Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/) -- tab navigator configuration (HIGH confidence)
- [React Navigation - Nesting Navigators](https://reactnavigation.org/docs/nesting-navigators/) -- stack-in-tabs pattern (HIGH confidence)
- [React Native I18nManager](https://reactnative.dev/docs/i18nmanager) -- RTL layout API (HIGH confidence)
- [SM-2 Algorithm Explained](https://tegaru.app/en/blog/sm2-algorithm-explained) -- algorithm details and implementation (MEDIUM confidence)
- [Building Offline-First Expo App with Drizzle](https://medium.com/@detl/building-an-offline-first-production-ready-expo-app-with-drizzle-orm-and-sqlite-f156968547a2) -- production patterns (MEDIUM confidence)
- [RTL in React Native Expo](https://geekyants.com/blog/implementing-rtl-right-to-left-in-react-native-expo---a-step-by-step-guide) -- selective RTL approach (MEDIUM confidence)

---
*Architecture research for: Kalima -- Quran Vocabulary Learning App*
*Researched: 2026-03-28*
