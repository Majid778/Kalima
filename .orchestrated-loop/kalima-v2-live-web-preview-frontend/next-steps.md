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

## Open (CYCLE 1 COMPLETE — preview is LIVE)
- ✅ **Cycle 1b DONE: real web data via sql.js** loads bundled kalima.db; all Drizzle queries (joins/groupBy/count) run real. Self-test: words=1500, leftJoin=4500, practiceStats groupBy works.
- ✅ **Fixed the runtime crash** (`e.exec is not a function`): App.tsx `WebDbGate` was still calling `setDb({})` from cycle 1 — rewired to await async `initializeDatabase()` + seed streak. Declared `sql.js@1.14.1` as explicit dep (was only transitive). Committed `f6247fa`.
- ✅ **DEPLOYED to Vercel (prod, public): https://kalima-web-preview.vercel.app** — verified live render, 0 console errors, sql.js loads db over HTTPS.
- ✅ Full-surface gallery captured (job tmp shots/): onboarding first-win, Today (25-item session, semantic pills), Journey (gold 0% hero + verse card), Learn (level grid), Profile (reciter picker + export/restore). All 0 errors.

## DESIGN PIVOT (2026-06-22) — Boss disliked the current design
- Made 10 styled mockups (Pencil MCP broke — wrote to a phantom doc, then disconnected on app restart; fell back to HTML mockups at `$JOBTMP/mockups/index.html`, screenshotted + opened in browser).
- **Boss chose: #01 MUSHAF MANUSCRIPT (primary) + #09 Emerald Geometric (alternate).**
- Cycle 3 in flight: implement Mushaf Manuscript as the DEFAULT theme on Today + Journey (parchment cream, deep gold accent, serif display numerals/titles/CTAs, gold hairline rules, manuscript verse card; no neon). codex-implementer a1ec9bee3b4164b59. Then verify on web preview + redeploy. Emerald Geometric = next alternate to prototype if Boss wants to compare.
- Mockup palette refs in next-steps history / mockups/index.html sections "01" and "09".

## IA OVERHAUL (2026-06-23) — Boss: "too many tabs, user will be lost, not satisfying"
- Decision: **collapse 6 tabs → 3: Home · Learn · You** (Boss chose the aggressive option).
- Home = NEW merged screen (Journey % hero + Today session card + Today's Verse + practice-due). Learn = LevelListScreen path + quiz launched from WordCard (Quiz tab removed). You = ProfileScreen.
- Sessions stay as STACK screens (TodaySession/PracticeSession/QuizSession pushed). Only risk handled: Quiz was only launchable from the Quiz tab → added "Take the quiz" CTA on WordCard.
- codex-implementer aba568eff29796129. Then verify Home on web preview (the "satisfying" payoff lives there) + iterate + redeploy.
- Now-unused after this: TodayHomeScreen, JourneyScreen, PracticeHomeScreen, QuizHomeScreen (kept as files, dropped from tabs).

## NEXT: frontend polish cycles to Quality Bar (the "especially the frontend" ask)
Polish targets spotted (ranked):
1. **Hero metric reads 0%** — only 6/1500 words "known" → rounds to 0%. Seed more `known` progress so the comprehension % shows a motivating non-zero number (it's THE hero metric).
2. **Green primary buttons** (Onboarding "Begin", Today "Start Session", Journey "Practice 5 due") = v1 single-accent the UX research flagged → warm toward gold for sacred/primary hierarchy.
3. Audit dark+light parity (mushaf theme), motion (Reanimated worklets don't run on web — note: web can't fully verify 60fps/haptics; those stay a device check).
4. Capture the Today SESSION card (reveal + grade) + Quiz + Reader — not yet screenshotted.

## Re-deploy command (static export → prod) — INCLUDES the Vercel node_modules font fix
Vercel auto-excludes anything under `node_modules`, so Expo's vendored icon fonts
(`assets/node_modules/@expo/vector-icons/...ttf`) 404 in prod (square tab icons).
Fix: copy them to `/vendorassets` + a `vercel.json` rewrite. Full redeploy:
```
cd /Users/majidibrahim/Documents/GitHub/Kalima && npx expo export -p web --output-dir /tmp/kw
rm -rf /tmp/kalima-web-preview && cp -R /tmp/kw /tmp/kalima-web-preview
cd /tmp/kalima-web-preview && cp -R assets/node_modules vendorassets
printf '{"rewrites":[{"source":"/assets/node_modules/:path*","destination":"/vendorassets/:path*"}]}' > vercel.json
vercel deploy --prod --yes
```
(better Cycle 3 fix: a deploy script in the repo, or configure expo asset path off node_modules.)

## Polish targets already spotted (for later cycles)
- Onboarding primary button is the v1 single GREEN accent on near-black — UX research flagged exactly this; warm toward gold + add hierarchy.
- Verify the v2 design system (warm-gold, mushaf light theme, type scale) is actually applied across surfaces once data renders.

## Next cycle should focus on
- C1b: real data renders. Re-screenshot every surface WITH content → rank worst-looking → polish in priority order. Then deploy to Vercel for the Boss.

## Lessons (write a recurring mistake here so the next cycle starts smarter)
- Memory was stale by 8 days: always verify git/branch ground truth before trusting recalled state.
- Jest baseline on master is 213/214 in a FULL run but 214/214 in isolation — `TodaySessionScreen.audio.test.tsx` is FLAKY (fails at describe :168 only under full-run ordering, passes alone). Do NOT treat this 1 failure as a regression. Gate = "no NEW failures + the only failure (if any) is this flaky audio suite."
