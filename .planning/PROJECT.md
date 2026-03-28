# Kalima — Quran Vocabulary App

## What This Is

A mobile app that helps Muslims learn and understand every word in the Quran through a structured, frequency-based vocabulary curriculum. Users progress through levels that teach the most common words first, so they quickly reach meaningful comprehension milestones. Built as a free (sadaqah) React Native app for iOS and Android.

## Core Value

Users can learn the most impactful Quran vocabulary first and track their growing understanding of the Quran as a percentage — making progress tangible and motivating.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Journey-based learning with frequency-ranked word levels
- [ ] Learn mode with Arabic word cards showing meaning, transliteration, root, and example verses
- [ ] Spaced repetition practice using SM-2 algorithm
- [ ] Quiz/test mode with multiple choice, matching, and fill-in-the-blank
- [ ] Progress dashboard showing "X% of Quran understood"
- [ ] Level unlock system (80%+ test score to advance)
- [ ] Offline-first — all content pre-bundled, no internet required
- [ ] Daily streak tracking
- [ ] Onboarding flow with Arabic level self-assessment
- [ ] Profile with stats, streak calendar, and settings
- [ ] Adjustable Arabic font size and transliteration toggle
- [ ] Today's Verse feature showing daily verse with word knowledge indicator

### Out of Scope

- Audio pronunciation — nice to have, not v1 (bundled MP3s add significant app size)
- Cloud sync / user accounts — no backend for v1, everything local
- Social features — not aligned with focused learning experience
- Gamification (XP, leaderboards, hearts/lives) — may feel at odds with Quran study
- Push notifications — defer to v2 with cloud sync
- Root word exploration mode — defer to v2

## Context

- Target audience: Arabic beginners who can read Arabic script but don't understand meanings
- ~77,000 total words in the Quran, ~1,700 unique roots, ~14,000 unique word forms
- Top 125 words cover ~50% of the Quran — powerful early motivation hook
- Quran data sources: Tanzil.net datasets + corpus.quran.com word-by-word linguistic data
- Translations: Sahih International and Pickthall (established, accepted English translations)
- Design spec completed: `docs/superpowers/specs/2026-03-28-quran-vocabulary-app-design.md`
- Dark theme with green accents (#4ade80), clean/focused aesthetic
- ~30 levels, 25-50 words each, covering ~95%+ of Quran vocabulary
- Monetization: Free (sadaqah) — charitable project, may accept voluntary donations

## Constraints

- **Platform**: React Native (Expo managed workflow) — single codebase for iOS + Android
- **Data storage**: SQLite via expo-sqlite — offline-first, pre-bundled database
- **State management**: React Context + useReducer — no Redux needed for this scope
- **Navigation**: React Navigation (bottom tabs + stack)
- **Monetization**: Free — no payment infrastructure needed
- **Data accuracy**: All Quran text must come from verified, established open datasets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frequency-based word ordering | Top 125 words cover ~50% of Quran — fast early progress | — Pending |
| SM-2 spaced repetition | Gold standard for vocabulary retention, well-understood algorithm | — Pending |
| Expo managed workflow | Faster dev cycle, OTA updates, sufficient for app needs | — Pending |
| Pre-bundled SQLite | Offline-first requirement, no backend needed for v1 | — Pending |
| No gamification | Streaks yes, but no XP/leaderboards — respect spiritual nature of Quran study | — Pending |
| Dark theme + green | Calm, focused aesthetic appropriate for Quran study | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-28 after initialization*
