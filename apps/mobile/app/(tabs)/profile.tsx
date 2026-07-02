import { Ionicons } from '@expo/vector-icons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SignInScreen from '../components/SignInScreen';
import { useTeams } from '../contexts/TeamContext';
import { ThemeMode, useTheme } from '../contexts/ThemeContext';
import useAuth from '../hooks/useAuth';
import { updateLanguage } from '../services/users.service';
import { createThemedStyleSheet } from '../theme/createThemedStyleSheet';
import { palette, radius, shadow } from '../theme/design';
import showErrorToast from '../utils/toast';
import {
  DEFAULT_POOL_DEFAULTS,
  PoolDefaults,
  readPoolDefaults,
  writePoolDefaults,
} from '../../src/utils/poolDefaults';

type LanguageCode = 'es' | 'en';

const LANGUAGES: Array<{ code: LanguageCode; labelKey: string; flag: string }> =
  [
    { code: 'es', labelKey: 'language.spanish', flag: '🇪🇸' },
    { code: 'en', labelKey: 'language.english', flag: '🇬🇧' },
  ];

let UIStepper: any = null;
if (Platform.OS !== 'web') {
  try {
    UIStepper = require('react-native-ui-stepper').default;
  } catch {
    UIStepper = null;
  }
}

export default function ProfileScreen() {
  const { i18n, t } = useTranslation();
  const { theme, isDark, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const {
    user,
    loading: authLoading,
    signingIn,
    signInWithGoogle,
    signOut,
    googleAuthEnabled,
    providersLoading,
  } = useAuth();
  const { teams, selectedTeam, selectTeam } = useTeams();
  const [defaults, setDefaults] = useState<PoolDefaults>(
    DEFAULT_POOL_DEFAULTS,
  );

  useEffect(() => {
    let active = true;
    void readPoolDefaults(selectedTeam?.id).then((nextDefaults) => {
      if (active) {
        setDefaults(nextDefaults);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedTeam?.id]);

  const persistDefaults = useCallback(
    async (nextDefaults: PoolDefaults) => {
      setDefaults(nextDefaults);
      if (selectedTeam?.id) {
        await writePoolDefaults(selectedTeam.id, nextDefaults);
      }
    },
    [selectedTeam?.id],
  );

  const handleSelectLanguage = useCallback(
    async (code: LanguageCode) => {
      try {
        await i18n.changeLanguage(code);
        await updateLanguage(code);
      } catch (caughtError) {
        console.error('Failed to change language', caughtError);
        showErrorToast(caughtError);
      }
    },
    [i18n],
  );

  const handleSelectTeam = useCallback(
    (teamId: string) => {
      if (teamId) {
        selectTeam(teamId);
      }
    },
    [selectTeam],
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (caughtError) {
      console.error('Failed to end session', caughtError);
      showErrorToast(caughtError);
    }
  }, [signOut]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingPanel}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.mutedText}>{t('status.preparing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SignInScreen
        signingIn={signingIn}
        providersLoading={providersLoading}
        googleAuthEnabled={googleAuthEnabled}
        onSignIn={signInWithGoogle}
      />
    );
  }

  const currentLanguage = (i18n.language?.slice(0, 2) || 'en') as LanguageCode;
  const themeOptions = [
    { label: t('theme.light'), value: 'light' },
    { label: t('theme.dark'), value: 'dark' },
  ];
  const languageOptions = LANGUAGES.map((language) => ({
    label: `${language.flag} ${t(language.labelKey)}`,
    value: language.code,
  }));
  const teamOptions = teams.map((team) => ({
    label: team.name,
    value: team.id,
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('nav.user')}</Text>
          <Text style={styles.primaryText}>{user.name ?? t('user.anonymous')}</Text>
          {user.email ? <Text style={styles.mutedText}>{user.email}</Text> : null}
        </View>

        <View style={[styles.section, styles.selectSectionTop]}>
          <Text style={styles.sectionTitle}>{t('theme.toggle')}</Text>
          <ProfileSelect
            iconName={isDark ? 'moon' : 'sunny'}
            isDark={isDark}
            options={themeOptions}
            styles={styles}
            title={t('theme.toggle')}
            value={theme}
            onChange={(value) => setThemeMode(value as ThemeMode)}
          />
        </View>

        <View style={[styles.section, styles.selectSectionMiddle]}>
          <Text style={styles.sectionTitle}>{t('language.title')}</Text>
          <ProfileSelect
            iconName="globe-outline"
            isDark={isDark}
            options={languageOptions}
            styles={styles}
            title={t('language.title')}
            value={currentLanguage}
            onChange={(value) =>
              void handleSelectLanguage(value as LanguageCode)
            }
          />
        </View>

        <View style={[styles.section, styles.selectSectionBottom]}>
          <Text style={styles.sectionTitle}>{t('profile.team')}</Text>
          <ProfileSelect
            iconName="people-outline"
            isDark={isDark}
            options={teamOptions}
            styles={styles}
            title={t('profile.team')}
            value={selectedTeam?.id ?? teamOptions[0]?.value ?? ''}
            onChange={handleSelectTeam}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.pool_defaults')}</Text>
          <CounterRow
            label={t('fields.doubles')}
            value={defaults.doubles}
            onChange={(value) =>
              persistDefaults({ ...defaults, doubles: value })
            }
            styles={styles}
          />
          <CounterRow
            label={t('fields.triples')}
            value={defaults.triples}
            onChange={(value) =>
              persistDefaults({ ...defaults, triples: value })
            }
            styles={styles}
          />
          <View style={styles.settingRow}>
            <Text style={styles.rowText}>Elige8</Text>
            <Switch
              value={defaults.elige8}
              onValueChange={(value) =>
                void persistDefaults({ ...defaults, elige8: value })
              }
              thumbColor={
                Platform.OS === 'android'
                  ? defaults.elige8
                    ? palette.accent
                    : palette.backgroundSubtle
                  : undefined
              }
              trackColor={{
                false: palette.borderStrong,
                true: palette.accentSoft,
              }}
            />
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={palette.danger} />
          <Text style={styles.signOutText}>{t('nav.logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const CounterRow = ({
  label,
  value,
  onChange,
  styles,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={styles.settingRow}>
    <Text style={styles.rowText}>{label}</Text>
    {Platform.OS !== 'web' && UIStepper ? (
      <View style={styles.nativeCounter}>
        <UIStepper
          value={value}
          onValueChange={(nextValue: number) => onChange(nextValue)}
          minimumValue={0}
          maximumValue={8}
          steps={1}
          style={{ minWidth: 132 }}
        />
        <Text style={styles.counterValue}>{value}</Text>
      </View>
    ) : (
      <View style={styles.counter}>
        <Pressable
          style={styles.counterButton}
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Text style={styles.counterText}>-</Text>
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable
          style={styles.counterButton}
          onPress={() => onChange(Math.min(8, value + 1))}
        >
          <Text style={styles.counterText}>+</Text>
        </Pressable>
      </View>
    )}
  </View>
);

const ProfileSelect = ({
  iconName,
  isDark,
  options,
  styles,
  title,
  value,
  onChange,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  isDark: boolean;
  options: Array<{ label: string; value: string }>;
  styles: ReturnType<typeof createStyles>;
  title: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  const handleNativeOpen = useCallback(() => {
    if (options.length === 0) {
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...options.map((option) => option.label), t('actions.cancel')],
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          const option = options[buttonIndex];
          if (option) {
            onChange(option.value);
          }
        },
      );
      return;
    }

    Alert.alert(
      title,
      undefined,
      [
        ...options.map((option) => ({
          text: option.label,
          onPress: () => onChange(option.value),
        })),
        { text: t('actions.cancel'), style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  }, [onChange, options, t, title]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webSelectContainer}>
        <Pressable
          disabled={options.length === 0}
          onPress={() => setOpen((current) => !current)}
          style={styles.webSelectButton}
        >
          <Ionicons name={iconName} size={18} color={palette.primary} />
          <Text style={styles.webSelectValue} numberOfLines={1}>
            {selectedOption?.label ?? ''}
          </Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={17}
            color={isDark ? palette.darkMuted : palette.inkMuted}
          />
        </Pressable>

        {open ? (
          <View style={styles.webSelectMenu}>
            {options.map((option) => {
              const active = option.value === value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setOpen(false);
                    onChange(option.value);
                  }}
                  style={[
                    styles.webSelectMenuItem,
                    active && styles.webSelectMenuItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.webSelectMenuItemText,
                      active && styles.webSelectMenuItemTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      disabled={options.length === 0}
      onPress={handleNativeOpen}
      style={({ pressed }) => [
        styles.nativeSelectButton,
        pressed && styles.nativeSelectButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Ionicons name={iconName} size={18} color={palette.primary} />
      <Text style={styles.nativeSelectValue} numberOfLines={1}>
        {selectedOption?.label ?? ''}
      </Text>
      <Ionicons
        name="chevron-down"
        size={17}
        color={isDark ? palette.darkMuted : palette.inkMuted}
      />
    </Pressable>
  );
};

const createStyles = (isDark = false) =>
  createThemedStyleSheet(
    {
      safeArea: {
        flex: 1,
        backgroundColor: palette.background,
      },
      content: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 110,
        gap: 14,
      },
      section: {
        position: 'relative',
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 14,
        gap: 10,
        overflow: 'visible',
        ...shadow.card,
      },
      selectSectionTop: {
        zIndex: 40,
      },
      selectSectionMiddle: {
        zIndex: 30,
      },
      selectSectionBottom: {
        zIndex: 20,
      },
      sectionTitle: {
        color: palette.ink,
        fontSize: 16,
        fontWeight: '800',
      },
      primaryText: {
        color: palette.ink,
        fontSize: 15,
        fontWeight: '700',
      },
      mutedText: {
        color: palette.inkMuted,
        fontSize: 14,
      },
      rowButton: {
        minHeight: 44,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      },
      rowButtonActive: {
        borderColor: palette.primary,
        backgroundColor: palette.primarySofter,
      },
      rowText: {
        flex: 1,
        color: palette.ink,
        fontSize: 15,
        fontWeight: '700',
      },
      nativeSelectButton: {
        minHeight: 46,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      },
      nativeSelectButtonPressed: {
        opacity: 0.72,
      },
      nativeSelectValue: {
        flex: 1,
        minWidth: 0,
        color: palette.ink,
        fontSize: 15,
        fontWeight: '800',
      },
      webSelectContainer: {
        position: 'relative',
        zIndex: 50,
      },
      webSelectButton: {
        minHeight: 46,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      },
      webSelectValue: {
        flex: 1,
        minWidth: 0,
        color: palette.ink,
        fontSize: 15,
        fontWeight: '800',
      },
      webSelectMenu: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.surface,
        padding: 6,
        shadowColor: palette.black,
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
        zIndex: 1200,
      },
      webSelectMenuItem: {
        minHeight: 38,
        borderRadius: radius.sm,
        paddingHorizontal: 10,
        paddingVertical: 8,
        justifyContent: 'center',
      },
      webSelectMenuItemActive: {
        backgroundColor: palette.primarySoft,
      },
      webSelectMenuItemText: {
        color: palette.ink,
        fontSize: 14,
        fontWeight: '600',
      },
      webSelectMenuItemTextActive: {
        color: palette.primary,
        fontWeight: '800',
      },
      segmentedRow: {
        flexDirection: 'row',
        gap: 8,
      },
      segmentButton: {
        flex: 1,
        minHeight: 42,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
      },
      segmentActive: {
        borderColor: palette.primary,
        backgroundColor: palette.primarySofter,
      },
      segmentText: {
        color: palette.ink,
        fontSize: 14,
        fontWeight: '700',
      },
      segmentTextActive: {
        color: palette.primary,
      },
      list: {
        gap: 8,
      },
      createTeamRow: {
        flexDirection: 'row',
        gap: 8,
      },
      textInput: {
        flex: 1,
        minHeight: 44,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        backgroundColor: palette.backgroundElevated,
        color: palette.ink,
        paddingHorizontal: 12,
        fontSize: 15,
        fontWeight: '600',
      },
      primaryButton: {
        minWidth: 44,
        minHeight: 44,
        borderRadius: radius.md,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      settingRow: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      },
      counter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radius.md,
        overflow: 'hidden',
      },
      nativeCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      },
      counterButton: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surfaceMuted,
      },
      counterText: {
        color: palette.ink,
        fontSize: 18,
        fontWeight: '800',
      },
      counterValue: {
        width: 40,
        color: palette.ink,
        fontSize: 15,
        fontWeight: '800',
        textAlign: 'center',
      },
      signOutButton: {
        minHeight: 48,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: palette.dangerSoft,
        backgroundColor: palette.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      },
      signOutText: {
        color: palette.danger,
        fontSize: 15,
        fontWeight: '800',
      },
      loadingPanel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      },
    },
    isDark,
  );
