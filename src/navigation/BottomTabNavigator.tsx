import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { serifFamily } from '../theme/typography';
import { JourneyScreen } from '../screens/JourneyScreen';
import { TodayHomeScreen } from '../screens/today/TodayHomeScreen';
import { LevelListScreen } from '../screens/learn/LevelListScreen';
import { PracticeHomeScreen } from '../screens/practice/PracticeHomeScreen';
import { QuizHomeScreen } from '../screens/quiz/QuizHomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type BottomTabParamList = {
  Journey: undefined;
  Learn: undefined;
  Today: undefined;
  Practice: undefined;
  Quiz: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Journey:  { active: 'compass',        inactive: 'compass-outline' },
  Today:    { active: 'today',          inactive: 'today-outline' },
  Learn:    { active: 'book',           inactive: 'book-outline' },
  Practice: { active: 'refresh-circle', inactive: 'refresh-circle-outline' },
  Quiz:     { active: 'help-circle',    inactive: 'help-circle-outline' },
  Profile:  { active: 'person-circle',  inactive: 'person-circle-outline' },
};

export function BottomTabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.action.action,
        tabBarInactiveTintColor: theme.text.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surfaces.surface,
          borderTopColor: theme.surfaces.border,
        },
        headerStyle: {
          backgroundColor: theme.surfaces.background,
        },
        headerTintColor: theme.text.textPrimary,
        headerTitleStyle: { fontFamily: serifFamily, color: theme.text.textPrimary },
        headerShadowVisible: false,
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={TodayHomeScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Learn" component={LevelListScreen} />
      <Tab.Screen name="Practice" component={PracticeHomeScreen} />
      <Tab.Screen name="Quiz" component={QuizHomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
