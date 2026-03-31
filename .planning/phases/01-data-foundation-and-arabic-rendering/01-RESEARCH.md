# Phase 1: Data Foundation and Arabic Rendering - Research

**Researched:** 2026-03-28
**Domain:** Expo SDK 55 / expo-sqlite / Drizzle ORM / Quranic data pipeline / Arabic font rendering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Arabic Font**
- D-01: Use KFGQPC Uthmanic Script HAFS — the official King Fahd Complex font, used in most Quran apps worldwide. Authentic Mushaf style, excellent diacritics. Source from the official KFGQPC distribution.
- D-02: Bundle the font via `expo-font` config plugin (build-time embedding, no async loading flash).
- D-03: All Arabic text uses `fontFamily: 'KFGQPC-Uthmanic-Script-HAFS'` — no system Arabic font fallback.

**Data Gap Handling**
- D-04: When root letters or part-of-speech are missing from source data (corpus.quran.com gaps), hide the field silently — do not render the root/POS row on the word card at all.
- D-05: The build pipeline must log all gap words to a `gaps-report.json` file for future manual curation (v2), but missing fields do NOT block the build.

**Level Naming Strategy**
- D-06: Levels have meaningful curated names hardcoded in the data pipeline (e.g., "The Essentials", "Words of Worship", "The Divine"). Names are stored in a `scripts/level-config.json` file alongside the build script.
- D-07: Level numbering is 1-based (Level 1, Level 2...) with the name as a subtitle. Both number and name are stored in the SQLite `levels` table.

**Project Structure**
- D-08: The data pipeline lives in `scripts/build-db.js` in this repo. Run with `node scripts/build-db.js` before building the app. No separate package.json — uses project-level dependencies.
- D-09: Raw source data (Tanzil XML/CSV, corpus.quran.com files) lives in `scripts/data/raw/` and is committed to the repo. The generated `kalima.db` goes to `assets/db/kalima.db`.

**RTL Rendering**
- D-10: Arabic text uses per-component RTL only — `writingDirection: 'rtl'` and `textAlign: 'right'` on the `<ArabicText>` component. Do NOT call `I18nManager.forceRTL()`.
- D-11: `<ArabicText>` is a shared component in `src/components/ArabicText.tsx` that all screens use — never render Arabic text with raw `<Text>` elements.

**Expo Scaffolding**
- D-12: Use Expo SDK 55 (managed workflow). Initialize with `npx create-expo-app@latest` using the TypeScript template.
- D-13: Use React Navigation (not Expo Router) — bottom tabs + native stack, consistent with the planned navigation structure.

### Claude's Discretion

- Exact Drizzle ORM schema design (table names, column types, indexes)
- SM-2 data table structure (this is Phase 3, but schema should be anticipated)
- Tanzil.net XML parsing implementation details
- Build script error handling and retry logic
- Expo dev client configuration

### Deferred Ideas (OUT OF SCOPE)

- Audio pronunciation for words — v2 requirement (AUDI-01), not in Phase 1 or v1
- Surah-aware progress tracking — v2 requirement (ADV-02)
- Root word exploration mode — v2 requirement (ADV-01)
- Manual curation of data gaps — captured in `gaps-report.json` for future work, not blocking v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | App ships with a pre-bundled SQLite database containing all frequency-ranked Quran vocabulary words (sourced from Tanzil.net with checksum verification) | expo-sqlite assetSource pattern + better-sqlite3 build pipeline confirmed HIGH confidence |
| DATA-02 | Each word entry includes: Arabic text, transliteration, English meaning(s), root letters, part of speech, frequency rank, and occurrence count | corpus.quran.com morphological data + Tanzil frequency lists; root/POS may be null per D-04 |
| DATA-03 | Each word entry includes 1-3 linked example Quran verses (surah number, ayah number, full Arabic text, English translation) with the word's position marked | word_verses join table pattern; word position stored as integer index within ayah |
| DATA-04 | Words are organized into ~30 levels ordered by frequency (most common first), with each level containing 25-50 words and a cumulative Quran coverage percentage | level-config.json drives assignment; cumulative coverage computed at build time from occurrence counts |
| DATA-05 | Database includes a build-time pipeline (Node.js script) that processes raw Tanzil + corpus.quran.com data and validates checksums before bundling | scripts/build-db.js using better-sqlite3 + fast-xml-parser; checksum validation against Tanzil published values |
| ARAB-01 | All Arabic text renders correctly with full diacritics (tashkeel/harakat) using a validated Unicode Quranic font | KFGQPC Uthmanic Script HAFS (D-01); bundled via expo-font config plugin (D-02) |
| ARAB-02 | Arabic text uses per-component RTL rendering (`writingDirection: 'rtl'`) — not global RTL mode | ArabicText component (D-10, D-11); I18nManager.forceRTL() must NOT be called |
| ARAB-03 | App UI navigation and labels remain left-to-right (English) | Achieved by not calling forceRTL; LTR is the default React Native layout direction |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire data and rendering foundation that every subsequent phase depends on. It has three distinct work streams: (1) Expo project scaffolding with all v1 dependencies installed, (2) the build-time data pipeline that converts raw Tanzil + corpus.quran.com source data into a pre-populated SQLite database, and (3) the `<ArabicText>` shared component that correctly renders Quranic Arabic with full diacritics using the KFGQPC Uthmanic font.

