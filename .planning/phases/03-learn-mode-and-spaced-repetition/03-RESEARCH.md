# Phase 03: Learn Mode and Spaced Repetition - Research

**Researched:** 2026-03-30
**Domain:** React Native gesture-driven card UI, SM-2 spaced repetition algorithm, Drizzle ORM queries, nested navigation
**Confidence:** HIGH

## Summary

This phase implements two core learning features: a swipeable word card viewer for browsing vocabulary within levels, and an SM-2-based flashcard practice system with grading and scheduling. The codebase already has the database schema (`word_progress` with all SM-2 fields), UI primitives (`ArabicText`, color/typography constants), settings integration (`showTransliteration`, `arabicFontSize`), and installed packages (`react-native-reanimated` ~4.1.1, `react-native-gesture-handler` ~2.28.0, `expo-haptics`). The remaining work is: (1) implementing the horizontal swipe gesture for card navigation using Gesture.Pan + Reanimated shared values, (2) building the SM-2 scheduling logic as a pure function (~40 lines), (3) wiring Drizzle queries for words/verses/progress, and (4) restructuring navigation to nest stack navigators inside tabs (with tab bar hidden on card/practice screens).

The critical missing infrastructure piece is that `GestureHandlerRootView` does not yet wrap the app in `App.tsx` -- this MUST be added before any gesture-based screens work.

**Primary recommendation:** Build the SM-2 algorithm as a standalone pure function with comprehensive unit tests first, then build the card UI screens, then wire navigation. The algorithm is the riskiest piece (subtle math bugs cause invisible scheduling errors), so test-first development is essential.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full-screen card layout -- one card fills the screen below the header, swipe left/right to navigate
- **D-02:** Card field order (top to bottom): Arabic word (large, centered), transliteration (conditional on `showTransliteration`), meaning, root + part of speech on one line, occurrence count, divider, example verse section
- **D-03:** Example verse section: full Arabic ayah with the target word highlighted in green (`colors.primary`), English translation below in `textSecondary`
- **D-04:** Swipe gesture: left = next card, right = previous card (using react-native-gesture-handler + reanimated)
- **D-05:** Position indicator in header: "Word 3 of 40" -- simple text, not a progress bar
- **D-06:** Header shows level name with back button to return to level list
- **D-07:** No "mark as learned" or completion tracking on word cards
- **D-08:** Front of flashcard shows Arabic word only (large, centered)
- **D-09:** Tap anywhere on card to reveal back -- no flip animation, simple fade-in
- **D-10:** Back reveals: transliteration (if enabled), meaning, example verse with target word highlighted
- **D-11:** Four grading buttons: Again (red), Hard (orange), Good (green), Easy (blue)
- **D-12:** Each button shows next review interval (e.g., "Again -- 1m", "Good -- 1d")
- **D-13:** After grading, automatically advance to next due card
- **D-14:** Practice session header shows cards remaining count
- **D-15:** Standard SM-2: initial interval = 1 day, second interval = 6 days, EF start = 2.5, EF floor = 1.3
- **D-16:** Interval fuzzing: +/-10% on intervals > 1 day
- **D-17:** Daily review cap: 200 cards max
- **D-18:** Grade mapping: Again = reset to interval 1, ease -0.20; Hard = interval x 1.2, ease -0.15; Good = interval x EF; Easy = interval x EF x 1.3, ease +0.15
- **D-19:** No new card cap -- user controls pace by level choice
- **D-20:** Status values: 'new', 'learning' (interval < 21 days), 'review' (interval >= 21 days)
- **D-21:** Learn tab shows list of levels with number, name, word count, cumulative coverage %
- **D-22:** Tapping level opens word card viewer (stack push)
- **D-23:** Practice tab shows due count, Start Practice button, new/learning/review counts
- **D-24:** No cards due: show "All caught up!" with next review date
- **D-25:** Stack navigators nested inside Learn and Practice tabs -- tab bar hides on card/practice screens
- **D-26:** Transliteration respects `showTransliteration` from settings store
- **D-27:** Arabic font size from settings store applies to word cards and flashcards

### Claude's Discretion
- Card transition animation style (slide, fade, etc.)
- Exact spacing, padding, margins on cards
- Level list row design details
- Loading states for database queries
- How to handle levels with 0 words (edge case)
- Practice session completion celebration (if any)

