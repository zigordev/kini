import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { useTeams } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import { updateLanguage } from '../services/users.service';
import { palette, radius, shadow } from '../theme/design';
import showErrorToast from '../utils/toast';
import Logo from './Logo';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type NavigationPath = '/available-pools' | '/pools' | '/stats' | '/profile';
type Dropdown = 'language' | null;
type LanguageCode = 'en' | 'es';

const LANGUAGES: Array<{
  code: LanguageCode;
  labelKey: string;
  flag: string;
}> = [
  { code: 'es', labelKey: 'language.spanish', flag: '🇪🇸' },
  { code: 'en', labelKey: 'language.english', flag: '🇬🇧' },
];

const WebNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const { selectedTeam } = useTeams();
  const { isDark, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState<Dropdown>(null);

  if (Platform.OS !== 'web') {
    return null;
  }

  const navigationItems = useMemo<
    Array<{
      name: string;
      path: NavigationPath;
      icon: IconName;
      activeIcon: IconName;
    }>
  >(
    () => [
      {
        name: t('mobile_tabs.available_pools'),
        path: '/available-pools',
        icon: 'calendar-outline',
        activeIcon: 'calendar',
      },
      {
        name: t('mobile_tabs.pools'),
        path: '/pools',
        icon: 'document-text-outline',
        activeIcon: 'document-text',
      },
      {
        name: t('tabs.stats'),
        path: '/stats',
        icon: 'bar-chart-outline',
        activeIcon: 'bar-chart',
      },
      {
        name: t('tabs.profile'),
        path: '/profile',
        icon: 'person-outline',
        activeIcon: 'person',
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!openDropdown || typeof document === 'undefined') {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openDropdown]);

  const handleNavigation = (path: NavigationPath) => {
    router.push(path as Href);
    setOpenDropdown(null);
  };

  const isActive = (path: string) => {
    const normalize = (p: string) =>
      p.replace('/(tabs)', '').replace(/\/$/, '');
    return normalize(pathname) === normalize(path);
  };

  const handleLanguageSelect = useCallback(
    async (code: LanguageCode) => {
      setOpenDropdown(null);
      if (i18n.language?.slice(0, 2) === code) {
        return;
      }

      try {
        await i18n.changeLanguage(code);
        if (user) {
          await updateLanguage(code);
        }
      } catch (caughtError) {
        console.error('Failed to change language', caughtError);
        showErrorToast(caughtError);
      }
    },
    [i18n, user],
  );

  const currentLanguage = (i18n.language?.slice(0, 2) || 'en') as LanguageCode;
  const iconColor = isDark ? palette.darkInk : palette.primary;
  const mutedIconColor = isDark ? palette.darkMuted : palette.inkMuted;
  const menuBackground = isDark ? palette.darkSurface : palette.surface;
  const menuBorder = isDark ? palette.darkBorder : palette.border;
  const menuText = isDark ? palette.darkInk : palette.ink;
  const mutedText = isDark ? palette.darkMuted : palette.inkMuted;
  const activeBackground = isDark
    ? palette.darkSurfaceMuted
    : palette.primarySoft;
  if (!user) {
    return (
      <View style={styles.signedOutControls}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleTheme}
          activeOpacity={0.72}
          accessibilityLabel={`${t('theme.toggle')}: ${
            isDark ? t('theme.light') : t('theme.dark')
          }`}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={19}
            color={iconColor}
          />
        </TouchableOpacity>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              setOpenDropdown((current) =>
                current === 'language' ? null : 'language',
              )
            }
            activeOpacity={0.72}
            accessibilityLabel={t('nav.language')}
          >
            <Ionicons name="globe-outline" size={22} color={iconColor} />
          </TouchableOpacity>

          {openDropdown === 'language' ? (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: menuBackground,
                  borderColor: menuBorder,
                },
              ]}
            >
              {LANGUAGES.map((language) => {
                const active = language.code === currentLanguage;

                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.dropdownItem,
                      active && { backgroundColor: activeBackground },
                    ]}
                    onPress={() => handleLanguageSelect(language.code)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.flag}>{language.flag}</Text>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: active ? iconColor : menuText },
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {t(language.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? palette.darkBackground : palette.surface,
          borderBottomColor: isDark ? palette.darkBorder : palette.border,
        },
      ]}
    >
      <View style={styles.leftCluster}>
        <TouchableOpacity
          style={styles.brandButton}
          onPress={() =>
            selectedTeam
              ? handleNavigation('/pools')
              : router.push('/teams' as Href)
          }
          activeOpacity={0.75}
        >
          <Logo size={32} />
          <Text style={[styles.brandText, { color: iconColor }]}>Kini</Text>
        </TouchableOpacity>

        {user && selectedTeam ? (
          <View style={styles.navigationSection}>
            {navigationItems.map((item) => {
              const active = isActive(item.path);

              return (
                <TouchableOpacity
                  key={item.path}
                  style={[
                    styles.navItem,
                    active && { backgroundColor: activeBackground },
                  ]}
                  onPress={() => handleNavigation(item.path)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={active ? item.activeIcon : item.icon}
                    size={18}
                    color={active ? iconColor : mutedIconColor}
                  />
                  <Text
                    style={[
                      styles.navText,
                      { color: active ? iconColor : mutedIconColor },
                      active && styles.navTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    ...shadow.card,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(12px)',
  },
  signedOutControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '700',
  },
  navigationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: palette.primarySoft,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
  },
  navTextActive: {
    fontWeight: '600',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 164,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 6,
    ...shadow.raised,
    zIndex: 1100,
  },
  userDropdown: {
    minWidth: 224,
  },
  teamDropdown: {
    minWidth: 236,
  },
  dropdownItem: {
    minHeight: 38,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
  },
  flag: {
    fontSize: 16,
  },
  userSummary: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
    gap: 3,
  },
  userLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
  },
});

export default WebNavigation;