The data pipeline is the highest-risk element. The Quran corpus involves multiple data sources with known gaps (corpus.quran.com root mappings for non-noun forms), encoding concerns (Unicode vs. older Windows-1256 encoded datasets), and accuracy requirements that are unusually strict — errors in Quran text are not just bugs, they are trust-destroying events. The pipeline must validate Tanzil checksums on every build and log all data gaps to `gaps-report.json` without blocking the build (D-05).

The font decision (KFGQPC Uthmanic Script HAFS via D-01) is already locked and correct. The critical pitfall to avoid is the QCF glyph-font trap: QCF fonts encode each word as a single glyph across 604 font files — completely inappropriate for a vocabulary app that must display individual words. KFGQPC is a Unicode font with standard Arabic shaping, the right choice for this use case.

**Primary recommendation:** Build in this order: (1) initialize Expo project, (2) write Drizzle schema, (3) build the data pipeline and validate output, (4) configure metro + expo-sqlite asset bundling, (5) implement `<ArabicText>` and validate font rendering on both platforms. Do not start Phase 2 UI work until Steps 3-4 produce a verified `kalima.db`.

---

## Standard Stack

### Core (Phase 1 scope)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Expo | SDK 55 (~55.0.x) | App framework | Latest stable; React Native 0.83, React 19.2; New Architecture mandatory; confirmed via npm |
| expo-sqlite | ~15.x (55.0.12 canary) | SQLite runtime in app | First-party; `assetSource` prop handles bundled DB copy-on-first-launch; synchronous API via `openDatabaseSync()` |
| drizzle-orm | 0.45.2 | Type-safe query builder | Official expo-sqlite integration; ~7.4kb, zero deps; `useLiveQuery` for reactivity |
| drizzle-kit | 0.31.10 | Migration generation | Generates SQL from schema changes; version confirmed via npm |
| expo-font | ~13.x (55.0.5 canary) | Font bundling | Config plugin embeds at build time; no async flash |
| expo-asset | ~11.x (55.0.11 canary) | Asset bundling | Required for `.db` file inclusion via metro |
| expo-dev-client | ~5.x | Development builds | Required because Drizzle + MMKV need native modules absent from Expo Go |
| better-sqlite3 | 12.8.0 | Build-time DB creation | Node.js synchronous SQLite; used only in `scripts/build-db.js`, not in the app |
| fast-xml-parser | 5.5.9 | Tanzil XML parsing | Zero-dependency, fast; used only in build script |

### Supporting (installed in Phase 1, used in later phases)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-navigation/native | 7.2.2 | Navigation core | Navigation shell created in Phase 1 (D-13) |
| @react-navigation/bottom-tabs | ~7.x | Tab bar | Phase 1 scaffolding; 4-tab layout |
| @react-navigation/native-stack | ~7.x | Stack screens | Drill-down within tabs |
| react-native-screens | SDK 55 compatible | Screen optimization | Required by React Navigation |
| react-native-safe-area-context | SDK 55 compatible | Safe area insets | Required by React Navigation |
| zustand | 5.0.12 | App state | Install now, implement stores in Phase 2 |
| react-native-mmkv | 4.3.0 | Key-value storage | Settings/preferences; install now, use in Phase 2 |
| react-native-reanimated | ~4.x | Animations | Install now (SDK 55 requirement), use in Phase 3+ |
| react-native-gesture-handler | ~2.x | Touch gestures | Swipe navigation; install with Reanimated |
| nativewind | 4.2.3 | Utility styling | Note: latest is 4.2.3, NOT v5 as some research suggests — verify against Expo SDK 55 compat |

**Note on NativeWind version:** npm shows latest as 4.2.3. Earlier research files reference "v5 / Tailwind v4.1+" but that may be marketing naming. Verify compatibility with Expo SDK 55 / React Native 0.83 before committing to the styling approach. Fallback is `StyleSheet.create()` with a theme object — fully viable for this project.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-sqlite3 (build script) | sql.js | sql.js is browser-oriented; better-sqlite3 is the standard Node.js SQLite choice |
| fast-xml-parser | xml2js | xml2js uses callbacks/promises; fast-xml-parser is synchronous and zero-dep — simpler for a build script |
| KFGQPC Uthmanic Script | Amiri | Amiri is good for Quranic text; KFGQPC is the official Mushaf font used in physical Qurans — higher authenticity |
| KFGQPC Uthmanic Script | Scheherazade New | Both are valid Unicode Quranic fonts; KFGQPC is locked by D-01 |

### Installation