### Deferred Ideas (OUT OF SCOPE)
- Quiz mode -- Phase 4
- Level unlock/lock progression -- Phase 4
- Streak tracking -- Phase 4
- Home screen progress metrics -- Phase 4
- Daily card limit as a user setting -- future enhancement
- Card flip animation (3D) -- revisit if simple reveal feels too flat
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEARN-01 | User can browse all words in a level via swipeable word cards | Gesture.Pan + Reanimated pattern for horizontal swipe; Drizzle query for words by levelId |
| LEARN-02 | Each word card displays Arabic word, transliteration, meaning, root, POS, occurrence count | ArabicText component reuse; settingsStore for transliteration toggle; schema has all fields |
| LEARN-03 | Each word card shows example verse with target word highlighted | Drizzle join on word_verses table; wordPosition field for highlight logic |
| LEARN-04 | User can navigate forward/backward through cards | Gesture.Pan with left/right swipe detection; shared value for current index |
| LEARN-05 | User can see position within level (e.g., "Word 3 of 40") | Header text derived from index + total count from query |
| PRAC-01 | User can practice due flashcards using SM-2 | SM-2 pure function implementation; due cards query via dueDate <= today |
| PRAC-02 | Flashcard front shows Arabic; tap reveals meaning + verse | Tap gesture (Pressable or Gesture.Tap); fade-in with Reanimated |
| PRAC-03 | Four grading buttons with next interval shown | SM-2 preview function to calculate intervals for each grade; color constants from theme |
| PRAC-04 | SM-2 correctly updates interval, EF, and next review date | Core algorithm with exact parameters from D-15/D-18; unit tested |
| PRAC-05 | Interval fuzzing, daily cap, EF floor | Fuzzing: Math.random() * 0.2 - 0.1 on intervals > 1; cap: query LIMIT 200; floor: Math.max(1.3, ef) |
| PRAC-06 | Practice session shows due and new card counts | Drizzle COUNT queries grouped by status |
| PRAC-07 | Progress persists in SQLite across app launches | word_progress table with upsert on grade; Drizzle onConflictDoUpdate |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies needed)

| Library | Version (in package.json) | Purpose | Why Standard |
|---------|--------------------------|---------|--------------|
| react-native-gesture-handler | ~2.28.0 | Swipe gestures on word cards | Already installed; Gesture.Pan for horizontal navigation |
| react-native-reanimated | ~4.1.1 | Card transition animations | Already installed; useSharedValue + useAnimatedStyle for 60fps transitions |
| expo-haptics | ~15.0.8 | Haptic feedback on grade | Already installed; impactAsync for button press feedback |
| drizzle-orm | ^0.45.0 | Type-safe SQLite queries | Already installed; select/join/upsert for words, verses, progress |
| expo-sqlite | ~16.0.0 | Local database | Already installed; openDatabaseSync with enableChangeListener |
| @react-navigation/native-stack | ^7.0.0 | Stack navigator for drill-downs | Already installed but not wired; needed for Learn/Practice stack screens |
| zustand | ^5.0.0 | State management | Already installed; for any ephemeral practice session state |

### Supporting (no new packages)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ArabicText component | n/a | Arabic text rendering | Every Arabic display on cards -- reads global font size, supports size override |
| colors/typography constants | n/a | Theming | All UI elements -- never hardcode hex values |
| settingsStore | n/a | User preferences | Reading showTransliteration and arabicFontSize |
| mmkvStorage | n/a | Zustand persistence | If any new stores need persistence (practice session state likely does not) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom SM-2 impl | `supermemo` npm package | Package works but is trivial code (~30 lines); custom allows exact D-18 grade mapping without adapter layer |
| Gesture.Pan for card swipe | `react-native-swipeable-card-stack` | Third-party adds Tinder-style animations we don't want; simple horizontal swipe is cleaner with raw Gesture.Pan |
| Manual card index state | FlatList with paging | FlatList paging works but lacks swipe gesture feel and animation control |

