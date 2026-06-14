# Kalima v2.0 — Device "Feels Premium" Pass (the one gate an agent can't clear)

The code is complete and green (`tsc` clean, `jest` 214/214). The remaining ship gate is the GOAL's **Quality Bar on a low-end Android device** — a subjective, hardware + human-perception check. This runbook turns it into a concrete checklist.

## 1. Build a dev client (one-time; picks up the new native modules)
The recovery added `expo-audio` + `expo-notifications`, which need a native rebuild before they work.

```bash
cd ~/Documents/GitHub/Kalima
npm install --ignore-scripts          # better-sqlite3 devDep breaks node-gyp otherwise
npx expo prebuild --clean             # regenerate android/ with the new native modules
# launch the AVD with hardware GL (software GL is unusable + breaks adb taps):
emulator -avd Kalima -gpu host &
npx expo run:android                  # build + install the dev client
```
If `expo run:android` build fails, open `android/` in Android Studio and build there (JDK17, cmdline-tools, API36).

## 2. Smoke test (does it run? — catches runtime bugs tsc/jest can't)
The repo's history had 3 runtime bugs invisible to type-check + passing tests, so verify the boot path:
- [ ] App launches past the splash/`DbGate` (bundled `kalima.db` loads; no white screen).
- [ ] **First-win onboarding** appears on a fresh install → real word in a real āyah → answer → reveal meaning/root → gold celebration → level pick → lands on the tabs.
- [ ] **Today tab** → start a session → cards advance, swipe-to-grade works, mistake modal on "Again", session completes → result recap.
- [ ] Tap an example āyah's **play button** (audio) and **tap the highlighted word** (word audio) — confirm the everyayah / quran.com-WBW URLs actually resolve on device (if silent, the CDN format may need adjusting in `src/services/audio/audioSource.ts`).
- [ ] **Reader**, **Learn path (winding stations)**, **Journey** (% hero + milestone), **Profile** (theme toggle, reciter, auto-play, notifications, backup/restore) all open without crashing.

## 3. The "feels premium" checklist (the actual Quality-Bar gate)
On the low-end Android device, judge each — this is the subjective pass only a human can make:
- [ ] **60fps floor** on the Learn winding-path scroll + the Today card stack (no jank). Profile in Android Studio if unsure.
- [ ] **Swipe-to-grade** follows the finger 1:1, springs back below threshold, flies off + advances above it — interruptible (a tap mid-animation responds instantly).
- [ ] **Card reveal** cross-fade is smooth; **shrinking pile** + **skeletons** (not spinners) on load.
- [ ] The **current station breathes**; **parallax** backdrop on scroll; press→enter feels responsive.
- [ ] **Milestone moment** feels reverent (gold, soft haptic, calm) — not a casino pop.
- [ ] **Light "mushaf" theme** is as polished as dark (toggle in Profile); **RTL** āyāt read correctly right-to-left; Uthmanic font renders.
- [ ] **Haptics** fire on grade / reveal / milestone; pressed/disabled states on every control.
- [ ] Toggle **reduce-motion** (OS setting) → animations degrade gracefully to instant.

## 4. If something fails
- Runtime crash / wrong behavior → note the screen + repro; it's a code fix (the logic is in `src/screens/today/TodaySessionScreen.tsx`, `src/services/*`).
- Audio silent → verify/adjust the CDN URL formats in `src/services/audio/audioSource.ts` (`ayahAudioUrl` / `wbwAudioUrl`).
- Jank → profile and tune the Reanimated configs (`src/theme/motion.ts` `SPRINGS`).

Once this checklist passes, v2.0 has met its definition of done. Push to a remote when you're ready to publish. Cloud accounts/sync are intentionally v2.1 (see GOAL.md).
