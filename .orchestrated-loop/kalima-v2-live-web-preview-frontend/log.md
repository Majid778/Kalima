# Orchestrated loop — log (append-only, one entry per cycle)

## Cycle 1 — make v2 web-viewable on real data + deploy  (2026-06-22)
- **Goal slice:** stop-condition parts 1+2 (renders in browser w/ real data; deployed to a URL).
- **Workers:** codex-implementer ×2 (1: web mock — passed export/tsc/jest but runtime-broken; 1b: real sql.js data). Opus orchestrator: Playwright runtime verify + the wiring fix + git + deploy.
- **What shipped:** web preview on real `kalima.db` via sql.js+drizzle/sql-js; native untouched. Commit `f6247fa`. **Live: https://kalima-web-preview.vercel.app** (public, 0 errors).
- **Key lesson (verify > trust):** both codex gates (export/tsc/jest) passed while the app was runtime-broken twice (mock `.from` missing; then `setDb({})` leftover → `e.exec` crash). Only Playwright screenshotting caught it. ALWAYS runtime-verify web in a browser, not just by export.
- **Also:** sql.js was missing from package.json (only transitive) — declared it. Jest audio suites flake under CPU contention; pass in isolation.
- **Next:** frontend polish cycles (hero %=0 seed fix, green→gold hierarchy, session/quiz/reader captures, dark+light parity).

## Cycle 2 — frontend polish (autonomous, Boss-approved backlog)  (2026-06-22)
- **Done:** (1) green→gold premium palette — `colors.primary` → manuscript gold `#e3b24a`, warmed pure-black base to deep ink; green reserved for success/mastery/correct (verified quiz still greens correct answers). (2) Mushaf light theme had its OWN hardcoded green action — fixed to deep gold `#c08a1e` + dark-ink onAction (dark+light parity). (3) Hero % was 0 because `getQuranPercent` counts `status='review'` (occurrence-weighted), not my `'known'` seed → fixed seed to 100 top-frequency `'review'` words → **53%**. (4) Seed enriched (2 levels done, 115 words, mastered 100, 5-day rhythm). (5) Milestone auto-pop suppressed via `celebratedMilestones:[0.25,0.5]` in seedWebStreak.
- **Verified:** tsc 0, jest 214/214, export 0, 0 runtime errors dark+mushaf. Playwright gallery: onboarding, Today (gold 30), Journey (gold 53% + reverent MilestoneMoment), session card + SM-2 grade buttons (Again/Hard/Good/Easy), Profile (rhythm framing, gold badges), Learn grid, mushaf parchment+gold.
- **Lessons:** `TSC=$?` after a pipe measures the pipe tail, not tsc — use `npx tsc; echo $?` directly. `npm install <pkg>` PRUNES unsaved-but-present deps (pruned expo-audio/notifications — now declared). App status vocab = new/learning/review/mastered (no 'known'). Theme has per-theme hardcoded action colors — changing colors.ts only hits dark; mushaf needs its own edit.
- **Open for Cycle 3:** nav header strip stays dark in mushaf (App.tsx KalimaTheme hardcoded dark) — make NavigationContainer theme follow settings.theme. Quiz/Reader internal screens still not screenshotted (capture-harness tab-nav flaky after deep navigation).

## Cycle 3 — DESIGN PIVOT: Mushaf Manuscript redesign (Boss-chosen)  (2026-06-22)
- Boss disliked the prior design → 10 HTML mockups (Pencil MCP broke) → Boss picked **#01 Mushaf Manuscript** (lead) + #09 Emerald (alternate).
- **Shipped + LIVE:** Mushaf is now the DEFAULT theme. Parchment cream + deep manuscript gold + serif display (Georgia, no bundled font). Today + Journey + shared components (Button/SacredNumber/MilestoneMoment) restyled, all theme-driven. codex-implementer did theme+screens; Opus fixed the nav chrome.
- **Two nav-chrome fixes (Opus, the implementer missed them):** App.tsx NavigationContainer theme now derives from `useTheme()` (was hardcoded dark `KalimaTheme`); `BottomTabNavigator` header + tab bar now use theme tokens + serif title (were hardcoded legacy dark `colors`). Killed the black header strip that clashed with parchment.
- **Verified:** tsc 0, jest 214/214, export 0, 0 runtime errors, deployed + prod-screenshotted. Commit `a6828a1`.
- **Open for Cycle 4:** restyle the remaining screens (Learn/Practice/Quiz/Profile/Reader/Onboarding) to the manuscript tokens (they inherit token colors but may have manuscript-specific polish to do — e.g. serif headers, verse cards); optionally prototype #09 Emerald as a side-by-side; bundle a real Arabic manuscript serif (Amiri) for the ayah text.