**Installation:**
```bash
# No new packages needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  screens/
    learn/
      LevelListScreen.tsx       # Level list for Learn tab
      WordCardScreen.tsx         # Full-screen swipeable word cards
    practice/
      PracticeHomeScreen.tsx     # Due count, start button, stats
      PracticeSessionScreen.tsx  # Active flashcard practice
  components/
    WordCard.tsx                 # Single word card layout (reused in learn + flashcard back)
    GradeButtons.tsx             # Again/Hard/Good/Easy button row
  services/
    sm2.ts                      # Pure SM-2 algorithm (no React, no DB)
    practiceService.ts           # DB queries for due cards, grading, stats
    wordService.ts               # DB queries for words by level, with verses
  navigation/
    LearnStackNavigator.tsx      # Stack: LevelList -> WordCard
    PracticeStackNavigator.tsx   # Stack: PracticeHome -> PracticeSession
    RootStackNavigator.tsx       # Root stack wrapping BottomTabNavigator
    BottomTabNavigator.tsx       # (modified) -- tabs for tab-visible screens
```

### Pattern 1: Navigation Structure (Stack-over-Tabs for Tab Bar Hiding)
**What:** React Navigation recommends nesting the tab navigator INSIDE a root stack navigator, not the other way around. Screens that should hide the tab bar live as siblings of the tab navigator in the root stack.
**When to use:** When D-25 requires tab bar visible on list screens but hidden on card/practice screens.
**Example:**
```typescript
// Source: https://reactnavigation.org/docs/hiding-tabbar-in-screens/
// RootStackNavigator.tsx
const RootStack = createNativeStackNavigator();

export function RootStackNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={BottomTabNavigator} />
      <RootStack.Screen name="WordCard" component={WordCardScreen} />
      <RootStack.Screen name="PracticeSession" component={PracticeSessionScreen} />
    </RootStack.Navigator>
  );
}
```

### Pattern 2: Horizontal Swipe with Gesture.Pan + Reanimated
**What:** Use Gesture.Pan to detect horizontal swipes, track translateX in a shared value, and snap to next/previous card index on gesture end.
**When to use:** Word card navigation (D-04).
**Example:**
```typescript
// Source: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/handling-gestures/
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const SWIPE_THRESHOLD = 50;
const translateX = useSharedValue(0);

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd((e) => {
    if (e.translationX < -SWIPE_THRESHOLD) {
      runOnJS(goToNext)();
    } else if (e.translationX > SWIPE_THRESHOLD) {
      runOnJS(goToPrevious)();
    }
    translateX.value = withTiming(0);
  });

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));
```

### Pattern 3: SM-2 as Pure Function
**What:** SM-2 algorithm as a pure function with no side effects -- takes current state + grade, returns new state. Separate from DB persistence.
**When to use:** All spaced repetition scheduling (PRAC-01 through PRAC-05).
**Example:**
```typescript
// sm2.ts -- pure function, fully unit-testable
interface SM2State {
  interval: number;      // days
  repetitions: number;
  easeFactor: number;
  status: 'new' | 'learning' | 'review';
}

type Grade = 'again' | 'hard' | 'good' | 'easy';

interface SM2Result extends SM2State {
  dueDate: string;       // ISO date string
}

function gradeSM2(state: SM2State, grade: Grade, today: string): SM2Result {
  // Pure computation, no DB calls
}
```

### Pattern 4: Drizzle Upsert for Progress Persistence
**What:** Use `onConflictDoUpdate` on word_progress table to create-or-update in a single query.
**When to use:** After every card grade (PRAC-07).
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/insert
import { db } from '../data/database';
import { wordProgress } from '../data/schema';

await db.insert(wordProgress)
  .values({
    wordId: wordId,
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    dueDate: result.dueDate,
    lastReviewed: today,
    status: result.status,
  })
  .onConflictDoUpdate({
    target: wordProgress.wordId,
    set: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      dueDate: result.dueDate,
      lastReviewed: today,
      status: result.status,
    },
  });
```

### Pattern 5: Drizzle Queries for Words with Verses
**What:** Left join words with word_verses to get example verses for each card.
**When to use:** Loading word cards for a level (LEARN-03).
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/select
import { eq, and, lte, asc, count } from 'drizzle-orm';
import { db } from '../data/database';
import { words, wordVerses, wordProgress } from '../data/schema';

// Get all words in a level with their verses
const levelWords = await db.select()
  .from(words)
  .leftJoin(wordVerses, eq(wordVerses.wordId, words.id))
  .where(eq(words.levelId, levelId))
  .orderBy(asc(words.levelOrder));

// Get due cards for practice
const dueCards = await db.select()
  .from(wordProgress)
  .innerJoin(words, eq(words.id, wordProgress.wordId))
  .where(lte(wordProgress.dueDate, todayStr))
  .limit(200)
  .orderBy(asc(wordProgress.dueDate));
```

