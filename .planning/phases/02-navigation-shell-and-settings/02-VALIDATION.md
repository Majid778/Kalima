---
phase: 02
slug: navigation-shell-and-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SETT-01, SETT-02 | unit | `npx jest settingsStore` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | — | integration | `npx jest TabNavigator` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | SETT-01 | unit | `npx jest ProfileScreen` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | SETT-02 | unit | `npx jest SegmentedControl` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/stores/settingsStore.test.ts` — unit tests for Zustand settings store (MMKV persistence, defaults)
- [ ] `__mocks__/react-native-mmkv.ts` — Jest mock for MMKV native module (JSI not available in test env)
- [ ] Existing jest infrastructure covers framework needs

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark theme consistency across screens | SC-4 | Visual appearance cannot be unit tested | Navigate all 5 tabs, verify dark background + green accents |
| Arabic font size change is immediately visible | SETT-02 | Visual rendering verification | Change font size S→M→L on Profile tab, observe ArabicText updates |
| Tab icons render correctly | SC-1 | Visual icon rendering | Check all 5 tabs show correct icons with active/inactive colors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
