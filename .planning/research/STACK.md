# Technology Stack

**Project:** Kalima -- Quran Vocabulary App
**Researched:** 2026-03-28
**Mode:** Ecosystem (greenfield)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Expo (managed) | SDK 55 | App framework | Latest stable (Feb 2026). React Native 0.83, React 19.2. New Architecture only. OTA updates via EAS for content fixes. Managed workflow meets all project needs. | HIGH |
| React Native | 0.83 | Mobile runtime | Ships with Expo SDK 55. New Architecture mandatory (no opt-out). Fabric renderer, TurboModules, JSI all default. | HIGH |
| TypeScript | ~5.7 | Language | Ships with Expo SDK 55 template. Type safety is non-negotiable for a data-heavy app with complex scheduling logic. | HIGH |

### Database & Data Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-sqlite | ~15.x (SDK 55) | Local database | First-party Expo package. Synchronous API via `openDatabaseSync()`. Supports pre-bundled `.db` files via `assetSource` prop on `SQLiteProvider`. No need for third-party SQLite bindings. | HIGH |
| Drizzle ORM | ~0.45 | Query builder / schema | Type-safe SQL queries. Official expo-sqlite integration. ~7.4kb minified+gzipped, zero dependencies. Schema definitions double as documentation. `useMigrations` hook prevents race conditions. Drizzle Studio Expo plugin available for dev debugging. | HIGH |
| drizzle-kit | ~0.30 | Migrations | Generates migration SQL from schema changes. Pairs with drizzle-orm. | HIGH |

