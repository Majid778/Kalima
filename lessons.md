# Kalima lessons

One line per lesson: what went wrong (or was learned) and the fix.

- 2026-06-23: RN jest gotcha. A `useNavigation` mock that returns a NEW object on every call makes any effect with `[navigation]` in its deps re-run on each render, which can clobber state set between renders. A TodaySession reveal->grade test failed because the async load effect kept resetting `revealed:false`. Fix: hoist a stable object inside the mock factory and return the same reference. This was also the real cause of the older "TodaySession audio test flakes under load" note.
- 2026-06-23: Vercel font serving. Vercel excludes anything under `node_modules`, and Expo bundles fonts at `assets/node_modules/...`. The existing `assets/node_modules -> vendorassets` copy + `vercel.json` rewrite (originally for the vector-icon fonts) now ALSO serves the `@expo-google-fonts` ttf files (Plus Jakarta, Noto Naskh). Verified 0 font 404s live. Any newly bundled font needs this rewrite or it 404s in prod.
- 2026-06-23: codex-implementer can leave a `*.ts.bak` backup in the tree. Check `git status` for stray `.bak` files before committing.
- 2026-06-23: `buildActivityGrid` returns weeks oldest-first, so the CURRENT week is the LAST row (`grid[grid.length-1]`), not `grid[0]`. The "This week" strip read the wrong (empty) week.
