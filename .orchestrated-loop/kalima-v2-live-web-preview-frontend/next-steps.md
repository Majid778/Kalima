# Orchestrated loop — memory (the brain)

**Goal:** Make Kalima v2.0 **visible to the Boss in a browser** (the Android emulator is broken; no Xcode for iOS sim), then **polish the frontend to the Quality Bar** against that live preview, verified by screenshots each cycle.

**Stop-condition (checkable):**
1. `npx expo export -p web` exits 0; the app runs in a browser with NO crash on the core surfaces: Today loop, Journey path, Learn, Reader, Quiz, Onboarding, Profile — all rendering realistic seed content.
2. The preview is deployed to a URL the Boss can open anytime (Vercel).
3. Frontend polished pass-by-pass to the Quality Bar (dark + light parity, visual hierarchy, motion where web allows, RTL elegance), each cycle verified by screenshots + Boss sign-off.
4. `tsc` clean + `jest` green (native path never regressed) throughout.

**Cycle cap:** 5
**Human-gated actions (never auto):** ~~public deploy~~ → **CLEARED by Boss 2026-06-22: deploy to Vercel once data renders, no re-ask**; merge `v2-web-preview` → `master` (Boss still merges).

## Context (ground truth, 2026-06-22)
- v2.0 P1–P6 are ALREADY built + merged to `master` (tsc clean, jest 214/214). Startup instrumentation bug already fixed (`e33c569`). What never happened: anyone running/seeing it.
- Working branch: `v2-web-preview` off `master`. android/ build-cruft stashed.
- Web blocker (confirmed): `expo-sqlite` web build imports `wa-sqlite.wasm`; Metro can't bundle it → fix via web-only mock data layer + seed.
- Route Kalima coding to `codex-implementer`; orchestrator (Opus) handles all git + commits (git forbidden in Codex briefs — incident lesson).
- Visibility = WEB preview. Native-only bits (real audio, haptics, sqlite persistence, notifications) stubbed on web; visual/interaction frontend is real.

## Specialists (per cycle, small)
- `codex-implementer` — heavy web-enablement + frontend polish coding → working tree (gate: export 0 + tsc 0 + jest green)
- Opus orchestrator (me) — run dev server, screenshot/verify surfaces, synthesize, drive polish judgment, commit increments
- `codex-verifier` / Opus screenshot pass — cross-check that surfaces actually render + Quality-Bar claims are real

## Done
- Cut `v2-web-preview` branch off master; tsc baseline clean; loop scaffolded.
- Confirmed web fails only on sqlite-wasm (fixable).
- **Cycle 1 (web-enablement, codex-implementer):** added web-only mock data layer + 5 web shim files; export 0 / tsc 0 / jest 214 ALL passed. BUT runtime-broken.
- **Cycle 1 VERIFY (Opus, Playwright on the real export):** app RENDERS — 0 white-screen, onboarding 3-step flow works (intro → support → Arabic-level pick), all 7 tabs present (Today/Journey/Learn/Practice/Quiz/Profile), Profile shows reciter picker + Export/Restore, skeleton-loaders present (v2 design real). **BUG FOUND that gates missed:** 5× `select(...).from is not a function` → mock `db.select()` is async + `.from()` ignores table data + no `.get()/.all()`/writes → seed data never reaches screens (Journey/Today/Learn show empty/skeleton). Screenshots in job tmp `shots/`.

## Open
- **Cycle 1b (dispatched): real web data via sql.js + drizzle-orm/sql-js** loading bundled `assets/db/kalima.db`, create+seed runtime progress tables. Gate now includes a HEADLESS RUNTIME self-test (not just export). [codex-implementer afd1af369ee7aae24]
- Deploy preview to Vercel (after it renders WITH data) — GATE: confirm with Boss before first public deploy.
- Frontend polish cycles to Quality Bar.

## Polish targets already spotted (for later cycles)
- Onboarding primary button is the v1 single GREEN accent on near-black — UX research flagged exactly this; warm toward gold + add hierarchy.
- Verify the v2 design system (warm-gold, mushaf light theme, type scale) is actually applied across surfaces once data renders.

## Next cycle should focus on
- C1b: real data renders. Re-screenshot every surface WITH content → rank worst-looking → polish in priority order. Then deploy to Vercel for the Boss.

## Lessons (write a recurring mistake here so the next cycle starts smarter)
- Memory was stale by 8 days: always verify git/branch ground truth before trusting recalled state.
- Jest baseline on master is 213/214 in a FULL run but 214/214 in isolation — `TodaySessionScreen.audio.test.tsx` is FLAKY (fails at describe :168 only under full-run ordering, passes alone). Do NOT treat this 1 failure as a regression. Gate = "no NEW failures + the only failure (if any) is this flaky audio suite."