```bash
# Phase 1: Create project
npx create-expo-app@latest kalima --template default

# Core data layer
npx expo install expo-sqlite expo-asset expo-font expo-dev-client
npm install drizzle-orm
npm install -D drizzle-kit

# Build script dependencies (dev only, Node.js not bundled in app)
npm install -D better-sqlite3 fast-xml-parser

# Navigation (scaffolding in Phase 1)
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# State + storage (install now, implement Phase 2+)
npm install zustand
npx expo install react-native-mmkv

# Animations + gestures (install now, use Phase 3+)
npx expo install react-native-reanimated react-native-gesture-handler expo-haptics

# Styling
npm install nativewind
npm install -D tailwindcss

# Testing
npm install -D @testing-library/react-native
```

**Version verification (confirmed 2026-03-28 against npm registry):**
- better-sqlite3: 12.8.0
- drizzle-orm: 0.45.2
- drizzle-kit: 0.31.10
- fast-xml-parser: 5.5.9
- zustand: 5.0.12
- react-native-mmkv: 4.3.0
- @react-navigation/native: 7.2.2
- nativewind: 4.2.3 (not v5 — verify Tailwind version requirement)

---

## Architecture Patterns

### Recommended Project Structure

```
kalima/
├── scripts/
│   ├── build-db.js              # Node.js data pipeline (runs before app build)
│   ├── level-config.json        # Curated level names (D-06)
│   └── data/
│       └── raw/                 # Committed raw source files (D-09)
│           ├── tanzil-quran-uthmani.xml
│           ├── corpus-wordbyword.csv
│           └── translations/
│               ├── sahih-international.txt
│               └── pickthall.txt
├── assets/
│   ├── db/
│   │   └── kalima.db            # Generated by build-db.js (D-09)
│   └── fonts/
│       └── KFGQPC-Uthmanic-Script-HAFS.otf
├── src/
│   ├── components/
│   │   └── ArabicText.tsx       # Shared Arabic rendering component (D-11)
│   ├── data/
│   │   ├── schema.ts            # Drizzle schema definitions
│   │   ├── database.ts          # Drizzle instance export
│   │   ├── DatabaseProvider.tsx # SQLiteProvider + migration wrapper
│   │   └── drizzle/
│   │       ├── migrations.ts    # Auto-generated migration index
│   │       └── 0000_initial.sql # Generated migration SQL
│   ├── navigation/
│   │   └── TabNavigator.tsx     # Placeholder bottom tabs
│   └── theme/
│       ├── colors.ts            # Dark theme + green accents (#4ade80)
│       └── typography.ts        # Font families, Arabic sizes, lineHeights
├── metro.config.js              # Adds 'db' to assetExts
└── babel.config.js              # babel-preset-expo + inline-import for .sql
```

### Pattern 1: Build-Time Data Pipeline

**What:** A Node.js script (`scripts/build-db.js`) that runs before app builds. Reads raw Tanzil XML and corpus.quran.com CSV data, computes frequency rankings, assigns words to levels, selects example verses, validates Tanzil checksums, writes to `assets/db/kalima.db`.

**When to use:** Once before the first app build, and again whenever source data changes or level configuration is updated.

**Build script structure:**
```javascript
// scripts/build-db.js
const Database = require('better-sqlite3');
const { XMLParser } = require('fast-xml-parser');
const path = require('path');
const fs = require('fs');

const RAW_DIR = path.join(__dirname, 'data/raw');
const OUT_DB = path.join(__dirname, '..', 'assets/db/kalima.db');
const LEVEL_CONFIG = require('./level-config.json');

async function main() {
  // 1. Parse Tanzil XML (UTF-8, full tashkeel)
  // 2. Load corpus.quran.com word-by-word CSV (root, POS, lemma)
  // 3. Load translations (Sahih International + Pickthall)
  // 4. Compute lemma frequency ranking (occurrence counts across all 77,430 tokens)
  // 5. Assign words to levels per level-config.json
  // 6. Compute cumulative coverage percentages per level
  // 7. Select 1-3 example verses per word (first occurrences)
  // 8. Validate Tanzil checksums (per-surah)
  // 9. Log gaps to gaps-report.json (missing root/POS)
  // 10. Write kalima.db with all tables + indexes
}
```

**Critical step — Tanzil checksum validation:**
```javascript
// Tanzil publishes per-surah letter counts at tanzil.net/docs/quran_data
// Compare against computed counts from parsed XML
function validateTanzilChecksums(surahData, publishedChecksums) {
  const errors = [];
  surahData.forEach((surah, i) => {
    const computed = countLetters(surah.text);
    if (computed !== publishedChecksums[i]) {
      errors.push(`Surah ${i+1}: expected ${publishedChecksums[i]} letters, got ${computed}`);
    }
  });
  if (errors.length > 0) throw new Error('Tanzil checksum validation failed:\n' + errors.join('\n'));
}
```

### Pattern 2: Metro + Asset Configuration

**What:** Configure Metro bundler to include `.db` files as assets, and configure the expo-asset plugin to bundle `kalima.db` at build time.

**metro.config.js:**
```javascript
// Source: Expo SQLite docs - https://docs.expo.dev/versions/latest/sdk/sqlite/
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('db');
module.exports = config;
```

