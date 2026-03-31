# Feature Landscape

**Domain:** Quran vocabulary learning mobile app
**Researched:** 2026-03-28

## Competitive Landscape

The Quran vocabulary learning space has several established players, each with a distinct angle:

| App | Focus | Monetization | Key Differentiator |
|-----|-------|-------------|-------------------|
| **Kalaam** | Quranic Arabic vocabulary + grammar | Free (all features) | Personalized comprehension %, color-shifting Quran reading mode, mnemonics |
| **Quranic** | Quranic Arabic learning | Freemium (premium quizzes) | Community profiles, "Quran Qlips" social recording, Qibla finder |
| **Quran Progress** | Vocabulary via spaced repetition | Free (web-based) | 4,000+ word library, adaptive virtual coach, writing exercises |
| **Quran Flow** | Vocabulary mastery by surah | Freemium | FSRS algorithm, mastery heatmap, root word analysis, semantic grouping |
| **Retain Quran** | Quran memorization flashcards | Free | SRS flashcards for ayah memorization, cross-platform sync |
| **Quran Companion** | Memorization with gamification | Freemium | Group challenges, AI lesson plans, heavy gamification |
| **Quran.com** | Reading + reference | Free | Word-by-word translation, multiple tafsirs, auto-bookmarking |

**Key insight:** Kalaam is the closest direct competitor to Kalima. It covers frequency-based vocabulary, spaced repetition, comprehension percentage, and is free. However, Kalaam has moved toward social features (leaderboards, chat, local matching) which may dilute focus. Several apps are web-only or memorization-focused rather than vocabulary-focused.

## Table Stakes

Features users expect. Missing any of these and the app feels incomplete or inferior to existing alternatives.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Frequency-based word ordering** | Every serious competitor does this (Kalaam, Quran Progress, Quran Flow). Users expect to learn high-impact words first. | Medium | Top 125 words = ~50% coverage is the standard hook across the space |
| **Spaced repetition review** | SM-2 or FSRS is standard in every vocabulary app. Users expect the app to schedule reviews intelligently. | Medium | SM-2 is simpler to implement; FSRS is newer but more complex. SM-2 is fine for v1. |
| **Word cards with meaning + transliteration** | Every competitor shows Arabic word, English meaning, and transliteration. Basic vocabulary presentation. | Low | Must include: Arabic, meaning, transliteration. Root is a nice bonus. |
| **Example verses in context** | Kalaam, Quran Flow, and Quran Progress all show words in their Quranic context. Users expect to see where words appear. | Medium | Show 1-2 example ayahs per word with the target word highlighted |
| **Quiz/test modes** | Multiple choice and matching are standard across Quran Progress, Quranic, and general language apps. | Medium | Multiple choice is minimum. Matching and fill-in-blank add variety. |
| **Progress tracking dashboard** | Every competitor has some form of progress visualization. Users need to see advancement. | Medium | Must show clear metrics: words learned, levels completed, review stats |
| **Offline functionality** | Quran Flow, Quranic, and Quran Teacher all advertise offline access. Users study in mosques, during travel, and in areas with poor connectivity. | Low | Pre-bundled SQLite database. No network dependency for core learning. |
| **Adjustable Arabic font size** | Standard accessibility feature across Quran.com, Quran Academy, and others. Arabic readability varies greatly by font size. | Low | Minimum 3 sizes. Important for older users and varying screen sizes. |
| **Dark mode** | Users frequently request night mode. Quran.com and others offer it. Common for apps used during evening/night study. | Low | Already planned as primary theme. Consider light mode toggle too. |
| **Onboarding with level assessment** | Kalaam does this well: quick test tells you your current comprehension %. Sets appropriate starting point. | Medium | Self-assessment or short quiz. Prevents beginners from being overwhelmed and advanced users from being bored. |
| **Daily streak tracking** | Kalaam, Quran Flow, and Duolingo-style apps have normalized streaks. Users expect consistency motivation. | Low | Simple consecutive-days counter with calendar visualization |

## Differentiators

