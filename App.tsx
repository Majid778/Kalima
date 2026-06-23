import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { colors } from './src/theme/colors';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';
import { setDb } from './src/data/database';
import { initInstrumentationRuntime } from './src/services/instrumentationRuntime';
import { useTheme } from './src/theme/useTheme';
import { useSettingsStore } from './src/stores/settingsStore';

// Only import expo-sqlite on native platforms
let SQLiteProvider: any;
let useSQLiteContext: any;
if (Platform.OS !== 'web') {
  const sqlite = require('expo-sqlite');
  SQLiteProvider = sqlite.SQLiteProvider;
  useSQLiteContext = sqlite.useSQLiteContext;
}

// Web preview only: render the app inside a centered phone-sized device frame so
// it reads like the mockup instead of stretching full-bleed across the browser.
// On a narrow viewport (a real phone) the frame fills the screen with no chrome.
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('kalima-phone-frame')) {
  const style = document.createElement('style');
  style.id = 'kalima-phone-frame';
  style.textContent = `
    html, body { height: 100%; margin: 0; }
    body { overflow: hidden; background: #2f3239; display: flex; align-items: center; justify-content: center; }
    #root {
      flex: none;
      width: min(430px, 100vw);
      height: min(100vh, 924px);
      border-radius: 42px;
      overflow: hidden;
      box-shadow: 0 26px 70px rgba(0,0,0,0.5);
      display: flex;
    }
    @media (max-width: 480px) {
      body { background: #f3ead4; }
      #root { width: 100vw; height: 100%; border-radius: 0; box-shadow: none; }
    }
  `;
  document.head.appendChild(style);
}

// Navigation chrome (header bar, screen background) follows the active app theme,
// so the header is parchment in the Mushaf theme and dark in the dark alternate.
function AppContent() {
  const t = useTheme();
  const themeName = useSettingsStore((s) => s.theme);
  const navTheme = {
    ...DefaultTheme,
    dark: themeName === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: t.action.action,
      background: t.surfaces.background,
      card: t.surfaces.background,
      text: t.text.textPrimary,
      border: t.surfaces.border,
      notification: t.action.action,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <RootStackNavigator />
    </NavigationContainer>
  );
}

// Initializes the shared `db` singleton from the SQLiteProvider's connection
// (which has already copied the bundled asset) and holds rendering until it's
// ready, so no screen mounts against an uninitialized/empty database.
function NativeDbGate({ children }: { children: React.ReactNode }) {
  const sqlite = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(sqlite);
    const now = new Date().toISOString();
    const localDate = now.split('T')[0];
    initInstrumentationRuntime(now, localDate);
    setReady(true);
  }, [sqlite]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

// Web-only initialization gate — loads the bundled DB via sql.js (async),
// seeds the streak store, then holds rendering until ready (mirrors NativeDbGate).
function seedWebStreak(): void {
  const { computeLongest, computeStreak, useStreakStore } = require('./src/stores/streakStore');
  const state = useStreakStore.getState();
  if (Object.keys(state.activityDates).length > 0) return;
  const localDate = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  };
  const today = localDate();
  const activityDates: Record<string, number> = {};
  for (let offset = -4; offset <= 0; offset += 1) activityDates[localDate(offset)] = offset === 0 ? 2 : 1;
  useStreakStore.setState({
    activityDates,
    currentStreak: computeStreak(activityDates, today),
    longestStreak: computeLongest(activityDates),
    graceTokens: 1,
    lastActivityDate: today,
    // Pre-mark milestones at/below the seeded comprehension % so the reverent
    // MilestoneMoment doesn't auto-fire on every preview load.
    celebratedMilestones: [0.25, 0.5],
  });
}

function WebDbGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const { initializeDatabase } = require('./src/data/database');
    initializeDatabase()
      .then(() => {
        seedWebStreak();
        const now = new Date().toISOString();
        initInstrumentationRuntime(now, now.split('T')[0]);
        if (mounted) setReady(true);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#ef4444', fontSize: 15, textAlign: 'center' }}>Database error: {error.message}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

// Font loading gate
function FontGate({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          PlusJakartaSans_400Regular: require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_400Regular,
          PlusJakartaSans_500Medium: require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_500Medium,
          PlusJakartaSans_600SemiBold: require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_600SemiBold,
          PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_700Bold,
          PlusJakartaSans_800ExtraBold: require('@expo-google-fonts/plus-jakarta-sans').PlusJakartaSans_800ExtraBold,
          NotoNaskhArabic_400Regular: require('@expo-google-fonts/noto-naskh-arabic').NotoNaskhArabic_400Regular,
          NotoNaskhArabic_700Bold: require('@expo-google-fonts/noto-naskh-arabic').NotoNaskhArabic_700Bold,
        });
        if (mounted) setFontsLoaded(true);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    loadFonts();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#ef4444', fontSize: 15, textAlign: 'center' }}>Font loading error: {error.message}</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FontGate>
          <WebDbGate>
            <AppContent />
          </WebDbGate>
        </FontGate>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FontGate>
        <SQLiteProvider
          databaseName="kalima.db"
          assetSource={{ assetId: require('./assets/db/kalima.db') }}
          options={{ enableChangeListener: true }}
        >
          <NativeDbGate>
            <AppContent />
          </NativeDbGate>
        </SQLiteProvider>
      </FontGate>
    </GestureHandlerRootView>
  );
}
