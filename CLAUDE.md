<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kalima — Quran Vocabulary App**

A mobile app that helps Muslims learn and understand every word in the Quran through a structured, frequency-based vocabulary curriculum. Users progress through levels that teach the most common words first, so they quickly reach meaningful comprehension milestones. Built as a free (sadaqah) React Native app for iOS and Android.

**Core Value:** Users can learn the most impactful Quran vocabulary first and track their growing understanding of the Quran as a percentage — making progress tangible and motivating.

### Constraints

- **Platform**: React Native (Expo managed workflow) — single codebase for iOS + Android
- **Data storage**: SQLite via expo-sqlite — offline-first, pre-bundled database
- **State management**: React Context + useReducer — no Redux needed for this scope
- **Navigation**: React Navigation (bottom tabs + stack)
- **Monetization**: Free — no payment infrastructure needed
- **Data accuracy**: All Quran text must come from verified, established open datasets
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
### State Management
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | ~5.x | App state | Lightweight (~1kb), zero boilerplate, selective re-renders via subscriptions. Context + useReducer causes full subtree re-renders on any state change -- problematic for quiz screens updating timers/scores rapidly. Zustand's `persist` middleware with MMKV handles settings/streak persistence trivially. | HIGH |
| react-native-mmkv | ~3.x | Key-value storage | 30x faster than AsyncStorage. Synchronous reads via JSI (aligns with New Architecture). Use for: user preferences, streak data, onboarding completion, font size settings. NOT for vocabulary data (that's SQLite). Requires dev client (not Expo Go), which is fine since Drizzle also requires it. | HIGH |
### Navigation
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Navigation | 7.x | Screen navigation | Stable, well-documented, pairs with Expo SDK 55. Bottom tabs + stack navigator matches the app's tab-based design (Journey, Practice, Progress, Profile). v8 is alpha -- not production-ready. | HIGH |
| @react-navigation/bottom-tabs | ~7.x | Tab bar | Native bottom tab bar. Handles the 4-tab layout. | HIGH |
| @react-navigation/native-stack | ~7.x | Stack screens | Native stack transitions for drill-down screens (Level Detail, Quiz, Learn). | HIGH |
### Styling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| NativeWind | v5 | Utility-first styling | Built on Tailwind CSS v4.1+. Utility classes for rapid UI development. Dark mode support built-in (critical for the dark-theme design). CSS variables for the green accent color system. Requires React Native 0.81+ (we have 0.83). | MEDIUM |
| Tailwind CSS | v4.1+ | Style engine | Required by NativeWind v5. PostCSS-based. | MEDIUM |
### Arabic Text & RTL
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| expo-font | ~13.x | Custom Arabic fonts | Config plugin embeds fonts at build time (no async loading flash). Supports `.ttf` and `.otf`. | HIGH |
| @expo-google-fonts/noto-kufi-arabic | latest | Arabic typography | Clean, readable Arabic font from Google Fonts. Pre-packaged for Expo. Consider also bundling Amiri or Scheherazade New for Quranic text specifically. | MEDIUM |
| I18nManager | built-in | RTL layout | React Native built-in. Use `I18nManager.forceRTL()` selectively for Arabic text containers, NOT globally (app UI should remain LTR for English-speaking users who read Arabic script). | HIGH |
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
# Create project with Expo SDK 55
# Core data layer
# State management
# Navigation
# Styling
# Animations & interactions
# Fonts
# Asset bundling (for pre-built SQLite DB)
# Dev tools
# Testing (ships with Expo but verify)
## Key Configuration Notes
## Version Pinning Strategy
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
