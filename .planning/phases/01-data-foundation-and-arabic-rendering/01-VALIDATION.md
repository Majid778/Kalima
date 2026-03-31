---
phase: 1
slug: data-foundation-and-arabic-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (via Expo's default jest-expo preset) |
| **Config file** | jest.config.js (Wave 0 installs) |
| **Quick run command** | `npx jest --testPathPattern="__tests__"` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="__tests__"`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DATA-01 | unit | `npx jest --testPathPattern="build-db"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | DATA-02 | unit | `npx jest --testPathPattern="build-db"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 2 | DATA-03 | unit | `npx jest --testPathPattern="build-db"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 2 | DATA-04 | unit | `npx jest --testPathPattern="build-db"` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | DATA-05 | unit | `npx jest --testPathPattern="build-db"` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 3 | ARAB-01 | manual | see manual table | N/A | ⬜ pending |
| 1-02-02 | 02 | 3 | ARAB-02 | manual | see manual table | N/A | ⬜ pending |
| 1-02-03 | 02 | 3 | ARAB-03 | manual | see manual table | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/build-db.test.js` — stubs for DATA-01 through DATA-05 (pipeline, schema, levels, corpus, gaps-report)
- [ ] `src/components/__tests__/ArabicText.test.tsx` — stubs for ARAB-01, ARAB-02, ARAB-03
- [ ] `jest.config.js` — jest-expo preset configuration
- [ ] `npx expo install jest-expo @types/jest` — install test dependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Arabic text renders with full diacritics on iOS simulator | ARAB-01 | Requires visual inspection of rendered glyphs on device | Run `npx expo run:ios`, navigate to word card, verify tashkeel visible using KFGQPC font |
| Arabic text renders with full diacritics on Android simulator | ARAB-01 | Requires visual inspection on device | Run `npx expo run:android`, navigate to word card, verify tashkeel visible |
| RTL layout is correct per-component while UI labels stay LTR | ARAB-02 | Layout directionality requires visual QA | Open word card, confirm Arabic text flows right-to-left, confirm English labels remain left-to-right |
| App builds and runs on both simulators | ARAB-03 | Full Expo build verification | Run `npx expo run:ios` and `npx expo run:android` — both must launch without error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
