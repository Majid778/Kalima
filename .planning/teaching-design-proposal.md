# Kalima In-Lesson Teaching Design Proposal

Status: proposed (awaiting sign-off). From a grill-me session + competitor research (2026-06-24).
Companion to `level-redesign-proposal.md` (that doc = the level/path STRUCTURE; this doc = how a word is TAUGHT inside a lesson). Implement only after Boss approval.

## The decision (locked in the interview)

1. **Intro card first, then drill.** A brand-new word gets a deliberate step-0 encoding beat (the WordCard: Arabic + meaning + root + reciter audio + the ayah it lives in, no test) BEFORE it enters the cloze/SRS rotation. Fixes the "no teaching step" gap that bare-SRS (Anki) and the current flow have.
2. **Expanded recognition exercise palette:** cloze-in-ayah + meaning MCQ + audio-recognition + match-pairs + reverse-MCQ + find-the-word-in-verse. All recognition; no Arabic production.
3. **Audio = a real test channel.** Per-word audio (hear the word, recognize its meaning) + tap-to-hear the ayah recited with the studied word highlighted (static). Recitation-synced "karaoke" highlight is a flagged phase-2 differentiator (needs word-level audio timing data).
4. **Graduated recognition ramp.** New words get the easiest cue (MCQ, answer visible); as SRS strength grows the cue hardens (cloze no-options -> audio-only -> reverse MCQ -> find-in-verse). Every rung stays recognition; never Arabic typing/speaking.
5. **Transliteration = fading scaffold.** Shown on new/weak words, auto-dims and drops as the word strengthens; manual toggle remains as an override. Never a permanent crutch.
6. **Root-cluster teaching, layered on frequency.** When you learn a word, surface its root + family (which members you know / are coming), building a root mental model that unlocks many Qur'anic words. Frequency still orders introduction; root is a teaching layer. The ownable edge (no lesson app teaches the root in-loop).
7. **Arabic-script reading is out of scope.** Kalima teaches meaning-recognition; the fading transliteration + the always-shown Arabic word carry non-readers. A dedicated script course is out (or far-future).

### Confirmed principles (not contested)
- **Reverent tone, corrective not punitive.** A miss shows the meaning and re-surfaces the word later; no hearts, buzzers, lost lives, or streak-anxiety over a word of the Qur'an. The existing "Again / I knew it" register is right.
- **The checkpoint quiz is the objective check.** Self-grading ("I knew it") is subjective; the level checkpoint MCQ/matching quiz (in real ayat) is the honesty check + completion gate, fixing self-grade dishonesty.

## The resulting lesson flow (a word's lifecycle, recognition-first)

1. **Introduce (step-0):** the first time a word comes up to be learned, the WordCard encoding beat: Arabic + (fading) transliteration + meaning + per-word reciter audio + the ayah it lives in (word highlighted) + its root + a root-family preview ("from k-t-b; you'll meet كاتِب, مَكتوب"). No test. Tap to continue.
2. **Recognize (early):** easy cues, answer visible/low-stakes: meaning MCQ (Arabic -> pick meaning), audio-recognition (hear the word -> pick meaning), match-pairs.
3. **Recognize-in-context (the spine):** cloze-in-ayah, the word blanked in the verse; recognize / Reveal -> self-grade (Again / I knew it). This IS the reading task and stays the core.
4. **Harder cues as strength grows (the ramp):** cloze with no options -> audio-only -> reverse MCQ (meaning -> pick the Arabic) -> find-the-word-in-the-verse. All recognition.
5. **Spaced review:** SRS re-surfaces the word before forgetting; new + due interleaved in the daily session (existing engine).
6. **Checkpoint:** at level end, the MCQ + matching quiz over the level's words shown in real ayat = the objective check + completion gate.

**A daily session** = a paced stream mixing a few new-word **intro cards** + **recognition drills** for learning words + **cloze** for review words + **audio-recognition**, easy -> hard, ~10 new + due, with **missed items re-asked before the session ends** (Duolingo's mechanic).

**Root-cluster moments:** introducing a word surfaces its root family and a "you now recognize N of M words from k-t-b" payoff.

## Mechanics

- **Word card content (the step-0 card):** Arabic, meaning, fading transliteration, root + family preview, per-word reciter audio, example ayah (word highlighted), frequency/occurrence, part of speech. Most of this exists today; what's new is the root-family preview, per-word audio, and the fading behavior.
- **Audio:** per-word audio = a test channel; ayah recitation = tap-to-hear with a static highlight. Phase-2: recitation-synced highlight.
- **Transliteration:** opacity/visibility driven by word SRS strength; manual override kept.
- **Tone:** corrective-not-punitive; SRS-driven re-surfacing instead of penalties.

## What changes in data + code

- **Session flow:** add the **intro / step-0** presentation beat for brand-new words before they enter drilling (extend the today-session builder to interleave intro cards).
- **Exercise engine:** extend `quizService` (today only `multiple-choice` + `matching`) with **audio-recognition**, **reverse-MCQ**, and **find-the-word-in-verse**; add **cloze-no-options** as a harder cloze variant. Wire the **cue-ramp** selector (choose cue type by a word's SRS strength).
- **Per-word audio assets:** today only ayah audio exists (AyahAudioButton). Need word-level audio (extract from ayah recitation by token timing, a separate word-audio source, or TTS). **Asset decision (open item).**
- **Fading transliteration:** drive the existing transliteration display by word strength (not just the global toggle).
- **Root data + teaching:** ingest root/lemma/family data (free from the **Quranic Arabic Corpus**: Arabic, gloss, transliteration, POS, root, lemma, occurrence for all ~77,430 words) and add the root-cluster teaching moment + "root unlocked" payoff (the root chips already exist as the UI seed).
- **Checkpoint quiz:** keep MC + matching as the level completion gate (already built); show words inside real ayat.

## Open items

1. **Per-word audio source** - extract from ayah recitation (needs token timing), a dedicated word-audio set, or TTS. Drives both the audio-recognition exercise and the phase-2 synced highlight.
2. **Root-family data ingest** - pull + reconcile the Quranic Arabic Corpus morphology against Kalima's existing words/roots.
3. **Cue-ramp thresholds** - which SRS strength maps to which cue (MCQ -> cloze -> audio-only -> reverse -> find-in-verse).
4. **Phase-2 synced highlight** - word-level audio timing data per ayah (Tarteel-style).

## Suggested implementation phases (post sign-off)

- **Phase 1 (low lift, high feel):** the **intro / step-0 card** beat + **fading transliteration** + confirm the reverent tone. Mostly reuses the existing WordCard + SRS.
- **Phase 2 (exercise engine):** add audio-recognition + reverse-MCQ + find-in-verse + cloze-no-options, and the **cue ramp**. Needs per-word audio (open item 1).
- **Phase 3 (the differentiator):** **root-cluster teaching** (corpus data + the teaching moment + the payoff).
- **Phase 4 (polish/whitespace):** recitation-**synced** highlight (needs word-timing data) - the full market whitespace.

## How this composes with the level-structure proposal

- The **level proposal** defines WHAT words are in a level and the path (frequency spine, ~20-25-word levels, 4 % tiers, checkpoints, capstones).
- This **teaching proposal** defines HOW each word in a level is taught (intro -> recognize -> in-context -> ramp -> review, with audio + root + fading translit).
- They share the same engine: the daily session (intro + drills + cloze) advances a level; the checkpoint quiz completes it; the SRS underpins both.
