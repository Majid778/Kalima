---
phase: 01-data-foundation-and-arabic-rendering
plan: 01
subsystem: database, infra
tags: [expo, expo-sqlite, drizzle-orm, react-navigation, zustand, mmkv, typescript]

# Dependency graph
requires: []
provides:
  - Expo SDK 54 project scaffold with TypeScript
  - Drizzle ORM schema (levels, words, wordVerses, wordProgress, levelProgress)
  - DatabaseProvider with SQLiteProvider + migration gate
  - Metro config for .db asset bundling
  - Theme constants (colors, Arabic typography)
  - Level config with 30 curated Quranic vocabulary levels
  - Wave 0 test stubs for DATA-01 through DATA-05 and ARAB-01, ARAB-02
affects: [01-02-data-pipeline, 01-03-arabic-rendering, all-subsequent-phases]

# Tech tracking
tech-stack:
  added: [expo-sdk-54, expo-sqlite, drizzle-orm, react-navigation-7, zustand, react-native-mmkv, react-native-reanimated, jest-expo, better-sqlite3, fast-xml-parser]
  patterns: [drizzle-sqlite-schema, expo-asset-bundling, per-component-rtl]

key-files:
  created:
    - package.json
    - app.json
    - metro.config.js
    - babel.config.js
    - jest.config.js
    - src/data/schema.ts
    - src/data/database.ts
    - src/data/DatabaseProvider.tsx
    - src/data/drizzle/migrations.ts
    - src/theme/colors.ts
    - src/theme/typography.ts
    - scripts/level-config.json
    - __tests__/build-db.test.js
    - src/components/__tests__/ArabicText.test.tsx
    - App.tsx
  modified:
    - .gitignore
    - tsconfig.json

key-decisions:
  - "Used Expo SDK 54 (latest stable) instead of SDK 55 (not yet released via create-expo-app)"
  - "Removed expo-router template files in favor of React Navigation per D-13"
  - "Added skipLibCheck to tsconfig due to drizzle-orm internal type errors in mysql/gel dialects"
  - "better-sqlite3 native binary not compiled (no C++ compiler on dev machine) -- will need build tools for Plan 02"

patterns-established:
  - "Drizzle ORM schema pattern: sqliteTable with typed columns, nullable for gap fields (D-04)"
  - "Per-component RTL: writingDirection + textAlign on ArabicText, no global forceRTL (D-10)"
  - "Theme constants: centralized colors.ts and typography.ts with Arabic font config"
  - "Asset bundling: Metro .db extension + app.json expo-asset/expo-font/expo-sqlite plugins"

requirements-completed: [DATA-01, DATA-02, ARAB-03]

# Metrics
duration: 14min
completed: 2026-03-29
---

# Phase 1 Plan 01: Project Scaffold and Schema Summary

**Expo SDK 54 project with Drizzle ORM schema (5 tables), DatabaseProvider, theme constants, and Wave 0 test infrastructure for Quran vocabulary app**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-29T06:54:02Z
- **Completed:** 2026-03-29T07:07:32Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Complete Expo project scaffold with all Phase 1 dependencies installed and configured
- Drizzle ORM schema defining levels, words, wordVerses, wordProgress, and levelProgress tables with proper indexes
- DatabaseProvider wrapping SQLiteProvider with migration gate and bundled DB asset loading
- Wave 0 test stubs covering DATA-01 through DATA-05 and ARAB-01, ARAB-02 requirements
- Theme system with dark mode colors and Arabic typography constants (KFGQPC font)
- 30 curated level names in level-config.json for the vocabulary curriculum

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Expo project, install all dependencies, configure build tooling** - `946527e` (feat)
2. **Task 2: Create Drizzle schema, database instance, DatabaseProvider, and Wave 0 test stubs** - `14c876e` (feat)
3. **Cleanup: Remove expo-router template files** - `2fed21a` (chore)
4. **Cleanup: Remove expo-router dependent template component** - `79ad55a` (chore)

