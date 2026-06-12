import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { WordCardScreen } from '../screens/learn/WordCardScreen';
import { PracticeSessionScreen } from '../screens/practice/PracticeSessionScreen';
import { QuizSessionScreen } from '../screens/quiz/QuizSessionScreen';
import { QuizResultScreen } from '../screens/quiz/QuizResultScreen';
import { useOnboardingStore } from '../stores/onboardingStore';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  WordCard: { levelId: number; levelName: string };
  PracticeSession: undefined;
  QuizSession: { levelId: number; levelName: string };
  QuizResult: { levelId: number; levelName: string; score: number; total: number };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);

  if (!hasOnboarded) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      </RootStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={BottomTabNavigator} />
      <RootStack.Screen name="WordCard" component={WordCardScreen} options={{ headerShown: true }} />
      <RootStack.Screen
        name="PracticeSession"
        component={PracticeSessionScreen}
        options={{ headerShown: true }}
      />
      <RootStack.Screen
        name="QuizSession"
        component={QuizSessionScreen}
        options={{ headerShown: true }}
      />
      <RootStack.Screen
        name="QuizResult"
        component={QuizResultScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
