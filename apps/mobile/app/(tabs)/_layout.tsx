import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Slot, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import '../i18n';

import useAuth from '../hooks/useAuth';

export default function TabsLayout() {
  // For web, render a simple layout with our custom navigation and the routed content.
  if (Platform.OS === 'web') {
    // Root layout already renders WebNavigation for web; avoid duplicating it here
    return <Slot />;
  }

  // Only access auth on native platforms to avoid any web TDZ/cycle issues
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isAuthenticated = Boolean(user);

  return (
    <Tabs
      key={i18n.language}
      initialRouteName="pools"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Platform.OS === 'ios' ? '#4A1A7A' : '#4A1A7A', // Brand purple
        tabBarInactiveTintColor: Platform.OS === 'ios' ? '#8E8E93' : '#8B7BC7', // More purple, less pink
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: Platform.OS === 'ios' ? '500' : '600',
          marginTop: Platform.OS === 'ios' ? 2 : 0,
        },
        tabBarStyle: {
          display: isAuthenticated ? 'flex' : 'none',
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 2 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="pools"
        options={{
          tabBarLabel: t('tabs.pools'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'trophy' : 'trophy-outline'}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: t('tabs.stats'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      />
    </Tabs>
  );
}
