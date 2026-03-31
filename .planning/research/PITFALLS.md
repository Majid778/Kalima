# Domain Pitfalls

**Domain:** Quran vocabulary learning mobile app (React Native / Expo)
**Researched:** 2026-03-28

## Critical Pitfalls

Mistakes that cause rewrites, user trust damage, or app rejection.

### Pitfall 1: Inaccurate Quran Text Data

**What goes wrong:** The Quran text displayed in the app contains typos, missing diacritics, incorrect root mappings, or wrong word-to-verse associations. For a Quran app this is not merely a bug -- it is a trust-destroying event. Users will uninstall immediately and warn others.

**Why it happens:** Multiple Quran datasets exist online with varying quality. The corpus.quran.com word-by-word data has known gaps: missing root information for time adverbs, incomplete mapping of non-noun word forms (e.g., "yawm" appears only 405 times instead of its actual frequency), and root assignment discrepancies with Tanzil data (weak letter interchanges between waaw/yaa/alif). Early digital Quran texts used Windows-1256 encoding which lacks the small-alef codepoint needed for complete Quranic text. Developers often trust a single dataset without cross-verification. Minor changes in diacritics can alter the meaning of an entire verse, and it is difficult even for Arabic speakers to distinguish subtle data errors without systematic verification.

**Consequences:** Loss of user trust (potentially irrecoverable for a Quran app), negative reviews citing "errors in the Quran," community backlash.

**Prevention:**
- Use Tanzil.net as the primary text source -- it has been verified against the Medina Mushaf with letter-by-letter checksums and has received zero typo reports since 2008.
- Cross-reference corpus.quran.com linguistic data (roots, morphology) against Tanzil verse text.
- Build an automated verification pipeline: checksum each surah against Tanzil's published checksums.
- Manually spot-check the 125 highest-frequency words and their example verses before any release.
- For word frequency data, verify counts against multiple sources (corpus.quran.com lemma frequency list, qurananalysis.com) rather than trusting a single corpus export.

**Detection:** Automated checksum validation on every database build. Beta testing with Arabic-literate scholars before public release.

**Phase:** Must be addressed in Phase 1 (data preparation). This is a prerequisite for everything else.

---

### Pitfall 2: Arabic Text Rendering and Font Failures

**What goes wrong:** Arabic text appears with broken ligatures, missing diacritics (tashkeel/harakat), incorrect letter shaping, or garbled display. Uthmanic script -- the traditional Quran calligraphy -- requires specialized fonts that many system fonts do not fully support. Text may render correctly on one platform but break on the other.

**Why it happens:** Not all Unicode fonts display Quranic text completely. Standard system Arabic fonts (e.g., on Android) may lack glyphs for Quranic-specific marks. Some Samsung devices have a known bug that truncates the first characters of Arabic verses due to their custom rendering engine. The app bundles a custom Uthmanic font but fails to load it correctly, or the font file is corrupt/incomplete. Expo's `useFonts` hook introduces a loading state that, if not handled, causes a flash of fallback font or invisible text.

**Critical font choice trap:** The Quran Foundation documents two font approaches: (1) QCF glyph-based fonts, which require 604 separate font files (one per Mushaf page) with custom ligatures where each glyph is an entire word, and (2) Unicode fonts like QPC Hafs or KFGQPC Uthmanic Script, which use a single font file with standard Arabic shaping. For a vocabulary app (not a page-by-page Mushaf reader), **always use Unicode fonts**. QCF fonts are designed for pixel-perfect Mushaf page reproduction and are wildly over-engineered for displaying individual words.

**Consequences:** Incorrect Quran display (unacceptable), inconsistent cross-platform rendering, poor readability.

