---
phase: 01-data-foundation-and-arabic-rendering
plan: 02
subsystem: database, data-pipeline
tags: [sqlite, sql.js, quran-data, tanzil, corpus-morphology, frequency-ranking, data-pipeline]

# Dependency graph
requires:
  - phase: 01-01
    provides: Drizzle schema definitions, level-config.json, project scaffold with dependencies
provides:
  - Complete Node.js data pipeline (scripts/build-db.js) processing Quran text into SQLite
  - Pre-built kalima.db with 1500 frequency-ranked words across 30 levels
  - 4500 linked example verses with Arabic text and English translations
  - gaps-report.json documenting 1285 words with missing data fields
  - Post-build validation script (scripts/validate-db.js) with 14 integrity checks
  - Raw Quran data files committed to scripts/data/raw/
affects: [01-03-arabic-rendering, 02-learning-screens, 03-practice-quiz, all-feature-phases]

# Tech tracking
tech-stack:
  added: [sql.js]
  patterns: [sql.js-for-build-time-db-creation, alquran-cloud-api-for-quran-text, quranic-corpus-morphology-parsing]

key-files:
  created:
    - scripts/build-db.js
    - scripts/validate-db.js
    - scripts/data/raw/README.md
    - scripts/data/raw/quran-uthmani.json
    - scripts/data/raw/quranic-corpus-morphology.txt
    - scripts/data/raw/en.sahih.txt
    - scripts/gaps-report.json
    - assets/db/kalima.db
  modified:
    - __tests__/build-db.test.js
    - package.json
    - package-lock.json

key-decisions:
  - "Used sql.js (pure JS SQLite via Emscripten) instead of better-sqlite3 which requires C++ build tools not available on dev machine"
  - "Used AlQuran Cloud API instead of Tanzil.net direct download (Tanzil blocks automated downloads)"
  - "Used Quranic Arabic Corpus v0.4 from CLTK GitHub mirror for morphological data (root, POS, lemma)"
  - "Assigned 1500 most frequent word forms across 30 levels (50 words each) covering 67.4% of Quran text"

patterns-established:
  - "Data pipeline pattern: parse JSON Quran text, merge corpus morphology, assign to frequency-ranked levels"
  - "sql.js ASM variant for Jest tests (WASM not compatible with Jest environment)"
  - "NULL for missing root/POS (never empty strings) per D-04"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, DATA-05]

# Metrics
duration: 10min
completed: 2026-03-29
---

# Phase 1 Plan 02: Data Pipeline Summary

**Node.js pipeline producing kalima.db with 1500 frequency-ranked Quran vocabulary words across 30 levels, linked to 4500 example verses with translations**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-29T07:11:28Z
- **Completed:** 2026-03-29T07:21:37Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Complete data pipeline that processes AlQuran Cloud API JSON, Quranic Corpus morphology, and Sahih International translations into a pre-built SQLite database
- 1500 unique word forms assigned across 30 levels ordered by frequency, with cumulative coverage reaching 67.4%
- Every word linked to 3 example verses (shortest ayahs preferred), with full Arabic text and English translation
- Post-build validation script confirming 14 integrity constraints
- All 13 Wave 0 tests from Plan 01 pass against the real kalima.db

## Task Commits

Each task was committed atomically:

1. **Task 1: Acquire raw Quran data files and create the build pipeline** - `3502115` (feat)
2. **Task 2: Create database validation script and run Wave 0 tests** - `7b29271` (feat)

