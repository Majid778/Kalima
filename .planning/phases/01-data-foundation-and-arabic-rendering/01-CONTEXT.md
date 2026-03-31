# Phase 1: Data Foundation and Arabic Rendering - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the verified, frequency-ranked Quran vocabulary SQLite database and the Arabic text rendering component. This phase has no UI features — it produces the data layer and the `<ArabicText>` component that every subsequent phase depends on. Expo project scaffolding is also part of this phase.

</domain>

<decisions>
## Implementation Decisions

### Arabic Font
- **D-01:** Use **KFGQPC Uthmanic Script HAFS** — the official King Fahd Complex font, used in most Quran apps worldwide. Authentic Mushaf style, excellent diacritics. Source from the official KFGQPC distribution.
- **D-02:** Bundle the font via `expo-font` config plugin (build-time embedding, no async loading flash).
- **D-03:** All Arabic text uses `fontFamily: 'KFGQPC-Uthmanic-Script-HAFS'` — no system Arabic font fallback.

### Data Gap Handling
- **D-04:** When root letters or part-of-speech are missing from source data (corpus.quran.com gaps), **hide the field silently** — do not render the root/POS row on the word card at all.
- **D-05:** The build pipeline must log all gap words to a `gaps-report.json` file for future manual curation (v2), but missing fields do NOT block the build.

### Level Naming Strategy
- **D-06:** Levels have **meaningful curated names** hardcoded in the data pipeline (e.g., "The Essentials", "Words of Worship", "The Divine"). Names are stored in a `scripts/level-config.json` file alongside the build script.
- **D-07:** Level numbering is 1-based (Level 1, Level 2...) with the name as a subtitle. Both number and name are stored in the SQLite `levels` table.

### Project Structure
- **D-08:** The data pipeline lives in `scripts/build-db.js` in this repo. Run with `node scripts/build-db.js` before building the app. No separate package.json — uses project-level dependencies.
- **D-09:** Raw source data (Tanzil XML/CSV, corpus.quran.com files) lives in `scripts/data/raw/` and is committed to the repo. The generated `kalima.db` goes to `assets/db/kalima.db`.

### RTL Rendering
- **D-10:** Arabic text uses **per-component RTL** only — `writingDirection: 'rtl'` and `textAlign: 'right'` on the `<ArabicText>` component. Do NOT call `I18nManager.forceRTL()`.
- **D-11:** `<ArabicText>` is a shared component in `src/components/ArabicText.tsx` that all screens use — never render Arabic text with raw `<Text>` elements.

### Expo Scaffolding
- **D-12:** Use Expo SDK 55 (managed workflow). Initialize with `npx create-expo-app@latest` using the TypeScript template.
- **D-13:** Use **React Navigation** (not Expo Router) — bottom tabs + native stack, consistent with the planned navigation structure.

### Claude's Discretion
- Exact Drizzle ORM schema design (table names, column types, indexes)
- SM-2 data table structure (this is Phase 3, but schema should be anticipated)
- Tanzil.net XML parsing implementation details
- Build script error handling and retry logic
- Expo dev client configuration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` §Data Foundation — DATA-01 through DATA-05 requirements
- `.planning/REQUIREMENTS.md` §Arabic Text Rendering — ARAB-01 through ARAB-03 requirements

### Research
- `.planning/research/STACK.md` — Technology recommendations with versions (Expo SDK 55, expo-sqlite, Drizzle ORM, MMKV)
- `.planning/research/ARCHITECTURE.md` — Database schema design, single `kalima.db` strategy, Drizzle + assetSource interaction
- `.planning/research/PITFALLS.md` — Quran data accuracy pitfalls (Tanzil checksums), Arabic font pitfalls (QCF trap), expo-sqlite bundle size limit (~25MB), RTL pitfalls
- `.planning/research/FEATURES.md` — Word database is the critical path; everything else blocked on it

### Design Spec
- `docs/superpowers/specs/2026-03-28-quran-vocabulary-app-design.md` — Full app design including data model, word entry fields, level breakdown table

### External Data Sources
- Tanzil.net (https://tanzil.net/docs/tanzil_project) — Primary Quran text source with checksum verification
- corpus.quran.com (https://corpus.quran.com) — Word-by-word morphological data (root, POS) — has known gaps

No external specs or ADRs beyond the above — requirements are fully captured in decisions and research files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project. Phase 1 creates the foundational assets all subsequent phases use.

### Established Patterns
- None yet — patterns will be established in this phase.

### Integration Points
- `assets/db/kalima.db` — Pre-built database consumed by `SQLiteProvider` (expo-sqlite) in the app's root provider
- `src/components/ArabicText.tsx` — Created in this phase, used by every content screen in Phases 3-5
- `src/db/schema.ts` — Drizzle schema created in this phase, extended (not modified) in later phases

</code_context>

<specifics>
## Specific Ideas

- During brainstorming: "Large, beautiful Arabic typography as the centerpiece" — the KFGQPC font selection directly supports this
- During brainstorming: "Dark theme with green accents (#4ade80)" — the `<ArabicText>` component should accept a `color` prop for flexibility across dark/light contexts
- Level names from brainstorm mockup: "Level 1: The Essentials" — confirms the `number: name` format

</specifics>

<deferred>
## Deferred Ideas

- Audio pronunciation for words — v2 requirement (AUDI-01), not in Phase 1 or v1
- Surah-aware progress tracking — v2 requirement (ADV-02)
- Root word exploration mode — v2 requirement (ADV-01)
- Manual curation of data gaps — captured in `gaps-report.json` for future work, not blocking v1

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-data-foundation-and-arabic-rendering*
*Context gathered: 2026-03-28*