### Anti-Patterns to Avoid
- **Inline SM-2 logic in components:** Keep algorithm pure and testable; never mix scheduling math with React state/effects.
- **FlatList with pagingEnabled for card swipe:** Lacks gesture control and custom animation; use Gesture.Pan for the smooth, controllable swipe D-04 requires.
- **Global RTL for Arabic cards:** The app is English LTR; only Arabic text elements get `writingDirection: 'rtl'` via ArabicText component.
- **Storing practice session state in SQLite:** Ephemeral session state (current card index, revealed state) belongs in React state/refs, not the database.
- **Animating with setState:** Use Reanimated shared values for all card transitions; React state updates cause frame drops.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal swipe detection | Custom PanResponder logic | `Gesture.Pan()` from gesture-handler | PanResponder is legacy API; Gesture Handler runs on native thread, handles edge cases (scroll conflicts, multi-touch) |
| Card slide animation | Animated API from React Native | `useSharedValue` + `withTiming` from Reanimated | RN Animated runs on JS thread; Reanimated runs on UI thread for 60fps |
| Haptic feedback | Native module bridge | `expo-haptics` impactAsync | Cross-platform, already installed |
| Date arithmetic | Manual date string math | `Date` object math + `toISOString().slice(0,10)` | Avoid timezone bugs -- always work with date-only strings (YYYY-MM-DD) |
| SQLite queries | Raw SQL strings | Drizzle ORM query builder | Type safety, no SQL injection risk, composable |

**Key insight:** The SM-2 algorithm itself IS something to hand-roll (~40 lines of math), because importing a library for it adds a dependency for trivial code and prevents customizing the grade mapping to match D-18 exactly. Everything else (gestures, animations, DB) should use the installed libraries.

## Common Pitfalls

### Pitfall 1: GestureHandlerRootView Missing
**What goes wrong:** All gesture-based interactions silently fail -- swipes don't register, taps don't work on GestureDetector-wrapped elements.
**Why it happens:** `GestureHandlerRootView` must wrap the entire app (typically in App.tsx). The current codebase does NOT have this.
**How to avoid:** Add `GestureHandlerRootView` as the outermost wrapper in App.tsx before any gesture work begins.
**Warning signs:** Swipe gestures have no effect; Gesture.Pan onUpdate never fires.

### Pitfall 2: SM-2 Ease Factor Drift Below Floor
**What goes wrong:** Ease factor drops below 1.3, causing impossibly short intervals and card clumping.
**Why it happens:** Multiple "Again" grades subtract 0.20 each from EF without floor check.
**How to avoid:** Apply `Math.max(1.3, newEaseFactor)` after every EF calculation, not just on "Again" grade.
**Warning signs:** Cards appearing for review multiple times per day; intervals of 0 days.

### Pitfall 3: Date String Timezone Bugs
**What goes wrong:** Cards due "today" don't appear, or cards appear a day early/late.
**Why it happens:** Using `new Date().toISOString()` gives UTC date which may differ from local date by a day.
**How to avoid:** Always compute today's date in local timezone: `new Date().toLocaleDateString('en-CA')` gives YYYY-MM-DD format in local time. Or use explicit: `const d = new Date(); const today = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');`
**Warning signs:** "No cards due" when there should be cards; cards due at midnight UTC offset.

### Pitfall 4: Tab Bar Flickering During Navigation
**What goes wrong:** Tab bar briefly appears then disappears when navigating to card/practice screens.
**Why it happens:** Setting `tabBarStyle: { display: 'none' }` based on route causes a re-render flash.
**How to avoid:** Use the React Navigation recommended pattern: root stack wrapping tabs, with card/practice screens as stack siblings (not nested inside tabs). The tab bar is never shown/hidden -- it simply doesn't exist on those screens.
**Warning signs:** Tab bar flickering; layout jumps when entering/leaving full-screen card views.

### Pitfall 5: runOnJS Required for State Updates from Gestures
**What goes wrong:** Crashes with "Tried to synchronously call a non-worklet function" error.
**Why it happens:** Gesture callbacks run on the UI thread (worklets). React state setters run on JS thread.
**How to avoid:** Wrap all React state updates called from gesture callbacks in `runOnJS()`.
**Warning signs:** App crashes on first swipe/tap gesture.

### Pitfall 6: Word-Verse Join Returns Flat Rows
**What goes wrong:** A word with 3 verses produces 3 rows, not 1 word with 3 verses attached.
**Why it happens:** SQL LEFT JOIN flattens the result. Drizzle returns flat rows, not nested objects.
**How to avoid:** Post-process the join result: group rows by wordId, collect verses into an array per word. Or query words first, then batch-load verses with `WHERE word_id IN (...)`.
**Warning signs:** Word card showing only 1 verse; duplicate cards for words with multiple verses.

### Pitfall 7: Interval Fuzzing on Short Intervals
**What goes wrong:** Fuzzing +/-10% on interval = 1 day produces 0.9 days, which rounds to 0 and creates infinite review loops.
**Why it happens:** Fuzzing applied uniformly to all intervals.
**How to avoid:** Only apply fuzzing when interval > 1 day (per D-16). Always round to nearest integer after fuzzing, with Math.max(1, ...).
**Warning signs:** Cards stuck in endless "due today" loop.

## Code Examples

### SM-2 Algorithm Implementation
```typescript
// src/services/sm2.ts
// Custom implementation per D-15, D-16, D-18