**app.json plugins section:**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": ["./assets/fonts/KFGQPC-Uthmanic-Script-HAFS.otf"]
        }
      ],
      [
        "expo-asset",
        {
          "assets": ["./assets/db/kalima.db"]
        }
      ],
      "expo-sqlite"
    ]
  }
}
```

**babel.config.js (for inline SQL migrations):**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
```

### Pattern 3: DatabaseProvider with Migration Gate

**What:** A React provider that initializes expo-sqlite with the bundled asset and runs Drizzle migrations before rendering children. The migration gate prevents any child component from querying before the schema is ready.

```typescript
// src/data/DatabaseProvider.tsx
// Source: Drizzle ORM Expo SQLite docs - https://orm.drizzle.team/docs/connect-expo-sqlite
import { SQLiteProvider } from 'expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';
import { db } from './database';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider
      databaseName="kalima.db"
      assetSource={{ assetId: require('../../assets/db/kalima.db') }}
      options={{ enableChangeListener: true }}
    >
      <MigrationGate>{children}</MigrationGate>
    </SQLiteProvider>
  );
}

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  if (error) return <ErrorScreen message={error.message} />;
  if (!success) return <SplashScreen />;
  return <>{children}</>;
}
```

**Note:** `enableChangeListener: true` is required for Drizzle's `useLiveQuery` to work.

### Pattern 4: ArabicText Component

**What:** A shared, styled component that encapsulates all Arabic rendering concerns. Every Arabic string in the app passes through this component — never use raw `<Text>` for Arabic content (D-11).

```typescript
// src/components/ArabicText.tsx
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface ArabicTextProps {
  children: string;
  style?: TextStyle;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

// Font size map — Arabic needs ~1.5x Latin equivalent for readability
const FONT_SIZES = {
  small: 24,
  medium: 32,
  large: 42,
};

export function ArabicText({ children, style, size = 'medium', color }: ArabicTextProps) {
  return (
    <Text
      style={[
        styles.arabic,
        { fontSize: FONT_SIZES[size] },
        color ? { color } : null,
        style,
      ]}
      allowFontScaling={false}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  arabic: {
    fontFamily: 'KFGQPC-Uthmanic-Script-HAFS', // D-03
    writingDirection: 'rtl',                    // D-10, ARAB-02
    textAlign: 'right',
    lineHeight: 56,   // Must be generous — diacritics above + below need space
    color: '#FFFFFF', // Default; override via color prop (D-specifics: color prop for flexibility)
  },
});
```

**Critical lineHeight note:** Tashkeel (diacritics) appear both above and below base letters. At fontSize 32, a lineHeight of at least 48-56 is required to prevent diacritics from clipping into adjacent lines. Test this on device — simulator rendering can hide clipping issues.

### Pattern 5: Drizzle Schema Definition

**What:** The complete schema for Phase 1. Static tables are pre-populated by the build pipeline; user tables start empty. The schema anticipates SM-2 state (Phase 3) so migrations don't break existing data later.

```typescript
// src/data/schema.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// --- Static tables (pre-populated by build-db.js) ---

export const levels = sqliteTable('levels', {
  id: integer('id').primaryKey(),           // 1-based (D-07)
  name: text('name').notNull(),             // e.g., "The Essentials" (D-06)
  wordCount: integer('word_count').notNull(),
  cumulativeCoverage: real('cumulative_coverage').notNull(), // 0.0-1.0 fraction
});

export const words = sqliteTable('words', {
  id: integer('id').primaryKey(),
  arabic: text('arabic').notNull(),          // Full tashkeel from Tanzil
  transliteration: text('transliteration').notNull(),
  meaning: text('meaning').notNull(),        // Primary English meaning
  root: text('root'),                        // nullable — D-04 gap handling
  partOfSpeech: text('part_of_speech'),      // nullable — D-04 gap handling
  frequencyRank: integer('frequency_rank').notNull(),
  occurrenceCount: integer('occurrence_count').notNull(),
  levelId: integer('level_id').notNull().references(() => levels.id),
  levelOrder: integer('level_order').notNull(), // position within level
}, (table) => ({
  levelIdx: index('idx_words_level').on(table.levelId),
  frequencyIdx: index('idx_words_frequency').on(table.frequencyRank),
}));

export const wordVerses = sqliteTable('word_verses', {
  id: integer('id').primaryKey(),
  wordId: integer('word_id').notNull().references(() => words.id),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  arabicText: text('arabic_text').notNull(),  // Full ayah text with tashkeel
  translation: text('translation').notNull(), // Sahih International
  wordPosition: integer('word_position'),     // Token index within ayah (nullable if ambiguous)
}, (table) => ({
  wordIdx: index('idx_word_verses_word').on(table.wordId),
}));

// --- User tables (empty at install, written at runtime) ---

export const wordProgress = sqliteTable('word_progress', {
  wordId: integer('word_id').primaryKey().references(() => words.id),
  // SM-2 fields (Phase 3 anticipation per Claude's Discretion)
  easeFactor: real('ease_factor').notNull().default(2.5),
  interval: integer('interval').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  dueDate: text('due_date').notNull().default('1970-01-01'), // ISO YYYY-MM-DD
  lastReviewed: text('last_reviewed'),
  status: text('status').notNull().default('new'),
  // 'new' | 'learning' | 'review' | 'mastered'
}, (table) => ({
  dueDateIdx: index('idx_word_progress_due').on(table.dueDate),
  statusIdx: index('idx_word_progress_status').on(table.status),
}));

export const levelProgress = sqliteTable('level_progress', {
  levelId: integer('level_id').primaryKey().references(() => levels.id),
  unlocked: integer('unlocked').notNull().default(0), // 0 = locked, 1 = unlocked
  bestQuizScore: real('best_quiz_score'),
  completedAt: text('completed_at'),
});
```

