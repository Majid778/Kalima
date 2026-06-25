import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { WordCardScreen } from '../screens/learn/WordCardScreen';
import { QuizSessionScreen } from '../screens/quiz/QuizSessionScreen';
import { QuizResultScreen } from '../screens/quiz/QuizResultScreen';
import { useOnboardingStore } from '../stores/onboardingStore';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { TodaySessionScreen } from '../screens/today/TodaySessionScreen';
import { TodayResultScreen } from '../screens/today/TodayResultScreen';
import { ReaderScreen } from '../screens/reader/ReaderScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CoverageGaugeScreen } from '../screens/coverage/CoverageGaugeScreen';
import { NowPlayingScreen } from '../screens/audio/NowPlayingScreen';
import type { NowPlayingParams } from '../screens/audio/NowPlayingScreen';
import { MilestonesScreen } from '../screens/MilestonesScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  Settings: undefined;
  WordCard: { levelId: number; levelName: string };
  QuizSession: { levelId: number; levelName: string };
  QuizResult: { levelId: number; levelName: string; score: number; total: number };
  TodaySession: undefined;
  TodayResult: {
    sessionWordsShown?: number;
    comprehensionBefore?: number;
  };
  Reader: undefined;
  CoverageGauge: undefined;
  NowPlaying: NowPlayingParams;
  Milestones: undefined;
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
      <RootStack.Screen name="WordCard" component={WordCardScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="QuizSession" component={QuizSessionScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="QuizResult" component={QuizResultScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="TodaySession" component={TodaySessionScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="TodayResult" component={TodayResultScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="CoverageGauge" component={CoverageGaugeScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="NowPlaying" component={NowPlayingScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Milestones" component={MilestonesScreen} options={{ headerShown: false }} />
    </RootStack.Navigator>
  );
}
