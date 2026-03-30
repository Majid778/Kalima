import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={KalimaTheme}>
        <RootStackNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