export interface SM2State {
  easeFactor: number;
  interval: number;       // in days
  repetitions: number;
  status: 'new' | 'learning' | 'review';
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SM2Result extends SM2State {
  dueDate: string;  // YYYY-MM-DD
}

const DEFAULT_STATE: SM2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  status: 'new',
};

function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function applyFuzz(interval: number): number {
  if (interval <= 1) return interval;
  const fuzz = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
  return Math.max(1, Math.round(interval * fuzz));
}

function computeStatus(interval: number): 'new' | 'learning' | 'review' {
  if (interval === 0) return 'new';
  if (interval < 21) return 'learning';
  return 'review';
}

export function gradeSM2(
  state: SM2State = DEFAULT_STATE,
  grade: Grade,
  today: string = getLocalToday(),
): SM2Result {
  let { easeFactor, interval, repetitions } = state;

  switch (grade) {
    case 'again':
      // D-18: reset to interval 1, ease -0.20
      easeFactor = Math.max(1.3, easeFactor - 0.20);
      interval = 1;
      repetitions = 0;
      break;
    case 'hard':
      // D-18: interval x 1.2, ease -0.15
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      interval = Math.max(1, Math.round(interval * 1.2));
      repetitions += 1;
      break;
    case 'good':
      // D-18: interval x ease factor
      if (repetitions === 0) {
        interval = 1;  // D-15: initial interval
      } else if (repetitions === 1) {
        interval = 6;  // D-15: second interval
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      break;
    case 'easy':
      // D-18: interval x ease factor x 1.3, ease +0.15
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      easeFactor += 0.15;
      repetitions += 1;
      break;
  }

  interval = applyFuzz(interval);
  const status = computeStatus(interval);
  const dueDate = addDays(today, interval);

  return { easeFactor, interval, repetitions, status, dueDate };
}

/** Preview what intervals each grade would produce (for button labels) */
export function previewGrades(
  state: SM2State = DEFAULT_STATE,
  today: string = getLocalToday(),
): Record<Grade, string> {
  const grades: Grade[] = ['again', 'hard', 'good', 'easy'];
  const result = {} as Record<Grade, string>;
  for (const g of grades) {
    const r = gradeSM2(state, g, today);
    result[g] = formatInterval(r.interval);
  }
  return result;
}

function formatInterval(days: number): string {
  if (days === 0) return '<1m';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
```

### GestureHandlerRootView Wrapper (App.tsx fix)
```typescript
// App.tsx -- MUST add GestureHandlerRootView
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={KalimaTheme}>
        <RootStackNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

### Word Service Query (Words with Verses)
```typescript
// src/services/wordService.ts
import { eq, asc } from 'drizzle-orm';
import { db } from '../data/database';
import { words, wordVerses, levels } from '../data/schema';

export interface WordWithVerses {
  id: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  partOfSpeech: string | null;
  occurrenceCount: number;
  verses: {
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    translation: string;
    wordPosition: number | null;
  }[];
}

export async function getWordsForLevel(levelId: number): Promise<WordWithVerses[]> {
  const rows = await db.select()
    .from(words)
    .leftJoin(wordVerses, eq(wordVerses.wordId, words.id))
    .where(eq(words.levelId, levelId))
    .orderBy(asc(words.levelOrder));

  // Group by word, collecting verses
  const wordMap = new Map<number, WordWithVerses>();
  for (const row of rows) {
    const w = row.words;
    if (!wordMap.has(w.id)) {
      wordMap.set(w.id, {
        id: w.id,
        arabic: w.arabic,
        transliteration: w.transliteration,
        meaning: w.meaning,
        root: w.root,
        partOfSpeech: w.partOfSpeech,
        occurrenceCount: w.occurrenceCount,
        verses: [],
      });
    }
    if (row.word_verses) {
      wordMap.get(w.id)!.verses.push({
        surahNumber: row.word_verses.surahNumber,
        ayahNumber: row.word_verses.ayahNumber,
        arabicText: row.word_verses.arabicText,
        translation: row.word_verses.translation,
        wordPosition: row.word_verses.wordPosition,
      });
    }
  }
  return Array.from(wordMap.values());
}

export async function getLevels() {
  return db.select().from(levels).orderBy(asc(levels.id));
}
```

### Due Cards Query (Practice Service)
```typescript
// src/services/practiceService.ts
import { eq, lte, asc, count, sql } from 'drizzle-orm';
import { db } from '../data/database';
import { wordProgress, words, wordVerses } from '../data/schema';

export async function getDueCards(today: string, limit: number = 200) {
  const rows = await db.select()
    .from(wordProgress)
    .innerJoin(words, eq(words.id, wordProgress.wordId))
    .where(lte(wordProgress.dueDate, today))
    .orderBy(asc(wordProgress.dueDate))
    .limit(limit);

  return rows;
}

export async function getPracticeStats(today: string) {
  const stats = await db.select({
    status: wordProgress.status,
    count: count(),
  })
    .from(wordProgress)
    .groupBy(wordProgress.status);

  const dueCount = await db.select({ count: count() })
    .from(wordProgress)
    .where(lte(wordProgress.dueDate, today));

  return { stats, dueCount: dueCount[0]?.count ?? 0 };
}

export async function getNextReviewDate() {
  const result = await db.select({ dueDate: wordProgress.dueDate })
    .from(wordProgress)
    .orderBy(asc(wordProgress.dueDate))
    .limit(1);

  return result[0]?.dueDate ?? null;
}
```

### Verse Highlight Logic
```typescript
// Highlighting the target word in an Arabic verse
// wordPosition is the token index (0-based) within the ayah
function highlightWordInVerse(
  verseText: string,
  wordPosition: number | null,
): { before: string; target: string; after: string } | null {
  if (wordPosition === null) return null;

  // Split on whitespace (Arabic uses standard spaces between words)
  const tokens = verseText.split(/\s+/);
  if (wordPosition < 0 || wordPosition >= tokens.length) return null;

  const before = tokens.slice(0, wordPosition).join(' ');
  const target = tokens[wordPosition];
  const after = tokens.slice(wordPosition + 1).join(' ');

  return { before, target, after };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PanResponder for gestures | Gesture Handler v2 Gesture API | 2022+ | Native thread gesture processing; composable gestures |
| Animated from React Native | Reanimated v4 with worklets | 2024 | UI thread animations; mandatory for New Architecture |
| useAnimatedGestureHandler | Gesture.Pan().onUpdate() | Reanimated v3+ | Old API deprecated; new API is more composable |
| AsyncStorage for progress | expo-sqlite with Drizzle | Current | Structured queries, joins, type safety |
| SM-2 with quality 0-5 | SM-2 with 4-button grading | Anki popularized | Again/Hard/Good/Easy is more intuitive than 0-5 scale |

**Deprecated/outdated:**
- `useAnimatedGestureHandler` -- deprecated in Reanimated v3+; use `Gesture.Pan()` callbacks instead
- `PanResponder` -- legacy JS thread API; gesture-handler is the standard
- `Animated.timing` -- React Native's built-in; use Reanimated's `withTiming` for UI thread performance

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ~29.x via jest-expo ~54.0.0 |
| Config file | `jest.config.js` (exists, uses `jest-expo` preset) |
| Quick run command | `npx jest --testPathPattern=sm2 --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRAC-01 | SM-2 scheduling produces correct intervals | unit | `npx jest src/services/__tests__/sm2.test.ts -x` | Wave 0 |
| PRAC-04 | SM-2 updates interval, EF, due date correctly | unit | `npx jest src/services/__tests__/sm2.test.ts -x` | Wave 0 |
| PRAC-05 | Fuzzing applied, EF floor enforced, cap respected | unit | `npx jest src/services/__tests__/sm2.test.ts -x` | Wave 0 |
| PRAC-03 | Grade preview shows correct intervals | unit | `npx jest src/services/__tests__/sm2.test.ts -x` | Wave 0 |
| LEARN-03 | Verse highlight splits correctly at word position | unit | `npx jest src/services/__tests__/wordService.test.ts -x` | Wave 0 |
| PRAC-07 | Progress persists via upsert | unit | `npx jest src/services/__tests__/practiceService.test.ts -x` | Wave 0 |
| LEARN-01 | Word cards render with correct data | component | Manual -- requires Expo dev client | N/A |
| LEARN-04 | Swipe navigates between cards | component | Manual -- gesture testing in Jest is limited | N/A |
| PRAC-02 | Tap reveals flashcard back | component | Manual -- tap gesture | N/A |
| PRAC-06 | Due/new counts display correctly | component | Manual -- query + render | N/A |
| D-17 | 200 card daily cap respected | unit | `npx jest src/services/__tests__/practiceService.test.ts -x` | Wave 0 |
| D-20 | Status transitions new->learning->review | unit | `npx jest src/services/__tests__/sm2.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/__tests__/sm2.test.ts` -- covers PRAC-01, PRAC-03, PRAC-04, PRAC-05, D-17, D-20
- [ ] `src/services/__tests__/wordService.test.ts` -- covers LEARN-03 (verse highlight logic)
- [ ] `src/services/__tests__/practiceService.test.ts` -- covers PRAC-07 (requires DB mocking strategy)

## Open Questions

1. **Word position data quality**
   - What we know: `wordPosition` field exists in `word_verses` table and was populated by the build script
   - What's unclear: Whether `wordPosition` is reliably set for all verses, or if many are NULL
   - Recommendation: Add a fallback in verse display -- if wordPosition is null, show the verse without highlighting (don't crash or show blank)

2. **"New" cards entering practice**
   - What we know: D-19 says no cap on new cards; D-20 defines status as 'new' when never reviewed
   - What's unclear: How do new words enter the practice queue? Do they need to be browsed in Learn mode first, or are all words immediately available for practice?
   - Recommendation: All words are available for practice from the start. When a user opens Practice, query both `word_progress` rows with due dates <= today AND `words` rows with no `word_progress` entry (never-reviewed). This matches D-19 (no cap) and D-07 (no "mark as learned" required).

3. **Drizzle useLiveQuery vs manual queries**
   - What we know: `enableChangeListener: true` is already set on the database; Drizzle supports `useLiveQuery`
   - What's unclear: Whether useLiveQuery is needed for this phase or if one-time queries are sufficient
   - Recommendation: Use one-time queries for word cards (data doesn't change during browsing). Use one-time query for practice session load. Don't use useLiveQuery here -- it adds complexity for no benefit since the user is the only one writing data.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/data/schema.ts`, `src/data/database.ts`, `src/components/ArabicText.tsx`, `src/stores/settingsStore.ts`, `package.json` -- all read directly
- [Drizzle ORM - Select](https://orm.drizzle.team/docs/select) -- query patterns, join syntax, operators
- [Drizzle ORM - Insert](https://orm.drizzle.team/docs/insert) -- upsert with onConflictDoUpdate
- [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) -- useLiveQuery, enableChangeListener
- [React Navigation - Hiding Tab Bar](https://reactnavigation.org/docs/hiding-tabbar-in-screens/) -- stack-over-tabs pattern
- [Reanimated - Handling Gestures](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/handling-gestures/) -- Gesture.Pan + useAnimatedStyle

### Secondary (MEDIUM confidence)
- [SM-2 Algorithm - cnnrhill/sm-2](https://github.com/cnnrhill/sm-2) -- reference implementation with formulas
- [SuperMemo 2 - VienDinhCom/supermemo](https://github.com/VienDinhCom/supermemo) -- TypeScript implementation reference

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed and verified in package.json; no new dependencies needed
- Architecture: HIGH -- navigation pattern from official React Navigation docs; gesture pattern from official Reanimated docs; SM-2 is well-documented algorithm
- Pitfalls: HIGH -- GestureHandlerRootView gap verified by codebase grep; date timezone issues are well-known; join flattening is a Drizzle/SQL fundamental

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- all libraries already installed, no version changes expected)
