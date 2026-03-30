import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { WordCardScreen } from '../screens/learn/WordCardScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Tabs: undefined;
  WordCard: { levelId: number; levelName: string };
  PracticeSession: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Placeholder - will be replaced by Plan 03
function PracticeSessionPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Practice Session</Text>
    </View>
  );
}

export function RootStackNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={BottomTabNavigator} />
      <RootStack.Screen name="WordCard" component={WordCardScreen} options={{ headerShown: true }} />
      <RootStack.Screen name="PracticeSession" component={PracticeSessionPlaceholder} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text,
    fontSize: 18,
  },
});
