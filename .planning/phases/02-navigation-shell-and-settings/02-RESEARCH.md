# Phase 2: Navigation Shell and Settings - Research

**Researched:** 2026-03-30
**Domain:** React Navigation bottom tabs, Zustand + MMKV persistence, settings UI
**Confidence:** HIGH

## Summary

This phase replaces the current test screen in `App.tsx` with a bottom tab navigator (5 tabs with placeholder screens) and builds an inline settings panel on the Profile tab. The technical surface is narrow and well-understood: React Navigation 7 bottom tabs for navigation, a Zustand store with MMKV-backed persistence for two settings (font size and transliteration toggle), and connecting those settings to the existing `ArabicText` component.

All required dependencies are already installed (`@react-navigation/bottom-tabs`, `@react-navigation/native`, `zustand`, `react-native-mmkv`, `@expo/vector-icons`). No new packages are needed. The existing theme system (`colors.ts`, `typography.ts`) and `ArabicText` component provide the styling foundation.

**Primary recommendation:** Build the Zustand settings store with MMKV persistence first, then the tab navigator, then the Profile/Settings screen -- this order allows immediate testing of persistence before wiring up UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Icons + labels -- each tab shows icon above, text label below
- D-02: Active tab: icon AND label turn green (#4ade80); inactive tabs use textMuted (#71717a)
- D-03: Tab order: Journey | Learn | Practice | Quiz | Profile
- D-04: Settings live inline on the Profile tab -- no separate screen, no navigation push
- D-05: Profile tab is pure settings for this phase -- no user avatar, no stats, no account info
- D-06: Settings are grouped under a "Display" section header
- D-07: Layout: "Display" section header -> Arabic Font Size row -> Transliteration row
- D-08: Segmented control with 3 segments: S / M / L (no live preview sample)
- D-09: Selected segment: green filled background (#4ade80), white text; unselected: surfaceLight (#2a2a2a), muted text
- D-10: Font size preference applies globally -- all ArabicText components throughout the app
- D-11: Font sizes map to existing arabicFontSizes from src/theme/typography.ts: S=24, M=32, L=42
- D-12: Default font size: Medium (M)
- D-13: Label text: "Show Transliteration"
- D-14: Native Switch component, green when on (#4ade80), grey when off
- D-15: When off -- transliteration row simply disappears; Arabic text + meaning remain
- D-16: Default: on (transliteration visible)
- D-17: Settings state lives in a Zustand store (src/stores/settingsStore.ts)
- D-18: Persisted via react-native-mmkv -- survives app restarts
- D-19: Store exposes: arabicFontSize: 'small' | 'medium' | 'large', showTransliteration: boolean, plus setters

### Claude's Discretion
- Exact icon names/library for tab icons (use Expo vector icons)
- Tab bar background color (match surface or background)
- Section header typography and spacing
- Row height and padding for settings rows

### Deferred Ideas (OUT OF SCOPE)
- User avatar / profile stats -- later phase
- More settings (notification prefs, learning pace) -- future phases
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SETT-01 | User can toggle transliteration visibility on/off globally | Zustand store with `showTransliteration` boolean + MMKV persistence; Switch component wired to store setter |
| SETT-02 | User can adjust Arabic font size (at least 3 sizes: small, medium, large) | Zustand store with `arabicFontSize` field + MMKV persistence; segmented control UI; existing `arabicFontSizes` from typography.ts provides the S/M/L values |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-navigation/bottom-tabs | ^7.4.0 | Tab navigator | Already installed; locked in tech stack |
| @react-navigation/native | ^7.1.8 | Navigation container | Already installed; provides NavigationContainer |
| @react-navigation/native-stack | ^7.0.0 | Stack navigation (future) | Already installed; not used this phase but available |
| zustand | ^5.0.0 | Settings state management | Already installed; persist middleware built-in |
| react-native-mmkv | ^3.0.0 | KV persistence backend | Already installed; 30x faster than AsyncStorage |
| @expo/vector-icons | ^15.0.3 | Tab bar icons | Already installed; ships with Expo template |
| react-native-safe-area-context | ~5.6.0 | Safe area handling | Already installed; required by React Navigation |
| react-native-screens | ~4.16.0 | Native screen containers | Already installed; required by React Navigation |

### No New Packages Required

All dependencies for this phase are already in `package.json`. No `npm install` needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  navigation/
    BottomTabNavigator.tsx   # Tab navigator with 5 tabs
  screens/
    JourneyScreen.tsx        # Placeholder
    LearnScreen.tsx           # Placeholder
    PracticeScreen.tsx        # Placeholder
    QuizScreen.tsx            # Placeholder
    ProfileScreen.tsx         # Inline settings UI
  stores/
    settingsStore.ts          # Zustand + MMKV persist
    mmkvStorage.ts            # MMKV storage adapter for Zustand
  components/
    SegmentedControl.tsx      # Custom segmented control for font size
    ArabicText.tsx            # (existing, needs modification to read from store)
  theme/
    colors.ts                 # (existing, unchanged)
    typography.ts             # (existing, unchanged)
```

### Pattern 1: Zustand Store with MMKV Persistence
**What:** A Zustand store using the `persist` middleware with a custom MMKV storage adapter.
**When to use:** Any app state that must survive app restarts (settings, preferences).
**Example:**
```typescript
// src/stores/mmkvStorage.ts
// Source: https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md
import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV();

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  getItem: (name) => {
    return mmkv.getString(name) ?? null;
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};
```

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkvStorage';
import { ArabicFontSize } from '../theme/typography';

interface SettingsState {
  arabicFontSize: ArabicFontSize;
  showTransliteration: boolean;
  setArabicFontSize: (size: ArabicFontSize) => void;
  setShowTransliteration: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      arabicFontSize: 'medium',           // D-12 default
      showTransliteration: true,           // D-16 default
      setArabicFontSize: (size) => set({ arabicFontSize: size }),
      setShowTransliteration: (show) => set({ showTransliteration: show }),
    }),
    {
      name: 'kalima-settings',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
```

### Pattern 2: Bottom Tab Navigator with Dark Theme
**What:** React Navigation 7 bottom tab navigator with custom dark theme colors.
**When to use:** App-wide navigation shell.
**Example:**
```typescript
// src/navigation/BottomTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,       // #4ade80 (D-02)
        tabBarInactiveTintColor: colors.textMuted,   // #71717a (D-02)
        tabBarStyle: {
          backgroundColor: colors.surface,            // Dark tab bar
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      {/* D-03 tab order */}
      <Tab.Screen name="Journey" component={JourneyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" color={color} size={size} />
          ),
        }}
      />
      {/* ... other tabs ... */}
    </Tab.Navigator>
  );
}
```

### Pattern 3: NavigationContainer with Custom Dark Theme
**What:** Override React Navigation's default theme for full dark mode.
**Example:**
```typescript
// In App.tsx
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { colors } from './src/theme/colors';

const KalimaTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={KalimaTheme}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
```

### Pattern 4: ArabicText Reading from Settings Store
**What:** The existing ArabicText component must respect the global font size setting.
**When to use:** Every screen that renders Arabic text.
**Approach:** Modify `ArabicText` to read `arabicFontSize` from the settings store when no explicit `size` prop is passed. This keeps backward compatibility (explicit `size` prop overrides store).
```typescript
// Modified ArabicText.tsx
import { useSettingsStore } from '../stores/settingsStore';

export function ArabicText({ size, ...props }: ArabicTextProps) {
  const globalSize = useSettingsStore((s) => s.arabicFontSize);
  const effectiveSize = size ?? globalSize;
  // ... use effectiveSize for fontSize/lineHeight
}
```

### Anti-Patterns to Avoid
- **Hardcoding hex colors in components:** Always use `colors.*` constants from `src/theme/colors.ts`. The existing codebase already follows this pattern.
- **Creating a separate Settings screen with navigation push:** D-04 explicitly says settings are inline on the Profile tab.
- **Using AsyncStorage instead of MMKV:** MMKV is already in the stack and 30x faster. The storage adapter pattern above is the correct approach.
- **Using React Context for settings:** Zustand was chosen over Context specifically to avoid re-render issues (see STATE.md decisions).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation | Custom tab bar from scratch | `@react-navigation/bottom-tabs` | Handles safe area, accessibility, animations, platform conventions |
| KV persistence | Custom file-based storage | `react-native-mmkv` with Zustand persist | MMKV handles serialization, crash safety, encryption support |
| Icon system | Custom SVG icons | `@expo/vector-icons` (Ionicons) | 6000+ icons, tree-shaken, already bundled with Expo |

**Key insight:** This phase has zero novel technical challenges. Every piece is standard React Navigation + Zustand patterns. The risk is in getting the details wrong (colors, defaults, persistence), not in architecture.

## Common Pitfalls

### Pitfall 1: MMKV Initialization Crash in Tests
**What goes wrong:** MMKV uses JSI native bindings that are not available in Jest. Tests importing any file that imports MMKV will crash.
**Why it happens:** Jest runs in Node.js, not on a device. MMKV's native module is not available.
**How to avoid:** Mock `react-native-mmkv` in Jest setup or in `__mocks__/react-native-mmkv.ts`. Alternatively, mock the entire settings store in tests.
**Warning signs:** `Cannot find native module 'MMKV'` error in test output.

### Pitfall 2: Zustand Persist Hydration Flash
**What goes wrong:** On app launch, Zustand persist loads defaults first, then hydrates from MMKV. For a brief moment, the store has default values before MMKV data loads.
**Why it happens:** MMKV reads are synchronous via JSI, so in practice with MMKV this flash is imperceptible (unlike AsyncStorage). But the `onRehydrateStorage` callback still fires asynchronously in Zustand's persist middleware.
**How to avoid:** With MMKV, the hydration is effectively instant. No splash screen or loading gate needed for this phase. If issues arise, Zustand's `onRehydrateStorage` callback can be used.
**Warning signs:** Settings briefly showing defaults on app restart before snapping to saved values.

### Pitfall 3: Forgetting to Make ArabicText size Prop Optional
**What goes wrong:** If `ArabicText` always requires an explicit `size` prop, the global font size setting has no effect.
**Why it happens:** Current `ArabicText` defaults `size` to `'medium'` -- it needs to be changed to default to the store value instead.
**How to avoid:** Make the `size` prop truly optional (no default in destructuring), and read the store value as fallback. Keep explicit `size` prop as override for specific cases.
**Warning signs:** Changing font size in settings has no visible effect on Arabic text.

### Pitfall 4: Tab Bar Icons Not Matching Platform Conventions
**What goes wrong:** Using filled icons for all states makes active/inactive distinction unclear.
**Why it happens:** Not using outline vs. filled icon variants.
**How to avoid:** Use `-outline` variant for inactive state and filled variant for active state (Ionicons convention). The `focused` parameter in `tabBarIcon` enables this.
**Warning signs:** All tab icons look the same regardless of selection state.

### Pitfall 5: Switch Component Platform Inconsistency
**What goes wrong:** React Native's `Switch` component looks different on iOS vs Android.
**Why it happens:** Platform-specific native rendering.
**How to avoid:** Use `trackColor` and `thumbColor` props to normalize appearance. Set `trackColor={{ false: '#3e3e3e', true: colors.primary }}` for consistent behavior.
**Warning signs:** Switch looks grey/blue on Android instead of green.

## Code Examples

### Segmented Control (Custom Component)
```typescript
// src/components/SegmentedControl.tsx
// No third-party library needed -- simple custom component
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Segment<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  segments,
  selectedValue,
  onValueChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const isSelected = segment.value === selectedValue;
        return (
          <TouchableOpacity
            key={segment.value}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onValueChange(segment.value)}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,    // #2a2a2a (D-09)
  },
  segmentSelected: {
    backgroundColor: colors.primary,          // #4ade80 (D-09)
  },
  label: {
    color: colors.textMuted,                  // D-09
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#FFFFFF',                          // D-09 white text
  },
});
```

### Placeholder Screen Pattern
```typescript
// src/screens/JourneyScreen.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function JourneyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Journey</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
```

### Recommended Tab Icons (Ionicons)
```typescript
// Tab icon mapping using Ionicons from @expo/vector-icons
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Journey:  { active: 'compass',       inactive: 'compass-outline' },
  Learn:    { active: 'book',          inactive: 'book-outline' },
  Practice: { active: 'refresh-circle', inactive: 'refresh-circle-outline' },
  Quiz:     { active: 'help-circle',   inactive: 'help-circle-outline' },
  Profile:  { active: 'person-circle', inactive: 'person-circle-outline' },
};
```

### Switch with Consistent Styling
```typescript
// In ProfileScreen settings
<Switch
  value={showTransliteration}
  onValueChange={setShowTransliteration}
  trackColor={{ false: '#3e3e3e', true: colors.primary }}
  thumbColor="#FFFFFF"
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AsyncStorage for persistence | MMKV via JSI | 2023+ | Synchronous reads, 30x faster, no hydration flash |
| Context + useReducer for state | Zustand with persist middleware | 2024+ standard | No provider nesting, selective re-renders, built-in persistence |
| React Navigation 6 Tab.Navigator | React Navigation 7 createBottomTabNavigator | v7 stable 2024 | Same API, improved types, static configuration option available |

**Deprecated/outdated:**
- `createMaterialBottomTabNavigator`: Deprecated in React Navigation 7. Use `@react-navigation/bottom-tabs` only.
- `AsyncStorage`: Still works but MMKV is strictly superior for this use case.

## Open Questions

1. **NativeWind Usage**
   - What we know: NativeWind v5 is in the tech stack (STATE.md) with a "StyleSheet.create fallback" note
   - What's unclear: Phase 1 used `StyleSheet.create` throughout. Should Phase 2 continue with StyleSheet.create for consistency, or start introducing NativeWind?
   - Recommendation: Continue with `StyleSheet.create` for this phase to maintain consistency with Phase 1. NativeWind can be introduced in a dedicated styling phase or when UI complexity increases.

2. **Tab Icon Exact Names**
   - What we know: Ionicons has outline/filled variants for all common icons
   - What's unclear: The exact best icon names for "Journey" and "Practice" tabs (less obvious than Home/Book/Person)
   - Recommendation: Use `compass`/`compass-outline` for Journey, `refresh-circle`/`refresh-circle-outline` for Practice. Browse icons.expo.fyi if implementer wants alternatives.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x + @testing-library/react-native 12.x |
| Config file | `jest.config.js` (exists, uses jest-expo preset) |
| Quick run command | `npx jest --testPathPattern=settingsStore --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETT-01 | Toggle transliteration on/off, persists via store | unit | `npx jest --testPathPattern=settingsStore -x` | No -- Wave 0 |
| SETT-01 | Transliteration toggle UI renders and responds | component | `npx jest --testPathPattern=ProfileScreen -x` | No -- Wave 0 |
| SETT-02 | Font size changes between S/M/L, persists via store | unit | `npx jest --testPathPattern=settingsStore -x` | No -- Wave 0 |
| SETT-02 | ArabicText respects global font size from store | unit | `npx jest --testPathPattern=ArabicText -x` | Partial -- existing test does not cover store integration |
| SETT-02 | Segmented control UI renders and responds | component | `npx jest --testPathPattern=SegmentedControl -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/__tests__/settingsStore.test.ts` -- covers SETT-01, SETT-02 (store logic + defaults + persistence mock)
- [ ] `src/components/__tests__/SegmentedControl.test.tsx` -- covers SETT-02 (UI interaction)
- [ ] `src/screens/__tests__/ProfileScreen.test.tsx` -- covers SETT-01, SETT-02 (integration: toggle + segmented control)
- [ ] `__mocks__/react-native-mmkv.ts` -- MMKV mock for Jest (CRITICAL: without this, all store tests crash)
- [ ] Update `jest.config.js` transformIgnorePatterns to include `react-native-mmkv` if needed

## Sources

### Primary (HIGH confidence)
- [react-native-mmkv Zustand persist docs](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) -- MMKV storage adapter pattern
- [React Navigation Bottom Tab Navigator](https://reactnavigation.org/docs/bottom-tab-navigator/) -- screenOptions API, tabBarIcon, tabBarActiveTintColor
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- createJSONStorage, persist options
- Existing codebase: `src/theme/colors.ts`, `src/theme/typography.ts`, `src/components/ArabicText.tsx` -- verified current state

### Secondary (MEDIUM confidence)
- [Expo Vector Icons directory](https://icons.expo.fyi/) -- Ionicons icon name browsing
- [Expo Vector Icons docs](https://docs.expo.dev/guides/icons/) -- usage patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages already installed and version-locked in package.json
- Architecture: HIGH -- standard React Navigation + Zustand patterns, well-documented
- Pitfalls: HIGH -- MMKV Jest mocking and hydration are well-known issues with documented solutions

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable libraries, low churn)
