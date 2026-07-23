import { Slot, usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NativeBottomNav, {
  BottomNavTab,
} from '../components/NativeBottomNav';
import { useTeams } from '../contexts/TeamContext';
import useAuth from '../hooks/useAuth';

export default function TabsLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTeam } = useTeams();
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'web' || !user || !selectedTeam) {
    return <Slot />;
  }

  const selectedTab = getSelectedTab(pathname);
  const navHeight =
    Platform.OS === 'ios' ? 49 + insets.bottom : 68 + insets.bottom;

  return (
    <View style={styles.shell}>
      <View style={styles.content}>
        <Slot />
      </View>
      <NativeBottomNav
        availablePoolsTitle={t('mobile_tabs.available_pools')}
        poolsTitle={t('mobile_tabs.pools')}
        profileTitle={t('tabs.profile')}
        selectedTab={selectedTab}
        style={[styles.bottomNav, { height: navHeight }]}
        statsTitle={t('tabs.stats')}
        onSelect={(tab) => {
          if (tab === selectedTab) {
            return;
          }

          router.replace(tabRoutes[tab] as Href);
        }}
      />
    </View>
  );
}

const tabRoutes: Record<BottomNavTab, string> = {
  'available-pools': '/(tabs)/available-pools',
  pools: '/(tabs)/pools',
  stats: '/(tabs)/stats',
  profile: '/(tabs)/profile',
};

const getSelectedTab = (pathname: string): BottomNavTab => {
  if (pathname.startsWith('/available-pools')) {
    return 'available-pools';
  }

  if (pathname.startsWith('/stats')) {
    return 'stats';
  }

  if (pathname.startsWith('/profile')) {
    return 'profile';
  }

  return 'pools';
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    minHeight: 0,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  shell: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
