import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider } from 'expo-sqlite';
import { colors } from './src/theme/colors';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';

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
        <AppContent />
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
