import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Tabs: undefined;
  WordCard: { levelId: number; levelName: string };
  PracticeSession: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Placeholder screens - will be replaced by Plans 02 and 03
function WordCardPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Word Card</Text>
    </View>
  );
}

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
      <RootStack.Screen name="WordCard" component={WordCardPlaceholder} />
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
