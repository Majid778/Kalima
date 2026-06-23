import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/useTheme';
import { display } from '../theme/typography';
import { mushafPalette } from '../theme/palette';
import { HomeScreen } from '../screens/HomeScreen';
import { LevelListScreen } from '../screens/learn/LevelListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppIcon } from '../components/AppIcon';

export type BottomTabParamList = {
  Home: undefined;
  Learn: undefined;
  You: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<string, 'home' | 'book' | 'person'> = {
  Home: 'home',
  Learn: 'book',
  You: 'person',
};

export function BottomTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: mushafPalette.gold,
        tabBarInactiveTintColor: mushafPalette.muted,
        tabBarStyle: {
          backgroundColor: mushafPalette.paper,
          borderTopColor: mushafPalette.goldLine,
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarIcon: ({ color }) => {
          const iconName = TAB_ICONS[route.name];
          return <AppIcon name={iconName} size={27} color={color} />;
        },
        tabBarLabel: ({ color }) => (
          <Text style={{ fontSize: 12, fontWeight: '600', color, fontFamily: display.semibold }}>
            {route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LevelListScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