### Anti-Patterns to Avoid

- **QCF glyph fonts:** Never use QCF/page-based Mushaf fonts. They require 604 font files and encode entire words as single glyphs — built for pixel-perfect Mushaf page reproduction, not vocabulary word display.
- **`I18nManager.forceRTL(true)`:** Flips all navigation, buttons, padding app-wide. The app UI is English. Use per-component RTL only (D-10).
- **Raw `<Text>` for Arabic strings:** Always use `<ArabicText>`. Raw Text won't have `writingDirection`, `textAlign`, `fontFamily`, or `allowFontScaling` set correctly (D-11).
- **`assetSource.forceOverwrite: true` in production:** Destroys user progress data on every app restart. Only safe for read-only content-only databases.
- **Single data source trust:** Never trust corpus.quran.com alone. Validate Arabic text against Tanzil checksums. The corpus has known gaps and root mapping errors.
- **Windows-1256 encoded Tanzil files:** The older Tanzil downloads used Windows-1256 encoding which lacks the small-alef codepoint. Use the UTF-8 Unicode version explicitly.
- **`textAlign: 'justify'` on Arabic:** React Native bug #32146 causes text overflow and clipping with justified Arabic text containing special characters.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB migrations | Manual version checks + ALTER TABLE | Drizzle Kit + `useMigrations` | Race conditions, schema drift, transaction rollback on failure |
| Pre-bundled DB loading on first launch | Manual file copy from bundle to documents directory | `SQLiteProvider assetSource` prop | Android-specific path differences; official API handles cross-platform copy correctly |
| XML parsing for Tanzil data | Custom XML parser | `fast-xml-parser` | Handles edge cases in attribute parsing, encoding, and nested structures |
| Font loading at runtime | `useFonts()` hook + `AppLoading` | `expo-font` config plugin | Config plugin embeds fonts at build time; no async flash, no loading state to manage |
| DB file inclusion in app bundle | Custom metro plugin | `expo-asset` config plugin + `assetExts: ['db']` in metro.config.js | Official pattern; ensures cross-platform asset resolution |
| Frequency calculation | Custom frequency analysis | Process Tanzil token list directly | The corpus already provides frequency data; don't re-derive from scratch |

**Key insight:** The `expo-sqlite` + `assetSource` pattern is the single highest-leverage decision in this phase. It eliminates first-launch latency (no inserting 14K rows on startup), handles the iOS/Android file path asymmetry, and integrates with Drizzle migrations cleanly.

---

## Common Pitfalls

### Pitfall 1: Tanzil Data Encoding

**What goes wrong:** The downloaded Tanzil file uses Windows-1256 encoding (older versions) which lacks the small-alef codepoint, producing subtly incomplete Quranic text that passes visual inspection but fails letter-count checksums.

**Why it happens:** Multiple Tanzil download formats exist. The "Uthmani" format in Unicode (UTF-8) is the correct one. Developers sometimes download the "Simple" or "Simple Enhanced" version which omits diacritics.

**How to avoid:** Download `quran-uthmani.xml` from tanzil.net explicitly. Verify the file is UTF-8 encoded. Run Tanzil's published per-surah letter checksums against the parsed data before accepting the file.

**Warning signs:** Checksum failures on early surahs, especially Al-Baqarah or Al-Imran which have complex ligatures.

### Pitfall 2: QCF Font Trap

**What goes wrong:** Developer researches "Quranic fonts" and finds QCF (Quran Complex Fonts) documented as the "standard." Downloads one of the 604 page-specific font files. Each font encodes entire words as single glyphs — individual vocabulary words display as single unrecognizable characters or boxes.

**Why it happens:** QCF fonts are used by Quran.com and most Mushaf reader apps for pixel-perfect page reproduction. They are well-documented and appear authoritative.

**How to avoid:** Use KFGQPC Uthmanic Script HAFS (locked by D-01) — a Unicode font using standard Arabic shaping. The distinction is: QCF = page-reproduction glyphs, KFGQPC = Unicode standard Arabic letters with full tashkeel.

**Warning signs:** Arabic text displays as boxes or unrecognizable symbols when using the font.

