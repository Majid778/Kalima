# Phase 2: Navigation Shell and Settings - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

App displays a bottom tab navigator with placeholder screens for Journey, Learn, Practice, Quiz, and Profile. Users can toggle transliteration visibility and change Arabic font size, with both preferences persisting across app launches via MMKV.

Creating posts, interactions, word learning, quiz logic are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Tab bar appearance
- **D-01:** Icons + labels — each tab shows icon above, text label below
- **D-02:** Active tab: icon AND label turn green (`#4ade80`); inactive tabs use `textMuted` (#71717a)
- **D-03:** Tab order: Journey | Learn | Practice | Quiz | Profile

### Settings screen layout
- **D-04:** Settings live inline on the Profile tab — no separate screen, no navigation push
- **D-05:** Profile tab is pure settings for this phase — no user avatar, no stats, no account info
- **D-06:** Settings are grouped under a "Display" section header
- **D-07:** Layout: "Display" section header → Arabic Font Size row → Transliteration row

### Font size control
- **D-08:** Segmented control with 3 segments: S / M / L (no live preview sample)
- **D-09:** Selected segment: green filled background (`#4ade80`), white text; unselected: `surfaceLight` background (#2a2a2a), muted text
- **D-10:** Font size preference applies globally — all ArabicText components throughout the app
- **D-11:** Font sizes map to existing `arabicFontSizes` from `src/theme/typography.ts`: S=24, M=32, L=42
- **D-12:** Default font size: Medium (M)

### Transliteration toggle
- **D-13:** Label text: "Show Transliteration"
- **D-14:** Native Switch component, green when on (`#4ade80`), grey when off
- **D-15:** When off — transliteration row simply disappears; Arabic text + meaning remain; no hint or collapsed state
- **D-16:** Default: on (transliteration visible)

### State and persistence
- **D-17:** Settings state lives in a Zustand store (`src/stores/settingsStore.ts`)
- **D-18:** Persisted via react-native-mmkv (already in the tech stack) — survives app restarts
- **D-19:** Store exposes: `arabicFontSize: 'small' | 'medium' | 'large'`, `showTransliteration: boolean`, plus setters

### Claude's Discretion
- Exact icon names/library for tab icons (use Expo vector icons)
- Tab bar background color (match `surface` or `background`)
- Section header typography and spacing
- Row height and padding for settings rows

</decisions>

<specifics>
## Specific Ideas

- No specific references — standard React Navigation bottom tabs pattern
- Settings feel should be minimal and functional, not feature-heavy

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Phase 1 assets (MUST reuse, not recreate)
- `src/theme/colors.ts` — All color constants. Use these, never hardcode hex values in components.
- `src/theme/typography.ts` — `arabicFontSizes` (S/M/L values), `arabicLineHeights`, `fonts.arabic`
- `src/components/ArabicText.tsx` — Shared Arabic text component. Settings store font size feeds into this component's `size` prop.
- `src/data/DatabaseProvider.tsx` — Existing provider wrapper pattern — follow this pattern for the settings store provider if needed

### Requirements
- `SETT-01` — Transliteration toggle (global, persisted)
- `SETT-02` — Arabic font size (3 options, persisted)

### Tech stack decisions
- React Navigation 7 bottom tabs (locked in Phase 1, D-13)
- react-native-mmkv for KV persistence (locked in tech stack)
- Zustand ~5.x for app state (locked in tech stack)

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/theme/colors.ts` — Color constants ready to use for all styling
- `src/theme/typography.ts` — `arabicFontSizes` and `ArabicFontSize` type already define the S/M/L scale
- `src/components/ArabicText.tsx` — Accepts a `size` prop (`'small' | 'medium' | 'large'`) — settings store directly feeds this
- `src/data/DatabaseProvider.tsx` — Pattern for context providers to follow

### Established Patterns
- All colors via `colors.*` constants, never hardcoded
- `ArabicText` component always used for Arabic rendering, never raw `Text`

### Integration Points
- `App.tsx` — Currently renders the Arabic rendering test screen. This phase replaces it with the NavigationContainer + bottom tabs.
- `src/navigation/` — Directory exists and is empty, ready for navigation files
- `src/stores/` — Does not exist yet; create it for the settings Zustand store

</code_context>

<deferred>
## Deferred Ideas

- User avatar / profile stats — later phase
- More settings (notification prefs, learning pace) — future phases

</deferred>

---

*Phase: 02-navigation-shell-and-settings*
*Context gathered: 2026-03-29*
