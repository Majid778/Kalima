# Requirements: Kalima

**Defined:** 2026-03-28
**Core Value:** Users learn the most impactful Quran vocabulary first and track their growing understanding of the Quran as a percentage

## v1 Requirements

### Data Foundation

- [x] **DATA-01**: App ships with a pre-bundled SQLite database containing all frequency-ranked Quran vocabulary words (sourced from Tanzil.net with checksum verification)
- [x] **DATA-02**: Each word entry includes: Arabic text, transliteration, English meaning(s), root letters, part of speech, frequency rank, and occurrence count
- [x] **DATA-03**: Each word entry includes 1-3 linked example Quran verses (surah number, ayah number, full Arabic text, English translation) with the word's position marked
- [x] **DATA-04**: Words are organized into ~30 levels ordered by frequency (most common first), with each level containing 25-50 words and a cumulative Quran coverage percentage
- [x] **DATA-05**: Database includes a build-time pipeline (Node.js script) that processes raw Tanzil + corpus.quran.com data and validates checksums before bundling

### Learning — Learn Mode

- [x] **LEARN-01**: User can browse all words in a level via swipeable word cards
- [x] **LEARN-02**: Each word card displays the Arabic word prominently, transliteration (toggleable), English meaning(s), root letters, part of speech, and occurrence count
- [x] **LEARN-03**: Each word card displays at least one example Quran verse with the target word highlighted in Arabic and the English translation shown below
- [x] **LEARN-04**: User can navigate forward and backward through word cards within a level
- [x] **LEARN-05**: User can see their position within the level (e.g., "Word 3 of 40")

### Learning — Practice Mode (Spaced Repetition)

- [ ] **PRAC-01**: User can practice due flashcards using the SM-2 spaced repetition algorithm
- [ ] **PRAC-02**: Each flashcard shows the Arabic word on the front; tapping reveals transliteration, English meaning, and an example verse
- [ ] **PRAC-03**: User self-grades each card with four buttons: Again, Hard, Good, Easy — each showing the next review interval
- [x] **PRAC-04**: SM-2 algorithm correctly updates interval, easiness factor, and next review date after each grade
- [x] **PRAC-05**: SM-2 implementation includes interval fuzzing (±10%) to prevent card clumping, a daily review cap (200 cards max), and an EF floor of 1.3
- [ ] **PRAC-06**: Practice session shows count of cards due and new cards available
- [x] **PRAC-07**: User progress (SM-2 state per word) persists in local SQLite across app launches

### Learning — Quiz Mode

- [ ] **QUIZ-01**: User can take a 20-question quiz for any unlocked level
- [ ] **QUIZ-02**: Quiz includes at least two question types: multiple choice ("What does X mean?" with 4 options) and word-to-meaning matching
- [ ] **QUIZ-03**: Wrong answers immediately show the correct answer with the example verse as context
- [ ] **QUIZ-04**: Quiz shows running score and question progress (e.g., "Question 7 of 20 — 85%")
- [ ] **QUIZ-05**: User can retake a quiz freely with no penalty
- [ ] **QUIZ-06**: Passing a quiz at 80%+ unlocks the next level

### Progress & Navigation

- [ ] **PROG-01**: Home screen displays the user's cumulative "X% of Quran understood" as a large progress circle, updating as words are mastered
- [ ] **PROG-02**: Home screen shows stats: total words learned, current streak, levels completed
- [ ] **PROG-03**: Home screen has a one-tap "Continue" button that resumes the user's current level
- [ ] **PROG-04**: Home screen shows a count of flashcards due for review with a tap to start practice
- [ ] **PROG-05**: Levels screen shows all levels with their word count, cumulative coverage %, and lock/unlock/completion state
- [ ] **PROG-06**: Today's Verse — home screen shows a daily Quran verse with a note like "You know X/Y words in this verse"
- [ ] **PROG-07**: User earns milestone celebrations (visual) at 25%, 50%, 75%, and 100% Quran comprehension

### Streaks

- [ ] **STRK-01**: App tracks a daily streak counter that increments when the user completes any learning activity each day
- [ ] **STRK-02**: Streak resets if user misses a day (no guilt mechanics — no penalty beyond reset)

### Settings & Accessibility