### Pitfall 3: assetSource on Android

**What goes wrong:** The SQLite database loads correctly on iOS simulator but fails silently on Android — the word list is empty or the app crashes with a "database not found" error.

**Why it happens:** On Android, bundled assets live in a different path than the app documents directory. SQLite cannot read directly from the assets bundle on Android. The `assetSource` prop on `SQLiteProvider` exists specifically to handle this — it copies the file to the correct location on first launch.

**How to avoid:** Always use `SQLiteProvider` with `assetSource={{ assetId: require('./assets/db/kalima.db') }}`. Do not implement manual file copying — the official API handles cross-platform differences. Test on Android emulator, not just iOS, before considering this task complete.

**Warning signs:** iOS works, Android shows empty data or crashes at startup.

### Pitfall 4: Missing db in assetExts

**What goes wrong:** The Metro bundler silently excludes the `.db` file from the app bundle. The app launches, `assetSource` finds no asset, and falls back to creating an empty database. All word data is absent.

**Why it happens:** Metro's default `assetExts` does not include `db`. Without explicitly adding it to `metro.config.js`, the asset is not bundled.

**How to avoid:**
```javascript
// metro.config.js — this step is mandatory
config.resolver.assetExts.push('db');
```
Verify the bundled DB exists by checking the Metro bundle output or by querying `SELECT COUNT(*) FROM words` on first launch.

**Warning signs:** App launches but all word lists are empty. No crash, just empty data.

### Pitfall 5: Arabic Line Height Diacritics Clipping

**What goes wrong:** Arabic text renders with diacritics (tashkeel marks) above and below letters, but adjacent text lines overlap. The marks from one line's bottom are cut off by the next line's top. The resulting text is visually garbled.

**Why it happens:** Default React Native `lineHeight` is too tight for Arabic text with full tashkeel. `lineHeight` must be explicitly set to at least 1.6-1.8x the `fontSize`.

**How to avoid:** In `ArabicText` styles, set `lineHeight` generously — at fontSize 32, use lineHeight 56 minimum. Test at all three font sizes (small/medium/large) on a physical device or high-DPI simulator.

**Warning signs:** Diacritics appear but some marks are partially cut off, especially sukun (ْ) above and kasra (ِ) below.

### Pitfall 6: corpus.quran.com Root Gaps Break Build

**What goes wrong:** The build script fails or halts when it encounters words without root mappings, preventing database generation.

**Why it happens:** corpus.quran.com has documented gaps in root information, particularly for non-noun word forms (particles, prepositions, conjunctions). If the build script requires root as a non-null field, ~5-15% of words will cause errors.

**How to avoid:** Per D-04 and D-05: root and part_of_speech are nullable in the schema. Build script logs gaps to `gaps-report.json` but does not throw on missing root/POS. The field is omitted from the database row (NULL value), and the UI silently hides the root/POS row on the word card when the value is NULL.

**Warning signs:** Build script error messages citing missing root data. Check `gaps-report.json` for the volume — if >20% of high-frequency words are missing roots, the source data file may be malformed.

### Pitfall 7: NativeWind Version Mismatch

**What goes wrong:** NativeWind installation fails or produces garbled styles because the installed version is incompatible with Expo SDK 55 / React Native 0.83.

**Why it happens:** The existing research files reference "NativeWind v5 with Tailwind v4.1+" but the npm registry shows latest is 4.2.3 as of 2026-03-28. The naming/versioning may differ from what was researched. Expo SDK 55 compatibility needs explicit verification.

**How to avoid:** Run `npx expo install nativewind` rather than `npm install nativewind` so Expo's version resolver picks the compatible version. Check the NativeWind docs for SDK 55 compatibility. If issues arise, fallback to `StyleSheet.create()` with a `theme.ts` object — this is fully viable for the app's styling needs (MEDIUM confidence item).

**Warning signs:** Red screen errors mentioning PostCSS or Tailwind config, or styles not applying.

---

## Code Examples

Verified patterns from official sources and existing project research:

### Drizzle + expo-sqlite initialization

```typescript
// src/data/database.ts
// Source: https://orm.drizzle.team/docs/connect-expo-sqlite
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('kalima.db', { enableChangeListener: true });
export const db = drizzle(expo, { schema });
```

### SQLiteProvider with assetSource

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sqlite/
<SQLiteProvider
  databaseName="kalima.db"
  assetSource={{ assetId: require('../../assets/db/kalima.db') }}
  options={{ enableChangeListener: true }}
>
  {children}
</SQLiteProvider>
```

### Drizzle migrations with useMigrations

```typescript
// Source: https://orm.drizzle.team/docs/connect-expo-sqlite
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './drizzle/migrations';