## Files Created/Modified
- `scripts/build-db.js` - Complete data pipeline: parse Quran JSON, merge corpus morphology, compute frequencies, assign levels, write SQLite
- `scripts/validate-db.js` - Post-build validation with 14 integrity checks
- `scripts/data/raw/quran-uthmani.json` - Full Quran text (Uthmani) from AlQuran Cloud API
- `scripts/data/raw/quranic-corpus-morphology.txt` - Word-by-word morphological data (root, POS, lemma)
- `scripts/data/raw/en.sahih.txt` - Sahih International English translation
- `scripts/data/raw/README.md` - Documentation of data sources, dates, and licenses
- `scripts/gaps-report.json` - Report of 1285 words with missing fields (root, POS, or meaning)
- `assets/db/kalima.db` - Pre-built SQLite database (1576 KB)
- `__tests__/build-db.test.js` - Updated to use sql.js instead of better-sqlite3
- `package.json` - Added sql.js dependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- Used sql.js (pure JavaScript SQLite compiled via Emscripten) instead of better-sqlite3 because the dev machine lacks C++ build tools required for native compilation. sql.js produces an identical SQLite database file.
- Used AlQuran Cloud API (`api.alquran.cloud/v1/quran/quran-uthmani`) instead of Tanzil.net direct XML download because Tanzil.net blocks automated/curl downloads.
- Used Quranic Arabic Corpus v0.4 from the CLTK GitHub mirror (`github.com/cltk/arabic_morphology_quranic-corpus`) for morphological data.
- Assigned 50 words per level (the max allowed by level-config.json) to reach 1500 words across 30 levels. Coverage is 67.4% of all Quran tokens.
- Used sql.js ASM variant (`sql.js/dist/sql-asm.js`) in Jest tests because the WASM variant is incompatible with the Jest test environment.
- English meanings come from a curated dictionary embedded in build-db.js. 1285 of 1500 words have placeholder meanings that will need future curation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] better-sqlite3 native binary unavailable**
- **Found during:** Task 1 (database writing step)
- **Issue:** better-sqlite3 requires C++ build tools (Visual Studio with C++ workload) for native compilation; not available on dev machine
- **Fix:** Switched to sql.js (pure JavaScript SQLite), which produces identical .db files without native compilation
- **Files modified:** scripts/build-db.js, scripts/validate-db.js, __tests__/build-db.test.js, package.json
- **Verification:** Pipeline produces valid kalima.db; all 14 validation checks pass; all 13 Jest tests pass

**2. [Rule 3 - Blocking] Tanzil.net XML download blocked**
- **Found during:** Task 1 (data acquisition)
- **Issue:** All Tanzil.net download URLs return 404 for automated requests (curl). The download page appears to require browser-based interaction.
- **Fix:** Used AlQuran Cloud API which provides the same Uthmani text with full tashkeel in JSON format
- **Files modified:** scripts/build-db.js (parses JSON instead of XML), scripts/data/raw/quran-uthmani.json
- **Verification:** 114 surahs, 6236 ayahs, 82456 tokens parsed successfully; Arabic text has full diacritical marks

**3. [Rule 3 - Blocking] fast-xml-parser not needed**
- **Found during:** Task 1 (data acquisition)
- **Issue:** With JSON data instead of XML, fast-xml-parser is not required
- **Fix:** Removed fast-xml-parser import; used native JSON.parse instead
- **Files modified:** scripts/build-db.js

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All deviations were necessary adaptations to the build environment (no C++ compiler) and data source availability (Tanzil blocks curl). The resulting database is identical in structure and content quality.

## Issues Encountered
- Tanzil.net blocks all curl/automated download attempts across multiple URL patterns, returning 404 pages
- Most words (1285/1500) have placeholder English meanings because the Quranic Arabic Corpus does not include English translations of individual words; a curated dictionary was provided for ~215 high-frequency words

## Known Stubs
- English meanings for 1285 of 1500 words are placeholders (e.g., "(noun)", "(verb)", "(meaning pending)"). These will need manual curation or integration with an additional dictionary source in a future update. The placeholders do not block the pipeline or downstream UI work.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- kalima.db is ready for bundling into the app via expo-sqlite's assetSource
- All schema tables (levels, words, word_verses) match the Drizzle schema from Plan 01
- Word meanings will need enrichment before user-facing release, but the data structure is complete
- Plan 03 (Arabic rendering) can proceed immediately

---
*Phase: 01-data-foundation-and-arabic-rendering*
*Completed: 2026-03-29*