- [x] **SETT-01**: User can toggle transliteration visibility on/off globally
- [x] **SETT-02**: User can adjust Arabic font size (at least 3 sizes: small, medium, large)

### Arabic Text Rendering

- [x] **ARAB-01**: All Arabic text renders correctly with full diacritics (tashkeel/harakat) using a validated Unicode Quranic font
- [x] **ARAB-02**: Arabic text uses per-component RTL rendering (`writingDirection: 'rtl'`) — not global RTL mode
- [x] **ARAB-03**: App UI navigation and labels remain left-to-right (English)

### Onboarding

- [ ] **ONBD-01**: First-launch onboarding of 3 screens introducing the app concept and approach
- [ ] **ONBD-02**: Onboarding includes an optional Arabic level self-assessment (complete beginner / know alphabet / can read) that adjusts initial pacing

### Profile

- [ ] **PROF-01**: Profile screen shows total words mastered, longest streak, and level completion history
- [ ] **PROF-02**: Profile screen shows a streak calendar (heatmap) of learning activity

---

## v2 Requirements

### Audio

- **AUDI-01**: Word cards include a tap-to-play Arabic pronunciation audio for each word
- **AUDI-02**: Example verses include audio playback of the full ayah

### Cloud Sync

- **SYNC-01**: User can optionally create an account to sync progress across devices
- **SYNC-02**: Progress syncs automatically when online

### Notifications

- **NOTF-01**: Daily review reminder push notification (configurable time)
- **NOTF-02**: Weekly progress summary notification

### Advanced Learning

- **ADV-01**: Root word exploration — tap a root to see all related word forms across levels
- **ADV-02**: Surah-aware progress — show how many words the user knows per surah
- **ADV-03**: Leech detection — flag words the user consistently fails and surface them for focused review

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Social features (leaderboards, community, sharing) | May feel at odds with spiritual nature of Quran study; not core to learning |
| Gamification (XP, hearts/lives, leagues) | Same; Duolingo aesthetic feels misaligned |
| Prayer times / Qibla / Quran reader | Feature bloat; competitors have diluted their apps this way |
| Ayah memorization (hifz) | Different problem from vocabulary comprehension; separate app territory |
| Tajweed rules | Out of scope for vocabulary focus |
| Backend / API in v1 | No server needed; everything runs locally |
| Multiple translation languages | English only for v1; add later with community translations |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| ARAB-01 | Phase 1 | Complete |
| ARAB-02 | Phase 1 | Complete |
| ARAB-03 | Phase 1 | Complete |
| SETT-01 | Phase 2 | Complete |
| SETT-02 | Phase 2 | Complete |
| LEARN-01 | Phase 3 | Complete |
| LEARN-02 | Phase 3 | Complete |
| LEARN-03 | Phase 3 | Complete |
| LEARN-04 | Phase 3 | Complete |
| LEARN-05 | Phase 3 | Complete |
| PRAC-01 | Phase 3 | Pending |
| PRAC-02 | Phase 3 | Pending |
| PRAC-03 | Phase 3 | Pending |
| PRAC-04 | Phase 3 | Complete |
| PRAC-05 | Phase 3 | Complete |
| PRAC-06 | Phase 3 | Pending |
| PRAC-07 | Phase 3 | Complete |
| QUIZ-01 | Phase 4 | Pending |
| QUIZ-02 | Phase 4 | Pending |
| QUIZ-03 | Phase 4 | Pending |
| QUIZ-04 | Phase 4 | Pending |
| QUIZ-05 | Phase 4 | Pending |
| QUIZ-06 | Phase 4 | Pending |
| PROG-01 | Phase 4 | Pending |
| PROG-02 | Phase 4 | Pending |
| PROG-03 | Phase 4 | Pending |
| PROG-04 | Phase 4 | Pending |
| PROG-05 | Phase 4 | Pending |
| PROG-06 | Phase 4 | Pending |
| PROG-07 | Phase 4 | Pending |
| STRK-01 | Phase 4 | Pending |
| STRK-02 | Phase 4 | Pending |
| ONBD-01 | Phase 5 | Pending |
| ONBD-02 | Phase 5 | Pending |
| PROF-01 | Phase 5 | Pending |
| PROF-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