const { success, error } = useMigrations(db, migrations);
```

### Level-config.json structure (D-06, D-07)

```json
{
  "levels": [
    { "id": 1, "name": "The Essentials", "description": "The most frequent words in the Quran" },
    { "id": 2, "name": "Words of Worship", "description": "Language of prayer and devotion" },
    { "id": 3, "name": "The Divine", "description": "Attributes and names of Allah" }
  ],
  "wordsPerLevel": { "min": 25, "max": 50 }
}
```

### gaps-report.json format (D-05)

```json
{
  "generated": "2026-03-28T12:00:00Z",
  "totalWords": 1450,
  "gapsCount": 87,
  "gaps": [
    {
      "wordId": 142,
      "arabic": "مِنْ",
      "lemma": "min",
      "missingFields": ["root", "partOfSpeech"],
      "frequency": 3226,
      "note": "Preposition — root not applicable for particles"
    }
  ]
}
```

### ArabicText with color prop (from CONTEXT.md specifics)

```typescript
// D-specifics: color prop for flexibility across dark/light contexts
<ArabicText color="#4ade80" size="large">
  {word.arabic}
</ArabicText>
```

### Tanzil XML structure (expected format)

```xml
<!-- quran-uthmani.xml from tanzil.net -->
<quran>
  <sura index="1" name="Al-Faatiha">
    <aya index="1" text="بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ"/>
    ...
  </sura>
</quran>
```

```javascript
// fast-xml-parser parsing approach
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const result = parser.parse(xmlContent);
const suras = result.quran.sura;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFonts()` hook + `AppLoading` | `expo-font` config plugin | Expo SDK 50+ | No async loading state; font embedded at build time; eliminates FOUT |
| Manual SQLite file copying on Android | `SQLiteProvider assetSource` prop | expo-sqlite v14+ | Official cross-platform solution; eliminates iOS/Android asymmetry |
| WatermelonDB for offline | expo-sqlite + Drizzle | 2024-2025 | WatermelonDB designed for sync; Drizzle is simpler for offline-only |
| Expo Go for development | expo-dev-client | SDK 48+ mainstream | Native modules (Drizzle, MMKV) not available in Expo Go; dev client required |
| React Context + useReducer for all state | Zustand for complex state | 2024 | Context re-renders entire subtree; Zustand selective re-renders prevent quiz jank |
| Two databases (content + user) | Single database, two logical partitions | Architecture decision | JOINs across content + progress are the most common query pattern; two DBs require app-level merging |

**Deprecated/outdated:**
- `expo-sqlite` synchronous `executeSql()` callback API: replaced by `openDatabaseSync()` and async variants in SDK 14+.
- `AsyncStorage` for preferences: replaced by `react-native-mmkv` for 30x performance gain with synchronous JSI access.
- QCF glyph fonts for vocabulary display: never appropriate; Unicode KFGQPC is correct for word-level display.

---

## Open Questions

1. **NativeWind version and Expo SDK 55 compatibility**
   - What we know: npm latest is 4.2.3; existing research references "v5 / Tailwind v4.1+" which may be incorrect or pre-release labeling
   - What's unclear: Whether "NativeWind v4.2.3" supports Tailwind v4.x, and whether it has any known issues with Expo SDK 55 / React Native 0.83
   - Recommendation: Run `npx expo install nativewind` and verify the installed version. If any metro or PostCSS errors appear during initial setup, fall back to `StyleSheet.create()` with a theme object — the app styling is not complex enough to require utility classes.

2. **KFGQPC font file acquisition**
   - What we know: Font is from the official King Fahd Complex distribution; used widely in Quran apps
   - What's unclear: The exact download URL / distribution channel for KFGQPC Uthmanic Script HAFS OTF/TTF file — it is not available via npm or Google Fonts
   - Recommendation: Source from the KFGQPC official GitHub repository (`thetruetruth/quran-data-kfgqpc` was referenced in PITFALLS.md) or from the direct KFGQPC website. Verify OFL/free license before committing to repo.

3. **corpus.quran.com data download format**
   - What we know: corpus.quran.com provides word-by-word morphological data; known gaps in root mappings
   - What's unclear: Whether bulk CSV/TSV export is available or if the data must be fetched page by page. The API/download format is not fully documented in existing research.
   - Recommendation: Check if the Quranic Arabic Corpus data is available as a bulk download on corpus.quran.com or its associated GitHub repositories before writing parsing logic. Alternative: use the OpenQuran or Zekr datasets which aggregate corpus.quran.com data.

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in config.json).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest ~29.x (ships with Expo) |
| Config file | `jest.config.js` (auto-generated by `create-expo-app`) |
| Quick run command | `npx jest --testPathPattern="scripts/" --no-coverage` |
| Full suite command | `npx jest --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Built `kalima.db` exists at `assets/db/kalima.db` and is not empty | smoke | `node scripts/validate-db.js` (output check) | Wave 0 |
| DATA-01 | Tanzil checksum validation passes for all 114 surahs | unit | `npx jest --testPathPattern="build-db" -t "checksum"` | Wave 0 |
| DATA-02 | All high-frequency words have required fields (arabic, transliteration, meaning, frequencyRank, occurrenceCount) | unit | `npx jest --testPathPattern="build-db" -t "required fields"` | Wave 0 |
| DATA-02 | Words with missing root/POS have NULL values (not empty strings) | unit | `npx jest --testPathPattern="build-db" -t "null gaps"` | Wave 0 |
| DATA-03 | Each word has at least 1 linked example verse | unit | `npx jest --testPathPattern="build-db" -t "example verses"` | Wave 0 |
| DATA-04 | Exactly ~30 levels created; each level has 25-50 words | unit | `npx jest --testPathPattern="build-db" -t "levels"` | Wave 0 |
| DATA-04 | Cumulative coverage percentages are monotonically increasing and sum to <= 1.0 | unit | `npx jest --testPathPattern="build-db" -t "coverage"` | Wave 0 |
| DATA-05 | Build script produces `kalima.db` without errors and `gaps-report.json` is written | integration | `node scripts/build-db.js && test -f assets/db/kalima.db` | Wave 0 (script itself) |
| ARAB-01 | ArabicText component renders with correct fontFamily | component | `npx jest --testPathPattern="ArabicText" -t "fontFamily"` | Wave 0 |
| ARAB-01 | ArabicText has lineHeight >= 48 for size='medium' | component | `npx jest --testPathPattern="ArabicText" -t "lineHeight"` | Wave 0 |
| ARAB-02 | ArabicText has writingDirection='rtl' and textAlign='right' | component | `npx jest --testPathPattern="ArabicText" -t "RTL"` | Wave 0 |
| ARAB-03 | App does NOT call I18nManager.forceRTL | static | `grep -r "forceRTL" src/ --include="*.ts" --include="*.tsx"` (expect no output) | N/A — static check |

