import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <WebDbGate>
          <AppContent />
        </WebDbGate>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider
        databaseName="kalima.db"
        assetSource={{ assetId: require('./assets/db/kalima.db') }}
        options={{ enableChangeListener: true }}
      >
        <NativeDbGate>
          <AppContent />
        </NativeDbGate>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
