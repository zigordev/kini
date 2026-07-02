import { Ionicons } from '@expo/vector-icons';
import { Slot } from 'expo-router';
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTeams } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import { palette } from '../theme/design';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedTeam } = useTeams();
  const { isDark } = useTheme();

  if (Platform.OS === 'web' || !user || !selectedTeam) {
    return <Slot />;
  }

  const backgroundColor = isDark ? palette.darkSurface : palette.surface;
  const inactiveColor = isDark ? palette.darkMuted : palette.inkSubtle;

  return (
    <NativeTabs
      backgroundColor={backgroundColor}
      iconColor={{ default: inactiveColor, selected: palette.primary }}
      labelStyle={{
        default: { color: inactiveColor, fontSize: 11, fontWeight: '600' },
        selected: { color: palette.primary, fontSize: 11, fontWeight: '700' },
      }}
      tintColor={palette.primary}
    >
      <NativeTabs.Trigger name="available-pools">
        <Label>{t('mobile_tabs.available_pools')}</Label>
        <Icon
          src={<VectorIcon family={Ionicons} name="calendar-outline" />}
          selectedColor={palette.primary}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pools">
        <Label>{t('mobile_tabs.pools')}</Label>
        <Icon
          src={<VectorIcon family={Ionicons} name="document-text-outline" />}
          selectedColor={palette.primary}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats">
        <Label>{t('tabs.stats')}</Label>
        <Icon
          src={<VectorIcon family={Ionicons} name="bar-chart-outline" />}
          selectedColor={palette.primary}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>{t('tabs.profile')}</Label>
        <Icon
          src={<VectorIcon family={Ionicons} name="person-outline" />}
          selectedColor={palette.primary}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
