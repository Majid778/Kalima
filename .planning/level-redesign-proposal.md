# Kalima Level Redesign Proposal

Status: proposed (awaiting sign-off). Produced from a grill-me session + competitor research (2026-06-23).
Implement only after Boss approval.

## The decision (locked in the interview)

1. **Frequency-first spine.** Words enter in frequency order so the "% of the Qur'an you understand" climbs fastest. That metric is the moat.
2. **Small levels grouped into % tiers.** A level is ~20-25 words (~2-3 daily sessions). Levels are grouped into a few big tiers pegged to coverage milestones.
3. **Light theming within frequency bands.** Frequency sets each level's word set; within a band we order/name by a loose theme where one exists, else a clear descriptor. Tiers carry the journey arc.
4. **4 tiers, pegged to the curve:** Foundations (to ~50%) -> Fluency (to ~75%) -> Deep Reading (to ~90%) -> Mastery (to 100%).
5. **Completion = see all words + pass a checkpoint quiz** (~80%). Two signals: exposure + a retention check.
6. **Per-tier capstone = a "read unaided" milestone + the % celebration.** At a tier's end you read a real passage using the words you've learned, crowned with the reverent coverage-% moment.
7. **Early motivation = live % payoff + power words seeded into early levels.** The coverage gauge updates every session, and early levels mix a few exciting high-frequency content words (الله، رب، قال) in with the dry function words so even Level 1 lets you partly read a real ayah.
8. **Gating = linear + revisit + placement test-out.** Linear unlock; completed levels stay open to review; a placement/test-out (from the onboarding Arabic-level pick) lets people who already know words skip ahead.

## The resulting structure (concrete)

A 3-layer model that mostly reuses existing mechanics:

```
Tier (4 total, a coverage era)
  └─ Level (~20-25 words, a node on the ascent, ends in a checkpoint quiz)
       └─ Daily session / lesson (~10 new words via SRS, review decoupled)  [already exists]
```

### Tier 1 — Foundations  (to ~50% understood)
The highest-frequency words. ~5-6 levels. Example shape (final boundaries come from the frequency data):
- **L1 First Words** — top pronouns/particles + a few power words (الله، رب، قال) so you read a real ayah on day one.
- **L2 Connectors** — the workhorse prepositions/conjunctions (في، من، على، و، الذي).
- **L3 The Divine** — lordship and the Names (رب، رحمن، رحيم).
- **L4 Belief & the Unseen** — إيمان، غيب، آخرة cluster.
- **L5 Words of Worship** — صلاة، عبادة, etc.
- **Capstone:** read Al-Fatiha (or a short passage) unaided -> the 50% celebration.

### Tier 2 — Fluency  (to ~75%)
The next frequency band, ~5-6 themed levels (Creation, People & Prophets, Commands & Prohibitions, Time & the Hereafter...).
- **Capstone:** read a short surah (Al-Ikhlas / Al-Asr) unaided -> 75% celebration.

### Tier 3 — Deep Reading  (to ~90%)
Less frequent words; more levels, finer themes.
- **Capstone:** read a longer passage unaided -> 90% celebration.

### Tier 4 — Mastery  (to 100%)
The long tail. Here the levels can shift to **root-family / depth** grouping (teach a root, unlock its derivatives) since frequency ROI flattens. This is where the "depth" mode the research flagged earns its place.
- **Capstone:** read a full page / juz unaided -> 100% celebration.

## Level anatomy

- **Size:** ~20-25 words = ~2-3 daily lessons at the existing 10-new/day drip.
- **Lesson:** the existing daily session (new + SRS review), unchanged.
- **Checkpoint:** an end-of-level quiz that shows the level's words inside **real ayat** (recognition in context, the actual goal), ~80% to pass.
- **Complete** = every word introduced AND checkpoint passed. SRS keeps reviewing the words afterward.

## Mechanics

- **Reward is two-layered:** per-level checkpoint pass (granular) + per-tier "read unaided" milestone & % celebration (chunky). This two-layer reward is the single biggest retention lever in the research.
- **Coverage gauge** updates after every session and is the spine of the motivation (the Home ring + a per-level/per-tier delta).
- **De-dup:** when a word recurs it is surfaced as "you already know this" (a free confidence win), never re-taught from scratch.
- **Gating:** linear unlock; completed levels revisitable for review; placement test-out at onboarding so advanced users skip known words.
- **Halal-motivation preserved:** no competitive leaderboards; reward via coverage growth, the reading milestones, hasanat, and dua (unchanged stance).

## What changes in the data + code

- **Re-chunk the `levels` table:** smaller levels (~22 words vs the current 50), add a `tier` field + tier metadata (name, target %), light-theme names, recomputed `cumulativeCoverage` per level. This is a re-seed of `levels` / word `levelId` assignments.
- **Verify + standardize the coverage model** (see open items) and recompute per-level/per-tier % from the real word-frequency data.
- **Add the tier concept to the Learn path UI:** group the ascent nodes into tier sections (a tier header/banner between groups) on the existing ascent path; show the coverage gauge.
- **Tier capstone screens:** the "read unaided" reading checkpoint + the % celebration moment (reuse the existing celebration screen).
- **Placement test-out flow** wired off the existing onboarding Arabic-level pick.
- **Checkpoint quiz** already exists per level; extend it to show words in real ayat and to be the completion gate.

## Open items (need a data pass before building)

1. **Coverage model.** Kalima's current data shows the first 50 words = 27.8% understood, but the well-known frequency curve says 125 words = 50%. Before building, verify the word-frequency source and decide which coverage promise we make; this sets the exact tier %s and level boundaries. (Either Kalima's top-N aren't truly the highest-frequency words, or its coverage is computed on a stricter/occurrence-weighted basis. Worth a quick audit.)
2. **Exact level boundaries + total count** — emergent from the frequency curve once #1 is settled (Tier 1 ~= 125 words / ~22 per level ~= 5-6 levels; later tiers larger).
3. **Final names** for the early function-word levels (the light-theme labels above are drafts).
4. **Test-out scope** — how many levels a placement can skip, and the bar to pass.

## Suggested implementation phases (post sign-off)

- **Phase 0 (data):** audit/curate the word-frequency list + coverage model; define the new level/tier boundaries and names (a content task, not UI).
- **Phase 1 (schema + seed):** add `tier` to the schema, re-seed levels/words, recompute coverage.
- **Phase 2 (Learn UI):** tier sections on the ascent path + the coverage gauge.
- **Phase 3 (checkpoints + capstones):** in-ayah checkpoint quiz as the completion gate; per-tier "read unaided" milestone + celebration.
- **Phase 4 (test-out):** placement skip wired off onboarding.
