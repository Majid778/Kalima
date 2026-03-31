# Phase 1: Data Foundation and Arabic Rendering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 01-data-foundation-and-arabic-rendering
**Areas discussed:** Arabic font selection, Data gap handling, Level naming strategy, Expo project structure

---

## Arabic Font Selection

| Option | Description | Selected |
|--------|-------------|----------|
| KFGQPC Uthmanic Script HAFS | Official King Fahd Complex font, authentic Mushaf style, gold standard | ✓ |
| Scheherazade New | SIL open-source, Unicode-compliant, easier to bundle | |
| Amiri | Scholarly font, less Mushaf-style | |

**User's choice:** KFGQPC Uthmanic Script HAFS
**Notes:** No further questions — decision was clear.

---

## Data Gap Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Hide field silently | Don't render root/POS row if data missing. Clean cards with only verified data. | ✓ |
| Show 'Unknown' placeholder | Display 'Root: —' or 'POS: unknown'. Transparent but feels incomplete. | |
| Manually curate fallbacks | Flag gap words for manual review before shipping. Higher quality, more effort. | |

**User's choice:** Hide the field silently
**Notes:** Pipeline should still log gaps to gaps-report.json for future curation.

---

## Level Naming Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Meaningful names | e.g. 'Level 1: The Essentials'. Names hardcoded in data pipeline. | ✓ |
| Generic numbered | 'Level 1', 'Level 2'. Simple, no curation. | |
| Thematic groupings only | Group by theme instead of frequency. Trades coverage-first approach. | |

**User's choice:** Meaningful curated names
**Notes:** Names stored in scripts/level-config.json, committed to repo.

---

## Expo Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| scripts/ folder in this repo | scripts/build-db.js alongside the app. Simple, one repo. | ✓ |
| Separate tools/ directory | tools/data-pipeline/ as distinct sub-project with own package.json. | |
| Separate repo | Entirely separate git repo for the pipeline. | |

**User's choice:** scripts/ folder in this repo
**Notes:** Raw data in scripts/data/raw/, generated DB in assets/db/kalima.db.

---

## Claude's Discretion

- Drizzle ORM schema design (table names, column types, indexes)
- SM-2 table structure anticipation
- Tanzil XML parsing implementation
- Build script error handling
- Expo dev client configuration

## Deferred Ideas

- Audio pronunciation (v2)
- Surah-aware progress (v2)
- Manual gap curation (future)
