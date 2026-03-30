import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { WordCardScreen } from '../screens/learn/WordCardScreen';
import { PracticeSessionScreen } from '../screens/practice/PracticeSessionScreen';

export type RootStackParamList = {
  Tabs: undefined;
  WordCard: { levelId: number; levelName: string };
  PracticeSession: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={BottomTabNavigator} />
      <RootStack.Screen name="WordCard" component={WordCardScreen} options={{ headerShown: true }} />
      <RootStack.Screen
        name="PracticeSession"
        component={PracticeSessionScreen}
        options={{ headerShown: true }}
      />
    </RootStack.Navigator>
  );
}