## Files Created/Modified
- `package.json` - Project manifest with all Phase 1 dependencies
- `app.json` - Expo config with expo-font, expo-asset, expo-sqlite plugins
- `metro.config.js` - Metro bundler config adding .db to assetExts
- `babel.config.js` - Babel config with inline-import plugin for .sql files
- `jest.config.js` - Jest configuration with jest-expo preset
- `tsconfig.json` - TypeScript config with skipLibCheck for drizzle-orm compatibility
- `App.tsx` - Minimal app entry point (placeholder for React Navigation setup)
- `src/data/schema.ts` - Drizzle ORM table definitions for all 5 tables
- `src/data/database.ts` - Drizzle DB instance via expo-sqlite
- `src/data/DatabaseProvider.tsx` - SQLiteProvider wrapper with migration gate
- `src/data/drizzle/migrations.ts` - Placeholder for drizzle-kit generated migrations
- `src/theme/colors.ts` - Dark theme color constants with green accents
- `src/theme/typography.ts` - Arabic font family, sizes, and line heights
- `scripts/level-config.json` - 30 curated level definitions for vocabulary curriculum
- `__tests__/build-db.test.js` - Wave 0 test stubs for data pipeline validation
- `src/components/__tests__/ArabicText.test.tsx` - Wave 0 test stubs for Arabic rendering

## Decisions Made
- Used Expo SDK 54 (latest stable from create-expo-app) instead of SDK 55 which is not yet available via the CLI template. SDK 54 uses React Native 0.81.5 and React 19.1.0.
- Removed expo-router and its template files since project uses React Navigation per D-13
- Added skipLibCheck to tsconfig.json because drizzle-orm v0.45.2 has internal type errors in mysql-core and gel-core modules (not used by this project)
- Installed dependencies with --legacy-peer-deps due to react@19.1.0 vs react-test-renderer@19.2.4 peer conflict
- Installed with --ignore-scripts because better-sqlite3 requires native C++ compilation (no Visual Studio/MSVC on dev machine)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SDK version mismatch**
- **Found during:** Task 1 (project scaffolding)
- **Issue:** Plan specified Expo SDK 55, but create-expo-app@latest generated SDK 54 (current stable)
- **Fix:** Proceeded with SDK 54 which is functionally equivalent for all Phase 1 needs
- **Files modified:** package.json
- **Verification:** All dependencies resolve and TypeScript compiles

**2. [Rule 3 - Blocking] expo-router template removal**
- **Found during:** Task 1 (project scaffolding)
- **Issue:** create-expo-app default template includes expo-router with app/ directory; project requires React Navigation per D-13
- **Fix:** Removed expo-router dependency and app/ directory, created minimal App.tsx entry point
- **Files modified:** package.json, app.json, removed app/ directory
- **Verification:** TypeScript compiles without expo-router errors

**3. [Rule 3 - Blocking] better-sqlite3 native compilation failure**
- **Found during:** Task 1 (dependency installation)
- **Issue:** better-sqlite3 requires C++ build tools (Visual Studio with C++ workload) for native compilation on Windows; none available
- **Fix:** Installed with --ignore-scripts to skip native build. Package is listed in devDependencies but native binary is not compiled. Will need build tools installed before running Plan 02 build script.
- **Files modified:** None (package.json entry preserved)
- **Verification:** Package is listed; native binary compilation deferred

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** SDK 54 vs 55 is cosmetic. expo-router removal was necessary for D-13 compliance. better-sqlite3 compilation is deferred to Plan 02 prerequisites.

## Issues Encountered
- Peer dependency conflict between react@19.1.0 and react-test-renderer@19.2.4 required --legacy-peer-deps flag
- Windows node_modules copy from temp directory caused file locking errors; resolved by cleaning and fresh npm install
- drizzle-orm v0.45.2 has type errors in non-SQLite dialects; resolved with skipLibCheck

## User Setup Required
- **C++ Build Tools:** Install Visual Studio Build Tools with "Desktop development with C++" workload before running Plan 02 data pipeline. Run: `npm install --global windows-build-tools` or install Visual Studio Build Tools manually.

## Known Stubs
- `src/data/drizzle/migrations.ts` - Placeholder with empty migrations; will be populated by drizzle-kit generate after schema is finalized
- `ArabicText.test.tsx` imports `../ArabicText` which does not exist yet; component will be created in Plan 03

## Next Phase Readiness
- Project scaffold complete with all dependencies and configuration
- Schema ready for Plan 02 data pipeline to populate
- Test stubs ready to validate Plan 02 (DATA tests) and Plan 03 (ARAB tests) output
- **Blocker for Plan 02:** better-sqlite3 native binary needs C++ build tools installed

## Self-Check: PASSED

All 16 created files verified present. All 4 commit hashes verified in git log.

---
*Phase: 01-data-foundation-and-arabic-rendering*
*Completed: 2026-03-29*