**Manual-only tests:**
- Visual diacritics rendering on physical device (ARAB-01): diacritics clipping cannot be detected by Jest; requires human inspection on iOS and Android device.
- Samsung-specific Arabic rendering (from STATE.md concern): requires physical Samsung device.

### Sampling Rate

- **Per task commit:** `npx jest --testPathPattern="(build-db|ArabicText)" --no-coverage`
- **Per wave merge:** `npx jest --coverage`
- **Phase gate:** Full suite green + manual visual check on iOS simulator + Android emulator before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/__tests__/build-db.test.js` — checksum validation, required fields, null gaps, example verses, levels, coverage (DATA-01 through DATA-05)
- [ ] `src/components/__tests__/ArabicText.test.tsx` — fontFamily, lineHeight, writingDirection, textAlign (ARAB-01, ARAB-02)
- [ ] `scripts/validate-db.js` — standalone smoke test script for post-build DB validation
- [ ] `@testing-library/react-native` install: `npm install -D @testing-library/react-native`

---

## Sources

### Primary (HIGH confidence)

- Expo SQLite Documentation (https://docs.expo.dev/versions/latest/sdk/sqlite/) — assetSource API, SQLiteProvider props, asset bundling pattern
- Drizzle ORM Expo SQLite guide (https://orm.drizzle.team/docs/connect-expo-sqlite) — useMigrations hook, useLiveQuery, drizzle() initialization
- Tanzil Project docs (https://tanzil.net/docs/tanzil_project) — data format, checksums, UTF-8 Unicode version
- Quran Foundation Font docs (https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) — QCF vs Unicode font distinction; why QCF is wrong for vocabulary apps
- expo-font documentation (https://docs.expo.dev/develop/user-interface/fonts/) — config plugin approach, build-time embedding
- Existing `.planning/research/` files (STACK.md, ARCHITECTURE.md, PITFALLS.md, FEATURES.md) — HIGH confidence, researched 2026-03-28 with source citations

### Secondary (MEDIUM confidence)

- npm registry (verified 2026-03-28): better-sqlite3@12.8.0, drizzle-orm@0.45.2, drizzle-kit@0.31.10, fast-xml-parser@5.5.9, zustand@5.0.12, react-native-mmkv@4.3.0, @react-navigation/native@7.2.2, nativewind@4.2.3
- React Native I18nManager docs (https://reactnative.dev/docs/i18nmanager) — RTL support, forceRTL behavior
- Expo Local-First Architecture Guide (https://docs.expo.dev/guides/local-first/) — pre-bundled database patterns

### Tertiary (LOW confidence, flag for validation)

- KFGQPC font acquisition source (thetruetruth/quran-data-kfgqpc GitHub repo) — license and file format need verification before committing
- corpus.quran.com bulk download availability — not confirmed by official documentation; needs hands-on investigation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry 2026-03-28; Expo SDK 55 is current stable
- Architecture: HIGH — patterns from official Expo and Drizzle docs; cross-referenced with existing research
- Data pipeline: MEDIUM-HIGH — Tanzil checksum approach is well-documented; corpus.quran.com bulk download format needs verification
- Arabic font: HIGH — KFGQPC Unicode font distinction from QCF is documented in official Quran Foundation API docs; locked by D-01
- NativeWind: MEDIUM — version discrepancy (4.2.3 vs "v5" in research files) needs resolution at setup time
- Pitfalls: HIGH — sourced from official issue trackers and existing research with source citations

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (30 days; stack is stable, Expo SDK 55 is current)
