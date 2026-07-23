import { useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../contexts/ThemeContext';
import { palette, radius, shadow } from '../theme/design';
import GoogleIcon from './GoogleIcon';
import Logo from './Logo';
import NativeButton from './NativeButton';
import NativeSelect from './NativeSelect';

type LanguageCode = 'es' | 'en';

const LANGUAGES: Array<{ code: LanguageCode; labelKey: string; flag: string }> =
  [
    { code: 'es', labelKey: 'language.spanish', flag: '🇪🇸' },
    { code: 'en', labelKey: 'language.english', flag: '🇬🇧' },
  ];

interface SignInScreenProps {
  signingIn: boolean;
  providersLoading: boolean;
  googleAuthEnabled: boolean;
  onSignIn: () => void;
}

const SignInScreen = ({
  signingIn,
  providersLoading,
  googleAuthEnabled,
  onSignIn,
}: SignInScreenProps) => {
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const canUseGoogle = googleAuthEnabled && !providersLoading;
  const currentLanguage = (i18n.language?.slice(0, 2) || 'en') as LanguageCode;
  const currentLanguageOption =
    LANGUAGES.find((language) => language.code === currentLanguage) ??
    LANGUAGES[0];

  const handleLanguageSelect = useCallback(
    (language: LanguageCode) => {
      if (language !== currentLanguage) {
        void i18n.changeLanguage(language);
      }
    },
    [currentLanguage, i18n],
  );

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: isDark ? palette.darkBackground : palette.background,
        },
      ]}
    >
      {Platform.OS !== 'web' ? (
        <View
          style={[
            styles.languageButtonShell,
            {
              top: insets.top + 12,
              backgroundColor: isDark ? palette.darkSurface : palette.surface,
              borderColor: isDark ? palette.darkBorder : palette.border,
            },
          ]}
        >
          <NativeSelect
            title={t('language.title')}
            placeholder={`${currentLanguageOption.flag} ${currentLanguage.toUpperCase()}`}
            selectedValue={currentLanguage}
            onChange={(value) => handleLanguageSelect(value as LanguageCode)}
            options={LANGUAGES.map((language) => ({
              label: `${language.flag} ${t(language.labelKey)}`,
              value: language.code,
            }))}
            style={styles.languageNativeSelect}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? palette.darkSurface : palette.surface,
            borderColor: isDark ? palette.darkBorder : palette.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Logo size={92} />
          <Text
            style={[
              styles.eyebrow,
              { color: isDark ? palette.darkMuted : palette.primary },
            ]}
          >
            {t('login.eyebrow')}
          </Text>
        </View>

        {!providersLoading && !googleAuthEnabled ? (
          <View
            role="alert"
            style={[
              styles.warning,
              {
                backgroundColor: isDark ? '#3B2422' : palette.dangerSoft,
                borderColor: isDark ? '#7F3A35' : '#F0B8B2',
              },
            ]}
          >
            <Text
              style={[
                styles.warningText,
                { color: isDark ? '#FFD8D4' : palette.danger },
              ]}
            >
              {t('auth.google_unavailable')}
            </Text>
          </View>
        ) : null}

        {Platform.OS === 'web' ? (
          <TouchableOpacity
            style={[
              styles.button,
              (signingIn || !canUseGoogle) && styles.buttonDisabled,
            ]}
            onPress={onSignIn}
            disabled={signingIn || !canUseGoogle}
            activeOpacity={0.86}
          >
            <View style={styles.buttonIcon}>
              <GoogleIcon size={18} />
            </View>
            <Text style={styles.buttonText}>
              {signingIn ? t('auth.connecting') : t('auth.sign_in_google')}
            </Text>
          </TouchableOpacity>
        ) : (
          <NativeButton
            title={signingIn ? t('auth.connecting') : t('auth.sign_in_google')}
            onPress={onSignIn}
            disabled={signingIn || !canUseGoogle}
            style={styles.nativeSignInButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 560,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  languageButtonShell: {
    position: 'absolute',
    right: 18,
    minWidth: 76,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
    zIndex: 2,
  },
  languageNativeSelect: {
    width: 122,
    height: 36,
  },
  nativeSignInButton: {
    width: '100%',
    height: 52,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 32,
    paddingVertical: 38,
    alignItems: 'center',
    gap: 24,
    ...shadow.raised,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  eyebrow: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 340,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    maxWidth: 360,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  warning: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
    shadowColor: palette.primary,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  terms: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default SignInScreen;
