import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { serifFamily } from '../theme/typography';
import { HomeScreen } from '../screens/HomeScreen';
import { LevelListScreen } from '../screens/learn/LevelListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type BottomTabParamList = {
  Home: undefined;
  Learn: undefined;
  You: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home',                 inactive: 'home-outline' },
  Learn: { active: 'book',                inactive: 'book-outline' },
  You:  { active: 'person-circle',        inactive: 'person-circle-outline' },
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Learn" component={LevelListScreen} options={{ title: 'Learn' }} />
      <Tab.Screen name="You" component={ProfileScreen} options={{ title: 'You' }} />
    </Tab.Navigator>
  );
}
