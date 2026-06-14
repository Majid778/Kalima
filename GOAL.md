# Kalima v2.0 — "The Overhaul" — GOAL & Status

**What this is.** The north-star + operating contract for the v2.0 overhaul, and the current build ledger. Read before any autonomous work.

**Status (2026-06-14):** v1.0 complete. **v2.0: Phases 1–6 code-complete to the extent buildable headlessly, on branch `v2-recovery` (8 commits over v1 baseline `d3a56a5`). `tsc` clean · `jest` 213/213 across 34 suites.** A mid-build incident (an autonomous `git reset --hard` from a Codex agent wiped the uncommitted P1–P4+P6 working tree) was fully recovered from preserved Codex/session transcripts; the build now commits every verified increment. **Not yet merged to `master`; not yet run on a device.**

## The mission
Kalima teaches Qur'anic Arabic **vocabulary** via a frequency-ranked curriculum with a live **"% of the Qur'an you understand"** hero. v2.0 keeps the engine + spiritual restraint and rebuilds the experience to a premium standard — a free *sadaqah* app that feels like a craft object.

## The five pillars (non-negotiable)
1. **Reverence is the rule** — Qur'anic content is *revealed* when useful, never gated as a reward.
2. **Premium feel is first-class** — the Quality Bar is a definition-of-done every phase.
3. **Halal motivation** — engagement from real comprehension/mastery, never manufactured loss-aversion. The adopt/reject table is binding (no hearts/leagues/guilt/lootbox/mascots/gating sacred content).
4. **Offline-first, free, sadaqah** — bundled SQLite, fully offline; a backend (P6) is the only ongoing cost and is split to v2.1.
5. **Build on v1 — don't rebuild it** — integrate the shipped streak/percent-hero/heatmap/quiz-gate/SM-2 engine; justify net-new value.

## The Quality Bar (definition of done)
60fps floor / 120 on ProMotion; Reanimated-3/4 worklets on the UI thread; interruptible spring transitions; gesture-driven; skeletons-not-spinners; pressed/disabled states; subtle haptics; dark **and** light polished equally; RTL elegant. **Per-phase gate: functional ✓ · `tsc`+`jest` green ✓ · "feels premium" pass on a low-end Android device ✓.**

## Roadmap & status (loop-first)

- **Phase 1 — Daily Loop + Instrumentation · DONE (code).** Finishable "Today" session (interleave new+due+check, shrinking pile), swipe-to-grade (Reanimated worklets) + card-reveal + skeletons, visible word-strength, mistake-recovery, quiz immediate-feedback, local instrumentation funnel (D1/D7/D30/completion/drop-off). Device feels-premium pass pending.
- **Phase 2 — Qur'an at the Center · DONE (code).** Context āyāt (never gated); in-āyah word-status coloring (honestly scoped: target always + confident normalized exact-matches); `VerseTokens` + cloze rendering; Reader mode; root/morphology chips. knownMap threaded into the Today loop.
- **Phase 3 — Design System · DONE (code).** Semantic color-role tokens + warm-gold sacred + light "mushaf" theme + `useTheme()` + type scale + motion/haptics primitives + `ui/` component library; applied across every v2 surface incl. the full study stack (light+dark both work).
- **Phase 4 — Reverent Journey + Onboarding + Rewards · DONE (code).** Winding path-of-stations (breathing node, parallax, momentum, reverent locking); 90-second first-win onboarding; reverent gold MilestoneMoment (replaced the emoji modal); badges + kind streak + grace token + weekly reflection (per the adopt/reject table). Device motion/feel pass pending.
- **Phase 5 — Audio & Recitation · DONE (āyah-level).** Tap-to-play recitation wired into WordCard + Reader (streams everyayah, configurable reciter); opt-in auto-play-on-reveal in the Today loop. **Open: word-level audio needs licensed content (no free source) — flagged, future P5.** Translation reuses the v1-bundled Sahih Intl.
- **Phase 6 — Accounts/Sync/Notifications · DONE to scope.** Local smart review notifications (offline, SM-2-tied, review-readiness framing, opt-in, ≤3/week). Sync-ready offline backup/restore (portable snapshot + deterministic `mergeWordProgress` + Export/Import in Profile). **Cloud accounts + automatic sync are split to v2.1 by design** — the snapshot/merge are their foundation.

## Execution model (how it gets built)
- **Codex implements; Claude (Opus) orchestrates + verifies.** Heavy coding → `codex-implementer`; cross-model adversarial check → `codex-verifier`. **Run the gate yourself — never trust a subagent's "tests pass"** (`npx tsc --noEmit` + `jest` in this repo after every dispatch).
- **Commit every verified increment** (lesson from the incident: uncommitted work was wiped by an autonomous `git reset --hard`). **Forbid all git operations in every Codex brief.** Sequential writers only on this repo.
- Stack: Expo SDK 54 / RN 0.81, expo-sqlite + Drizzle, Zustand + MMKV, React Navigation, Reanimated 4 + gesture-handler, expo-haptics; added expo-audio + expo-notifications (need a native rebuild before they fire on device). `npm install --ignore-scripts`. Android emulator must boot with `-gpu host`.

## What remains before shipping v2.0 (all user-gated or by-design-deferred)
1. **Device "feels premium" / 60fps pass** on a low-end Android device — only the user can clear this (the app has not been run with these changes; needs `expo prebuild` to pick up expo-audio/expo-notifications).
2. **Merge `v2-recovery` → `master`** — user approval.
3. **Word-level audio content** (P5) + **cloud sync backend** (P6, v2.1) — content/architecture decisions the GOAL defers.

## Milestone success criteria (v2.0 "done" when)
1. First-time user reaches a real "I understood a piece of the Qur'an" first win in ~90s.
2. The "Today" session is the obvious finishable default.
3. Every word is seen (and heard) in Qur'anic context; reader mode shows comprehension grow.
4. The app looks/feels premium — Quality Bar met on a low-end Android device.
5. Motivation passes the halal test; no rejected mechanic ships.
6. (If P6) progress survives reinstall (snapshot today; cloud in v2.1).