**Pre-bundled database strategy:** Build the Quran vocabulary SQLite database at build time (Node.js script), embed via `expo-asset` config plugin + metro resolver (`db` added to `assetExts`). Load at runtime with `SQLiteProvider assetSource`. This avoids first-launch delays from inserting ~14,000 word forms.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | ~5.x | App state | Lightweight (~1kb), zero boilerplate, selective re-renders via subscriptions. Context + useReducer causes full subtree re-renders on any state change -- problematic for quiz screens updating timers/scores rapidly. Zustand's `persist` middleware with MMKV handles settings/streak persistence trivially. | HIGH |
| react-native-mmkv | ~3.x | Key-value storage | 30x faster than AsyncStorage. Synchronous reads via JSI (aligns with New Architecture). Use for: user preferences, streak data, onboarding completion, font size settings. NOT for vocabulary data (that's SQLite). Requires dev client (not Expo Go), which is fine since Drizzle also requires it. | HIGH |

**Why not React Context + useReducer (as noted in PROJECT.md constraints)?** Context re-renders every consumer on any state change. For a quiz screen with a timer, score counter, and card flip animation, this causes measurable jank. Zustand is ~1kb and solves this with zero API overhead. The PROJECT.md constraint was likely set before evaluating performance implications -- recommend updating it.

### Navigation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Navigation | 7.x | Screen navigation | Stable, well-documented, pairs with Expo SDK 55. Bottom tabs + stack navigator matches the app's tab-based design (Journey, Practice, Progress, Profile). v8 is alpha -- not production-ready. | HIGH |
| @react-navigation/bottom-tabs | ~7.x | Tab bar | Native bottom tab bar. Handles the 4-tab layout. | HIGH |
| @react-navigation/native-stack | ~7.x | Stack screens | Native stack transitions for drill-down screens (Level Detail, Quiz, Learn). | HIGH |

**Why not Expo Router?** Expo Router is file-based routing built on React Navigation. It adds convention but also indirection. For a 4-tab app with ~15 screens, explicit React Navigation config is clearer and gives more control over tab badge updates, deep linking to specific levels, etc. Either works; React Navigation is the safer choice for this scope.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NativeWind | v5 | Utility-first styling | Built on Tailwind CSS v4.1+. Utility classes for rapid UI development. Dark mode support built-in (critical for the dark-theme design). CSS variables for the green accent color system. Requires React Native 0.81+ (we have 0.83). | MEDIUM |
| Tailwind CSS | v4.1+ | Style engine | Required by NativeWind v5. PostCSS-based. | MEDIUM |

**Confidence note:** NativeWind v5 is relatively new (early 2026). If stability issues arise, fallback to `StyleSheet.create()` with a custom theme object. The app's styling needs are straightforward enough for either approach.

### Arabic Text & RTL

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-font | ~13.x | Custom Arabic fonts | Config plugin embeds fonts at build time (no async loading flash). Supports `.ttf` and `.otf`. | HIGH |
| @expo-google-fonts/noto-kufi-arabic | latest | Arabic typography | Clean, readable Arabic font from Google Fonts. Pre-packaged for Expo. Consider also bundling Amiri or Scheherazade New for Quranic text specifically. | MEDIUM |
| I18nManager | built-in | RTL layout | React Native built-in. Use `I18nManager.forceRTL()` selectively for Arabic text containers, NOT globally (app UI should remain LTR for English-speaking users who read Arabic script). | HIGH |

**RTL strategy:** Do NOT enable global RTL. The target audience reads English UI but studies Arabic vocabulary. Use `writingDirection: 'rtl'` style prop on Arabic text containers. `textAlign: 'right'` for Arabic word display. Keep navigation, buttons, and English text in LTR.

### Animations & Interactions

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| react-native-reanimated | ~4.3 | Animations | Required for card flip animations (Learn mode), progress bar animations, quiz transitions. Runs on UI thread via worklets. v4 is New Architecture only (matches SDK 55). Auto-configured via babel-preset-expo. | HIGH |
| react-native-gesture-handler | ~2.x | Gestures | Swipe gestures for card navigation in Learn mode. Pairs with Reanimated for fluid gesture-driven animations. | HIGH |
| expo-haptics | ~14.x | Haptic feedback | Subtle feedback on correct/incorrect quiz answers, level unlock celebrations. Three methods: `selectionAsync`, `impactAsync`, `notificationAsync`. | HIGH |

### Spaced Repetition

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom SM-2 implementation | n/a | Scheduling algorithm | SM-2 is ~30 lines of code. Implement directly rather than importing a library. The `supermemo` npm package works but is unnecessary dependency for such simple math. Custom implementation allows tuning parameters for Quran vocabulary (e.g., adjusting ease factor bounds for Arabic learners). Store `interval`, `repetition`, `efactor`, `nextReviewDate` per word in SQLite. | HIGH |

**Why not use a library?** The SM-2 algorithm is:
```typescript
function sm2(quality: number, repetition: number, efactor: number, interval: number) {
  if (quality >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * efactor);
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
  }
  efactor = Math.max(1.3, efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { interval, repetition, efactor };
}
```
Adding a dependency for this is over-engineering. Own the code, tune it freely.

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Jest | ~29.x | Unit tests | Ships with Expo. Test SM-2 logic, level progression calculations, quiz scoring. | HIGH |
| React Native Testing Library | ~12.x | Component tests | Test quiz components, card rendering, accessibility. | HIGH |

### Build & Deploy

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| EAS Build | latest | CI/CD builds | Expo's cloud build service. Handles iOS/Android builds without local Xcode/Android Studio setup. Free tier sufficient for a sadaqah project. | HIGH |
| EAS Update | latest | OTA updates | Push Quran data corrections, bug fixes without app store review. Critical for a Quran app where data accuracy is paramount. | HIGH |
| EAS Submit | latest | Store submission | Streamlined App Store / Play Store submission. | HIGH |

### Dev Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Expo Dev Client | SDK 55 | Development | Required (Drizzle + MMKV need native modules not in Expo Go). Custom dev client is standard practice for SDK 55 projects. | HIGH |
| Drizzle Studio (Expo plugin) | latest | DB debugging | Visual database inspector during development. Inspect vocabulary data, review scheduling state. | MEDIUM |
| expo-dev-client | ~5.x | Dev builds | Custom development client for testing native module integrations. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State mgmt | Zustand | Context + useReducer | Re-renders entire consumer subtree on any change. Quiz screens with timers will jank. |
| State mgmt | Zustand | Redux Toolkit | Massive overkill for ~5 stores. 10x more boilerplate. |
| State mgmt | Zustand | Jotai | Atomic model adds complexity for no benefit at this scale. |
| ORM | Drizzle | TypeORM | Heavy, decorator-based, poor React Native support. |
| ORM | Drizzle | Raw SQL | Loses type safety, migration management, schema documentation. |
| ORM | Drizzle | WatermelonDB | Designed for sync scenarios. No backend = no sync = unnecessary complexity. |
| KV storage | MMKV | AsyncStorage | 30x slower, async-only API. MMKV's sync reads simplify state hydration. |
| KV storage | MMKV | expo-secure-store | SecureStore is for sensitive data (tokens, passwords). Overkill for preferences. |
| Styling | NativeWind v5 | StyleSheet.create | More verbose, no utility classes, manual dark mode. Viable fallback if NativeWind unstable. |
| Styling | NativeWind v5 | Tamagui | Heavier, more opinionated, steeper learning curve. |
| Styling | NativeWind v5 | Unistyles | Good alternative but smaller ecosystem than NativeWind. |
| Navigation | React Navigation 7 | Expo Router | File-based routing adds indirection for a simple 4-tab app. Either works. |
| Navigation | React Navigation 7 | React Navigation 8 | Alpha only. Not production ready. |
| SM-2 | Custom impl | `supermemo` npm | Adding a dependency for 30 lines of math. Own it. |
| SM-2 | Custom impl | FSRS algorithm | More sophisticated but harder to debug/tune. SM-2 is proven for vocabulary apps. |
| Database | expo-sqlite | RxDB | Designed for real-time sync. Overkill for offline-only. |
| Fonts | Noto Kufi Arabic | System Arabic fonts | Inconsistent rendering across devices. Bundled font ensures consistent Quran text display. |

## Installation

```bash
# Create project with Expo SDK 55
npx create-expo-app@latest kalima

# Core data layer
npx expo install expo-sqlite
npm install drizzle-orm
npm install -D drizzle-kit

# State management
npm install zustand
npm install react-native-mmkv

# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Styling
npm install nativewind
npm install -D tailwindcss @tailwindcss/postcss postcss

# Animations & interactions
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install expo-haptics

# Fonts
npx expo install expo-font
npm install @expo-google-fonts/noto-kufi-arabic

# Asset bundling (for pre-built SQLite DB)
npx expo install expo-asset

# Dev tools
npx expo install expo-dev-client

# Testing (ships with Expo but verify)
npm install -D @testing-library/react-native
```

## Key Configuration Notes

1. **metro.config.js** -- Add `db` to `resolver.assetExts` for SQLite bundling
2. **app.json** -- Add `expo-asset` plugin with paths to pre-built `.db` files
3. **babel.config.js** -- Reanimated plugin auto-configured by `babel-preset-expo` in SDK 55
4. **NativeWind** -- Requires `global.css` with `@tailwind` directives and PostCSS config
5. **Dev Client** -- Run `npx expo run:ios` / `npx expo run:android` instead of `npx expo start` for Expo Go

## Version Pinning Strategy

Use `npx expo install` for all Expo-ecosystem packages (auto-pins compatible versions). Pin Drizzle and Zustand to minor versions in `package.json` to avoid breaking changes:

```json
{
  "drizzle-orm": "~0.45.0",
  "zustand": "~5.0.0",
  "react-native-mmkv": "~3.0.0"
}
```

## Sources

- [Expo SDK 55 Release](https://expo.dev/changelog/sdk-55-beta) -- SDK 55 features, React Native 0.83, React 19.2
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/) -- Synchronous API, asset bundling
- [Drizzle ORM - Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite) -- Official integration guide
- [drizzle-orm npm](https://www.npmjs.com/package/drizzle-orm) -- v0.45.2, zero dependencies
- [React Navigation 7](https://reactnavigation.org/) -- Stable release, bottom tabs + native stack
- [React Navigation 8 Alpha](https://reactnavigation.org/blog/2025/12/19/react-navigation-8.0-alpha/) -- Not yet stable
- [NativeWind v5](https://www.nativewind.dev/docs/getting-started/installation) -- Tailwind v4.1+, React Native 0.81+
- [react-native-reanimated v4](https://docs.expo.dev/versions/latest/sdk/reanimated/) -- New Architecture only
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) -- 30x faster than AsyncStorage, JSI sync
- [SuperMemo 2 Algorithm](https://github.com/VienDinhCom/supermemo) -- Reference implementation
- [Expo Font Documentation](https://docs.expo.dev/develop/user-interface/fonts/) -- Config plugin for build-time embedding
- [I18nManager](https://reactnative.dev/docs/i18nmanager) -- RTL support in React Native
- [State Management 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) -- Zustand vs Context comparison
- [Expo Local-First Guide](https://docs.expo.dev/guides/local-first/) -- Architecture patterns for offline apps