Features that set Kalima apart from competitors. Not expected, but valued. These are the reasons a user would choose Kalima over Kalaam or Quran Flow.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"X% of Quran understood" metric** | The single most motivating number. Kalaam shows this at onboarding but Kalima can make it the **persistent, central metric** that updates with every word learned. No competitor makes this the hero metric on the main dashboard. | Medium | Calculate based on word frequency data. "You now understand 52.3% of the words in the Quran." This is Kalima's core value prop. |
| **Level unlock system with mastery gates** | Structured progression with 80%+ score to advance creates a clear journey. Most competitors have loose lesson sequences without gates. Quran Flow has surah-based organization but no mastery requirements. | Medium | 30 levels, 25-50 words each. Must pass test to unlock next. Prevents skipping ahead without retention. |
| **Today's Verse with knowledge overlay** | Show a daily verse with color-coding indicating which words the user already knows vs. doesn't. Kalaam has color-shifting reading but not a daily curated verse experience. | Medium | Powerful daily engagement hook. User sees their knowledge applied to real Quran text every day. Visual proof of progress. |
| **Completely free (sadaqah model)** | Many competitors are freemium (Quranic, Quran Flow) or have paywalls. User reviews consistently complain about subscription costs ($5-8/month). Being 100% free with no ads is a genuine differentiator in this space. | None | No payment infrastructure needed. This is a positioning advantage, not a feature to build. Prominently communicate this. |
| **Clean, focused UX (no feature bloat)** | Quranic has Qibla finder, prayer times, social recording. Kalaam has chat, local matching, leaderboards. Kalima can win by being the app that does ONE thing excellently: teach Quran vocabulary. | Low | Restraint is the feature. Every screen serves vocabulary learning. |
| **Root word connections on word cards** | Show that K-T-B connects "book" (kitab) and "writing" (kataba). Quran Flow does this but most others don't. Helps build Arabic intuition. | Low | Display root on word cards. Don't build a full root exploration mode (that's v2). |
| **Surah-aware progress** | After learning words, show which surahs the user can now substantially understand. "You know 78% of the words in Surah Al-Fatiha." | High | Requires mapping words to surah occurrences. Powerful but data-intensive. Consider for v1.5 or v2. |

## Anti-Features

Features to explicitly NOT build. These are either misaligned with Kalima's values, add complexity without proportional value, or are traps that competitors have fallen into.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Gamification (XP, leaderboards, hearts/lives)** | Quran Companion and Kalaam have leaderboards and points. This can feel disrespectful to Quran study and shifts motivation from learning to competing. User reviews are mixed on gamification in Islamic apps. | Streaks and completion percentages provide motivation without trivializing the content. Celebrate milestones with encouraging messages, not point scores. |
| **Social features (chat, friend matching, group challenges)** | Kalaam added direct chat and local user matching. Quran Companion has group challenges. These add massive complexity (moderation, safety, backend infrastructure) and dilute focus from learning. | Keep the app a focused, personal learning tool. Social accountability can come via sharing screenshots or progress externally. |
| **Audio pronunciation in v1** | Bundled MP3s add significant app size (potentially 100MB+). Quran Flow and Quranic include audio but it's not essential for vocabulary recognition. | Transliteration serves the pronunciation need for v1. Audio can be added in v2 with streaming or on-demand download. |
| **Cloud sync / user accounts** | Requires backend infrastructure, authentication, data privacy compliance (especially sensitive for religious data). Massive scope increase. | Local-only storage with SQLite for v1. Consider export/backup feature before full cloud sync. |
| **Push notifications** | Requires backend, notification infrastructure, and careful handling (notification fatigue in Islamic apps is a common complaint). | In-app daily streak reminder is sufficient. Users open the app out of habit/motivation, not push prompts. |
| **Full Quran reader** | Quran.com already does this excellently and is free. Building a full mushaf reader is massive scope with no differentiation. | "Today's Verse" feature gives daily Quran exposure without building a full reader. Link to Quran.com for full reading. |
| **Tajweed / recitation features** | Tarteel and dedicated tajweed apps own this space. Attempting to compete fragments focus. | Stay in the vocabulary lane. Tajweed is a different learning domain. |
| **AI-powered features** | Quran Companion uses "AI lesson plans." Adding AI adds API costs (incompatible with free model), backend dependency (incompatible with offline-first), and uncertain value. | SM-2 algorithm is a proven, deterministic, offline-friendly approach. No AI needed. |
| **Multi-language Quran translations** | Quran.com supports 50+ languages. Building multi-language support is a localization rabbit hole. | English only for v1. The frequency-based vocabulary approach works for any English-speaking learner regardless of native language. |
| **In-app purchases / premium tiers** | User reviews consistently criticize paywalls in Quran apps. Freemium creates UX friction and feels wrong for Quran content. | Sadaqah model. Optional donation link (external) if desired, but no in-app purchases. |

## Feature Dependencies

```
Onboarding Assessment --> Level Placement (determines starting level)
Word Database (frequency-ranked) --> Learn Mode --> Spaced Repetition Review
Word Database --> Quiz/Test Mode
Quiz/Test Mode + Score Tracking --> Level Unlock System (80%+ gate)
Word Database + Frequency Data --> "X% of Quran Understood" Metric
Level Unlock System --> Progress Dashboard (levels completed, words learned)
Spaced Repetition --> Progress Dashboard (review stats, retention rate)
Word Database + Verse Mapping --> Today's Verse (word knowledge overlay)
Word Database + Verse Mapping --> Example Verses on Word Cards
```

**Critical path:** Word Database must be built first. Everything depends on having frequency-ranked, verse-mapped vocabulary data.

## MVP Recommendation

**Prioritize (must ship in v1):**

1. **Word database with frequency ranking** -- foundation for everything else
2. **Learn mode with word cards** -- core learning experience (Arabic, meaning, transliteration, root, example verse)
3. **Spaced repetition review (SM-2)** -- retention mechanism, this is what makes learning stick
4. **Quiz/test mode** -- assessment and level gating (multiple choice minimum, matching as stretch)
5. **"X% of Quran understood" dashboard** -- Kalima's hero differentiator, the single most motivating metric
6. **Level system with unlock gates** -- structured progression, prevents skipping
7. **Daily streak tracking** -- lightweight consistency motivation
8. **Onboarding flow** -- Arabic level assessment, sets starting point
9. **Offline-first architecture** -- pre-bundled SQLite, no network needed
10. **Today's Verse** -- daily engagement hook with word knowledge overlay

**Defer to v1.5/v2:**

- **Surah-aware progress** ("You understand 78% of Al-Fatiha"): High value but requires additional data processing. Ship after core loop is validated.
- **Audio pronunciation**: Adds app size, not essential for vocabulary recognition.
- **Root word exploration mode**: Full root exploration is scope creep. Showing root on cards is enough for v1.
- **Light mode toggle**: Dark-first is fine. Light mode is a nice-to-have.
- **Export/backup**: Local data backup before cloud sync arrives.

## Sources

- [Kalaam App](https://www.kalaamapp.com/) -- closest direct competitor, frequency-based vocabulary, free
- [Quranic App (App Store)](https://apps.apple.com/us/app/quranic-quran-arabic-learning/id1381145375) -- spaced repetition, community features, freemium
- [Quran Progress](https://www.quranprogress.com/en/) -- web-based vocabulary learning, 4000+ words, SRS
- [Quran Flow (App Store)](https://apps.apple.com/us/app/quran-flow-quran-vocabulary/id6757132321) -- FSRS algorithm, mastery heatmap, root analysis
- [Quran.com](https://quran.com/) -- word-by-word translation, reference standard
- [Quran Companion (App Store)](https://apps.apple.com/us/app/quran-companion-app/id6760252605) -- gamified memorization, group challenges
- [Retain Quran](https://retainquranapp.com/) -- SRS flashcards for memorization
- [Quranica - Learn Quranic Arabic Apps](https://quranica.com/articles/learn-quranic-arabic-apps/) -- app comparison
- [Quran In Depth - 2025 App Comparison](https://www.quranindepth.com/blog/quran-learning-apps-2025-comparison)
- [ResearchGate - User Review Analysis of Quranic Arabic Apps](https://www.researchgate.net/publication/337532502_Determining_areas_of_improvement_in_Quranic_Arabic_vocabulary_learning_mobile_applications_through_analysis_of_app_user_reviews)
