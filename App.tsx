import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { colors } from './src/theme/colors';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';
import { setDb } from './src/data/database';
import { initInstrumentationRuntime } from './src/services/instrumentationRuntime';

const KalimaTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,         // #4ade80
    background: colors.background,   // #0a0a0a
    card: colors.surface,            // #1a1a1a
    text: colors.text,               // #FFFFFF
    border: colors.border,           // #27272a
    notification: colors.primary,    // #4ade80
  },
};

function AppContent() {
  return (
    <NavigationContainer theme={KalimaTheme}>
      <RootStackNavigator />
    </NavigationContainer>
  );
}

// Initializes the shared `db` singleton from the SQLiteProvider's connection
// (which has already copied the bundled asset) and holds rendering until it's
// ready, so no screen mounts against an uninitialized/empty database.
function DbGate({ children }: { children: React.ReactNode }) {
  const sqlite = useSQLiteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(sqlite);
    // Initialize the instrumentation runtime before any screen mounts, so
    // session/event calls (TodaySessionScreen et al.) don't throw on launch.
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

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContent />
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
        <DbGate>
          <AppContent />
        </DbGate>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