**Prevention:**
- Bundle a well-tested Unicode Uthmanic font: KFGQPC Uthmanic Script HAFS (from King Fahd Complex). Do NOT use QCF/page-based fonts -- they are for Mushaf viewers, not vocabulary apps.
- Use Expo's `expo-font` with the config plugin approach (embeds fonts at build time via `expo-asset` plugin in app.json) rather than runtime-only loading, to avoid flash-of-unstyled-text.
- Create a font validation screen during development that renders all 114 surah openings (Bismillah variations) and spot-checks complex ligatures.
- Support OTF/TTF only -- these are the formats that work consistently across iOS and Android in Expo.
- Test with adjustable font sizes (the app's requirement) to verify ligatures do not break at different scales.
- Test on Samsung devices specifically -- they use a custom Arabic rendering engine with known character truncation bugs.

**Detection:** Visual regression testing on physical devices (at minimum: one iOS, one Samsung Android, one stock Android). Side-by-side comparison with a printed Mushaf for representative verses.

**Phase:** Phase 1 (foundation). Font must be validated before building any UI that displays Arabic.

---

### Pitfall 3: RTL/LTR Mixed Layout Chaos

**What goes wrong:** The app's UI is primarily LTR (English interface) but contains RTL Arabic content. React Native's I18nManager forces the entire app to one direction. Enabling RTL globally breaks English UI elements; keeping LTR globally breaks Arabic text flow. Mixed-direction screens show misaligned text, flipped icons, or cursor positioning bugs.

**Why it happens:** React Native's RTL support is app-global, not per-component. On Android, text alignment follows content language automatically, but on iOS it follows the active language bundle -- creating platform inconsistencies. The Yoga layout engine maps `left` to `start` and `right` to `end` in RTL mode, eliminating the ability to specify "true left." Dynamic RTL toggling requires a full app restart on iOS. Arabic text starting a line forces RTL on the entire Text component even in LTR mode. Numbers embedded in Arabic text remain LTR, creating bidirectional text runs that the Unicode bidi algorithm handles inconsistently across platforms. Not all third-party React Native components respect the RTL flag, and custom icons (chevrons, back arrows) need manual mirroring.

**Consequences:** Broken layouts, misaligned cards, flipped navigation gestures, inconsistent behavior between iOS and Android.

**Prevention:**
- Keep the app in LTR mode (English UI). Do NOT enable `I18nManager.forceRTL()`.
- Use `writingDirection: 'rtl'` style on individual Text components that display Arabic content.
- Use `textAlign: 'right'` explicitly on Arabic text containers rather than relying on automatic direction detection.
- Wrap Arabic text in dedicated styled components (e.g., `<ArabicText>`) that encapsulate all RTL styling, so the pattern is applied consistently.
- Test every screen on both iOS and Android -- RTL rendering differences between platforms are real and common.
- For mixed Arabic/English on the same line (e.g., "The word **kitab** means book"), use Unicode directional isolates (U+2066 LEFT-TO-RIGHT ISOLATE, U+2067 RIGHT-TO-LEFT ISOLATE) to prevent bidi algorithm interference.
- Avoid `textAlign: 'justify'` on Arabic text -- there is a known React Native bug (issue #32146) where justified Arabic text with special characters causes text overflow and clipping.

**Detection:** Cross-platform visual testing on every PR that touches text display. Maintain a "layout stress test" screen with edge cases (long Arabic words, mixed content, numbers in Arabic text).

**Phase:** Phase 1 (foundation). The `<ArabicText>` component must be established early and used everywhere.

---

### Pitfall 4: SM-2 Algorithm Implementation Errors

**What goes wrong:** The spaced repetition system either reviews cards too frequently (user frustration, feels like no progress) or too infrequently (user forgets words, loses confidence). Cards get "stuck" in a loop of failure. The algorithm silently produces incorrect intervals.

**Why it happens:** SM-2 has several easy-to-miss implementation details:
- **Ease factor floor:** EF must never drop below 1.3 (130%). Without this floor, intervals shrink to near-zero and cards get trapped in "low interval hell" -- shown every session forever.
- **Initial values:** First review must use EF=2.5 and interval=0. Wrong initialization cascades through all future reviews.
- **Failure handling:** When quality < 3, the repetition counter must reset to 0. Failing to reset means the algorithm "remembers" past success and schedules too-long intervals after a failure.
- **Overdue cards:** SM-2 is systematically too aggressive with overdue cards. Empirical analysis of 13+ years of Anki data shows that the algorithm overshoots more the more a card is overdue, with retention dropping from ~87% to ~75% as overdueness increases. The "overdueness bonus" inflates next intervals without accounting for diminished retention.
- **Cards stuck together:** Words introduced on the same day will always be reviewed together, on the same day, in the same order. This creates artificial ease because contextual cues from adjacent cards aid recall. Without interval jitter, users pass reviews without truly knowing individual words.

**Consequences:** Users feel the app "doesn't work" -- either they forget words (intervals too long) or feel harassed by constant reviews (intervals too short). This is the core learning mechanic; getting it wrong undermines the entire product.

**Prevention:**
- Implement SM-2 with explicit guard rails: `Math.max(1.3, newEF)` for the floor, validated initial values, explicit repetition counter reset on failure.
- **Add interval fuzzing:** After computing the next interval, add a small random offset (e.g., +/- 5-10% of the interval, minimum +/- 1 day for intervals > 3 days). This prevents same-day cards from always appearing together and strengthens true recall.
- Cap overdue bonus: if a card is overdue by more than 2x the scheduled interval, clamp the effective elapsed time. Follow Anki's approach of treating the overdue portion as partial credit.
- Add "leech" detection: if a card has been failed more than 6-8 times, flag it for the user with extra context (root word explanation, more example verses) rather than just showing it again.
- **Randomize review order within a session.** Never present cards in the order they were introduced.
- Write unit tests for every edge case: first review, perfect recall sequence, repeated failure sequence, long-overdue card, minimum EF boundary, same-day batch introduction.
- Log review data from the start so you can analyze whether intervals are actually working (even if you do not build the analysis UI yet).

**Detection:** Unit tests covering edge cases. Monitor average retention rate during beta -- target 85-90% recall. If it drifts below 80% or above 95%, the algorithm is miscalibrated.

**Phase:** Phase 2 (learning mechanics). Must be thoroughly unit-tested before shipping practice mode.

---

## Moderate Pitfalls

### Pitfall 5: Pre-Bundled SQLite Database Mismanagement

**What goes wrong:** The pre-populated database fails to load on first launch, loads as empty, or becomes corrupted during app updates. Users see a blank word list or the app crashes on startup.

**Why it happens:**
- Metro bundler does not include `.db` files by default. Without adding `"db"` to `config.resolver.assetExts` in metro.config.js AND configuring the `expo-asset` config plugin in app.json, the database simply is not bundled.
- **Platform asymmetry:** Bundled database access works on iOS but has documented failures on Android (expo issue #15267) where SQLite cannot directly access the bundled asset. The `assetSource` API in `SQLiteProvider` handles the copy-to-documents-directory step, but older workarounds from forum posts may lead developers to implement manual copying that conflicts with the official API.
- The `assetSource` option has a `forceOverwrite` parameter. If set to `true`, every app restart overwrites the user's database with the bundled version, destroying all progress data. If set to `false`, schema updates in new app versions are never applied.
- No migration strategy means updating the database schema in v1.1 either wipes user progress or fails silently.
- **Expo asset size limit:** Expo's EAS Build pipeline has a practical limit of ~25MB for individual bundled assets. If the SQLite database exceeds this, builds may fail with HTTP 413 errors. The Quran dataset (77,430 tokens with morphology, translations, roots, example verses) can approach this limit if not carefully normalized.

**Prevention:**
- Separate the bundled content database (read-only word data, verses) from the user progress database (SRS state, streaks, settings). Two databases, not one.
- Use the official `SQLiteProvider` with `assetSource={{ assetId: require('./assets/quran.db') }}` -- do not implement manual file copying.
- Use `PRAGMA user_version` for migration tracking. On app launch, compare the bundled version against the installed version and run migrations in transactions.
- For the content database: use `forceOverwrite: true` -- it is read-only reference data, safe to replace on updates.
- For the user database: never overwrite. Create it on first launch, migrate on updates.
- Profile the content database size early. Target under 15MB to stay well within the ~25MB asset limit with margin for growth.
- Write integration tests that simulate: fresh install, update from v1 to v2, update with schema changes.
- Always enable WAL mode (`PRAGMA journal_mode=WAL`) for better concurrent read/write performance.

**Detection:** Startup health check that verifies both databases exist and have expected table counts. Crash reporting on database open failures.

**Phase:** Phase 1 (data layer foundation). The two-database architecture must be established from the start.

---

### Pitfall 6: Bundle Size Explosion

**What goes wrong:** The app binary exceeds 100-150MB, causing slow downloads, App Store warnings, and users on limited data plans abandoning the install. Apple requires WiFi-only download above 200MB.

**Why it happens:** Quranic data is substantial: ~77,000 word instances across 6,236 verses, with morphological data, translations, transliterations, root mappings, and example sentences. A naive SQLite database with all this data plus indices can reach 30-50MB. Add Uthmanic fonts (2-5MB each), multiple font weights, and Expo's base bundle size (~20-30MB), and the total climbs quickly. If audio pronunciation is later added (out of scope for v1, wisely), individual word MP3s would push it past 500MB.

**Prevention:**
- Profile the database size early. Normalize aggressively -- store verse text once, reference by ID.
- Strip unused columns from corpus data during the build pipeline. Only include data the app actually uses.
- Use a single Uthmanic font file (Regular weight). Do not bundle Bold/Light variants unless truly needed.
- SQLite files compress well -- enable compression during the asset bundling step.
- Set a bundle size budget: target under 50MB total for v1. Monitor it in CI.
- Keep audio out of v1 (already planned -- this is correct).

**Detection:** CI step that reports app binary size on every build. Alert if it exceeds the budget.

**Phase:** Phase 1 (data preparation) and ongoing monitoring.

---

### Pitfall 7: "Percentage of Quran Understood" Calculation Errors

**What goes wrong:** The headline feature -- showing users what percentage of the Quran they can now understand -- produces incorrect, misleading, or demotivating numbers. Users learn 125 words and see "12%" instead of the expected "~50%."

**Why it happens:** The percentage must be based on word *occurrences* (tokens), not unique word *forms* (types). The Quran has ~77,430 word tokens but only ~14,000 unique forms. Learning the top 125 most frequent words covers ~50% of all 77,430 occurrences. If the calculation counts unique forms instead (125/14,000 = 0.9%), the number is crushingly low and factually wrong as a comprehension metric. Additionally, a "word" in Arabic is complex -- the same root with different prefixes/suffixes may or may not count as "known" depending on how you define coverage. The corpus.quran.com lemma frequency list groups by part-of-speech, which means the same lemma appearing as both noun and verb has separate entries -- double-counting or under-counting is easy.

**Consequences:** The motivational core of the app breaks. Users either feel deceived (number seems inflated) or demotivated (number seems too low).

**Prevention:**
- Pre-compute a frequency table mapping each unique word form to its total occurrence count across the Quran.
- Percentage = (sum of occurrence counts for all learned word forms) / 77,430 total word tokens.
- Clearly define "word form" early: does learning "kitab" also count "al-kitab" and "kutub"? Document the rule and apply it consistently. Recommendation: group by lemma (dictionary form) so inflected variants count as known.
- Show the methodology to users (a small info icon explaining "based on word frequency across all 6,236 verses").
- Validate against published frequency research: top 100 words should give ~45-50%, top 500 should give ~75-80%.

**Detection:** Unit test the percentage calculation against known benchmarks. Display the raw numbers (X words learned covering Y occurrences) alongside the percentage for transparency.

**Phase:** Phase 1 (data model) for the frequency table, Phase 2 (dashboard) for the UI.

---

### Pitfall 8: SQLite Performance Degradation

**What goes wrong:** The app becomes sluggish over time as the user's review history grows. Queries that were fast with 100 reviews become noticeably slow at 10,000+ reviews. The app stutters during review sessions or freezes when loading the dashboard.

**Why it happens:**
- **JS thread blocking:** expo-sqlite runs queries on the JavaScript thread by default. Heavy SELECT queries (e.g., "find all cards due for review today, sorted by priority, with word details joined") block the UI, causing visible frame drops.
- **Memory leak with long sessions:** A documented expo-sqlite issue (#16637) shows that memory usage grows with each transaction and never releases, reaching 1GB+ after extended use. Users doing long review sessions (30+ minutes) are affected.
- **Missing indices:** Without proper indices on `next_review_date`, `level_id`, and `word_id` columns, the review queue query performs full table scans as the history table grows.
- **Unbounded queries:** Fetching all review history for progress charts without LIMIT/OFFSET pulls thousands of rows into memory.

**Prevention:**
- Use `db.execAsync()` and `db.getAllAsync()` for all queries -- never use synchronous variants.
- Add indices on every column used in WHERE and ORDER BY clauses, particularly `next_review_date` for the daily review queue.
- Paginate all list queries. Never fetch more than 50-100 rows at once.
- For progress statistics, pre-compute aggregates (daily review count, words mastered per level) and store them in a summary table rather than recalculating from raw review history.
- Implement a periodic cleanup: archive review history older than 90 days into a compressed summary (keep the aggregate stats, discard individual review records).
- Monitor memory usage during development with long review sessions (100+ cards in sequence).

**Detection:** Performance profiling with realistic data volumes (simulate 6 months of daily use = ~5,000-10,000 review records). Test the review queue query with this volume.

**Phase:** Phase 2 (learning mechanics) for query design, Phase 3 for optimization if needed.

---

### Pitfall 9: Expo Managed Workflow Limitations Hit Late

**What goes wrong:** A required feature turns out to need native code that Expo managed workflow does not support, forcing an eject to bare workflow mid-project and disrupting the build pipeline.

**Why it happens:** Expo managed workflow restricts access to native iOS/Android code. Known limitation areas relevant to this app:
- Custom native SQLite extensions (unlikely needed, but possible for full-text search in Arabic).
- Background processing for SRS notification scheduling (out of scope for v1, but v2 risk).
- Certain audio playback configurations (out of scope for v1).
- App size limits with EAS Build.

**Prevention:**
- The current scope (SQLite, fonts, local storage, basic UI) is well within Expo managed capabilities. This is the right choice for v1.
- Before adding any v2 feature, check Expo's supported API list first.
- Use `expo-dev-client` for development builds -- it provides native module access while staying in the managed ecosystem.
- If Arabic full-text search is needed, use SQLite's built-in FTS5 (available in expo-sqlite) rather than a custom native module.

**Detection:** Maintain a "native dependency audit" -- before adding any new library, verify it works with Expo managed workflow.

**Phase:** Awareness throughout, but primarily a v2 risk. v1 scope is safe.

---

## Minor Pitfalls

### Pitfall 10: Tashkeel (Diacritics) Handling in Search and Matching

**What goes wrong:** Users cannot find words because the search or quiz matching requires exact diacritics. Or conversely, stripping diacritics causes false matches between different words that share the same consonant skeleton.

**Prevention:**
- Store words with full tashkeel for display, but create a stripped (consonant-only) version for search/matching.
- For quiz fill-in-the-blank, accept answers with or without diacritics.
- Be aware that some Arabic words are only distinguishable by diacritics (e.g., **'alima** "he knew" vs **'allama** "he taught") -- flag these pairs as easily confused in the learning data.

**Phase:** Phase 2 (quiz/practice mode).

---

### Pitfall 11: OTA Updates Breaking Database State

**What goes wrong:** An Expo OTA (over-the-air) update ships JavaScript changes that expect a new database schema, but the user's device still has the old native binary with the old database. The app crashes or shows corrupted data.

**Prevention:**
- OTA updates cannot change native assets (including bundled SQLite files). Only JavaScript changes are delivered OTA.
- If a database schema change is needed, it must ship with a new native binary via App Store/Play Store update.
- Guard all database access with version checks. If the JS code expects schema v3 but finds v2, show a "please update the app" message rather than crashing.
- Use `expo-updates` runtime version pinning to prevent JS/native version mismatches.

**Phase:** Post-launch maintenance. Not relevant until the app is in production.

---

### Pitfall 12: Level Unlock Threshold Frustration

**What goes wrong:** The 80% test score requirement to unlock the next level becomes a frustration point. Users who struggle with 2-3 difficult words in a level are blocked from all new content indefinitely.

**Prevention:**
- Allow users to continue reviewing words from the current level (spaced repetition continues) while re-attempting the level test.
- Consider a "skip with penalty" option -- let users advance but mark skipped words for extra review.
- Ensure the test pulls from the full word pool, not just the hardest words. A random sample of 15-20 words from the level's 25-50 is more fair than testing all of them.
- Show which specific words the user got wrong, so they can study targeted weak points.

**Phase:** Phase 3 (level/progression system).

---

### Pitfall 13: Daily Review Queue Overwhelming Users

**What goes wrong:** After a few weeks of consistent use, users open the app to find 80+ cards due for review. The session feels like a chore, and users stop opening the app entirely. Daily streaks break, and the user churns.

**Why it happens:** SM-2 schedules reviews independently per card. If a user learns 30 new words per week, review load compounds. After 4 weeks, the daily queue can spike to 50-100 cards on certain days when multiple batches' review dates converge. No cap on daily reviews means the algorithm's output directly becomes the user's burden.

**Prevention:**
- Cap daily review count (e.g., 30-50 reviews/day). Excess cards roll to the next day.
- Prioritize overdue cards by urgency (most overdue first) so the most at-risk words are always reviewed.
- Limit new word introductions per day (e.g., 10-15 new words max) to control future review load.
- Show users their upcoming review forecast ("12 reviews tomorrow, 25 on Thursday") so spikes are not surprising.

**Phase:** Phase 2 (learning mechanics) -- design the review queue with caps from the beginning.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data preparation | Inaccurate Quran text (#1), frequency miscounting (#7) | Use Tanzil checksums, validate frequency against published research |
| Foundation/UI | Arabic font failures (#2), RTL layout chaos (#3) | Bundle Unicode Uthmanic font (not QCF), create ArabicText component, keep app LTR |
| Database layer | Pre-bundled DB issues (#5), bundle size (#6), asset size limit | Two-database architecture, metro config + expo-asset plugin, target <15MB per DB |
| Learning mechanics | SM-2 bugs (#4), SQLite performance (#8), review overload (#13) | Unit test edge cases, add interval fuzzing, cap daily reviews |
| Quiz/practice | Tashkeel matching (#10), level frustration (#12) | Strip diacritics for matching, fair test sampling |
| Production/updates | OTA + DB mismatch (#11) | Version pinning, graceful degradation |
| v2 planning | Expo limitations (#9) | Native dependency audit before committing to features |

## Sources

- [Tanzil Project -- Quranic Fonts Documentation](https://tanzil.net/docs/quranic_fonts) -- HIGH confidence (official, primary source)
- [Quranic Arabic Corpus -- Lemmas by Frequency](https://corpus.quran.com/lemmas.jsp) -- HIGH confidence (established academic project)
- [Quran Foundation -- Font Rendering Documentation](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/) -- HIGH confidence (official docs, documents QCF vs Unicode distinction)
- [React Native RTL Support Blog](https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps) -- HIGH confidence (official docs)
- [React Native Issue #55220 -- Arabic text clipping](https://github.com/facebook/react-native/issues/55220) -- HIGH confidence (official issue tracker, Jan 2026)
- [React Native Issue #54713 -- Android RTL rendering numbers backwards](https://github.com/facebook/react-native/issues/54713) -- HIGH confidence
- [React Native Issue #32146 -- Arabic text overflow with justify](https://github.com/facebook/react-native/issues/32146) -- HIGH confidence
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) -- HIGH confidence (official docs, confirms assetSource API)
- [Expo SQLite Memory Issue #16637](https://github.com/expo/expo/issues/16637) -- HIGH confidence (official issue tracker)
- [Expo SQLite Large Query Issue #27430](https://github.com/expo/expo/issues/27430) -- HIGH confidence (official issue tracker)
- [Expo Android Bundled DB Issue #15267](https://github.com/expo/expo/issues/15267) -- HIGH confidence
- [Expo Build Asset Size Limits](https://forums.expo.dev/t/build-app-with-larger-assets/32223) -- MEDIUM confidence (community forum)
- [SM-2 Overdue Card Analysis](https://controlaltbackspace.org/overdue-handling/) -- MEDIUM confidence (empirical analysis of 13 years of Anki data)
- [SM-2 Algorithm Reference -- Anki FAQ](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) -- HIGH confidence
- [SM2+ Improved Algorithm](https://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2) -- MEDIUM confidence
- [Architecting RTL in React Native (Feb 2026)](https://medium.com/@ancybhairavi/architecting-rtl-in-react-native-what-breaks-and-what-works-8d96c8cba62b) -- MEDIUM confidence
- [KFGQPC Uthmanic Font Data](https://github.com/thetruetruth/quran-data-kfgqpc) -- MEDIUM confidence
- [Quran Root Mapping Discrepancies](https://groups.google.com/g/united-quran/c/F-6KeW1sB6c) -- MEDIUM confidence
- [GeekyAnts -- RTL in React Native Expo Guide](https://geekyants.com/en-us/blog/implementing-rtl-right-to-left-in-react-native-expo---a-step-by-step-guide) -- MEDIUM confidence
