---
phase: 03
slug: learn-mode-and-spaced-repetition
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --passWithNoTests --no-coverage` |
| **Full suite command** | `npx jest --passWithNoTests --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --no-coverage`
- **After every plan wave:** Run `npx jest --passWithNoTests --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | — | unit | `npx jest sm2` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PRAC-04, PRAC-05 | unit | `npx jest sm2` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | LEARN-01..05 | unit | `npx jest WordCard` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PRAC-01..03 | unit | `npx jest Flashcard` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__mocks__/react-native-reanimated.ts` — Jest mock for reanimated worklets
- [ ] `__mocks__/react-native-gesture-handler.ts` — Jest mock for gesture handler
- [ ] Existing jest infrastructure covers framework needs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipe gesture navigates cards | LEARN-01 | Gesture interaction | Swipe left/right on word card, verify card changes |
| Arabic word highlighted in verse | LEARN-03 | Visual rendering | Open word card, check target word is green in verse |
| Flashcard tap-to-reveal | PRAC-02 | Touch interaction | Tap flashcard, verify back content appears |
| Haptic feedback on grade | — | Physical sensation | Grade a card, feel haptic response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
