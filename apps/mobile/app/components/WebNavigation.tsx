import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import { updateLanguage } from '../services/users.service';
import showErrorToast from '../utils/toast';
import Logo from './Logo';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type NavigationPath = '/pools' | '/stats';
type Dropdown = 'language' | 'user' | null;
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
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState<Dropdown>(null);

  if (Platform.OS !== 'web') {
    return null;
  }

  const navigationItems = useMemo<Array<{
    name: string;
    path: NavigationPath;
    icon: IconName;
    activeIcon: IconName;
  }>>(
    () => [
      {
        name: t('tabs.pools'),
        path: '/pools',
        icon: 'trophy-outline',
        activeIcon: 'trophy',
      },
      {
        name: t('tabs.stats'),
        path: '/stats',
        icon: 'stats-chart-outline',
        activeIcon: 'stats-chart',
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

  const handleSignOut = useCallback(async () => {
    setOpenDropdown(null);
    try {
      await signOut();
    } catch (caughtError) {
      console.error('Failed to end session', caughtError);
      showErrorToast(caughtError);
    }
  }, [signOut]);

  const currentLanguage = (i18n.language?.slice(0, 2) || 'en') as LanguageCode;
  const iconColor = isDark ? '#f8fafc' : '#4A1A7A';
  const mutedIconColor = isDark ? '#aeb8d0' : '#6f7a9b';
  const menuBackground = isDark ? '#172033' : '#ffffff';
  const menuBorder = isDark ? '#2c3a55' : '#dbe2f2';
  const menuText = isDark ? '#f8fafc' : '#1a1f36';
  const mutedText = isDark ? '#aeb8d0' : '#626e91';
  const activeBackground = isDark ? '#2d2147' : '#f5f2ff';
  const initials =
    user?.name?.trim().charAt(0)?.toUpperCase() ??
    user?.email?.trim().charAt(0)?.toUpperCase() ??
    '';

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
          backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
          borderBottomColor: isDark ? '#26344e' : '#e1e6f9',
        },
      ]}
    >
      <View style={styles.leftCluster}>
        <TouchableOpacity
          style={styles.brandButton}
          onPress={() => handleNavigation('/pools')}
          activeOpacity={0.75}
        >
          <Logo size={32} />
          <Text style={[styles.brandText, { color: iconColor }]}>Kini</Text>
        </TouchableOpacity>

        {user ? (
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

      <View style={styles.actionSection}>
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

        {user ? (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                setOpenDropdown((current) =>
                  current === 'user' ? null : 'user',
                )
              }
              activeOpacity={0.72}
              accessibilityLabel={t('nav.user')}
            >
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: isDark ? '#2d2147' : '#d9e2ff' },
                  ]}
                >
                  {initials ? (
                    <Text
                      style={[styles.avatarInitial, { color: iconColor }]}
                    >
                      {initials}
                    </Text>
                  ) : (
                    <Ionicons
                      name="person"
                      size={16}
                      color={iconColor}
                    />
                  )}
                </View>
              )}
            </TouchableOpacity>

            {openDropdown === 'user' ? (
              <View
                style={[
                  styles.dropdown,
                  styles.userDropdown,
                  {
                    backgroundColor: menuBackground,
                    borderColor: menuBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.userSummary,
                    { borderBottomColor: menuBorder },
                  ]}
                >
                  <Text style={[styles.userLabel, { color: mutedText }]}>
                    {t('nav.user')}
                  </Text>
                  <Text style={[styles.userName, { color: menuText }]}>
                    {user.name ?? t('user.anonymous')}
                  </Text>
                  {user.email ? (
                    <Text style={[styles.userEmail, { color: mutedText }]}>
                      {user.email}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    { backgroundColor: 'transparent' },
                  ]}
                  onPress={handleSignOut}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={16}
                    color={menuText}
                  />
                  <Text
                    style={[styles.dropdownItemText, { color: menuText }]}
                  >
                    {t('nav.logout')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: '#f5f2ff',
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
    borderRadius: 18,
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
    borderRadius: 8,
    padding: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    zIndex: 1100,
  },
  userDropdown: {
    minWidth: 224,
  },
  dropdownItem: {
    minHeight: 38,
    borderRadius: 6,
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
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
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
