import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../contexts/ThemeContext';
import GoogleIcon from './GoogleIcon';
import Logo from './Logo';

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
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const canUseGoogle = googleAuthEnabled && !providersLoading;

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#111827' : '#f4f6fb' },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? 'rgba(23, 32, 51, 0.9)'
              : 'rgba(255, 255, 255, 0.88)',
            borderColor: isDark ? '#2c3a55' : '#dbe2f2',
          },
        ]}
      >
        <View style={styles.header}>
          <Logo size={92} />
          <Text
            style={[styles.eyebrow, { color: isDark ? '#aeb8d0' : '#6f7a9b' }]}
          >
            {t('login.eyebrow')}
          </Text>
          <Text
            style={[styles.title, { color: isDark ? '#f8fafc' : '#1a1f36' }]}
          >
            {t('login.title')}
          </Text>
          <Text
            style={[styles.tagline, { color: isDark ? '#c8d1e4' : '#626e91' }]}
          >
            {t('login.tagline')}
          </Text>
        </View>

        {!providersLoading && !googleAuthEnabled ? (
          <View
            role="alert"
            style={[
              styles.warning,
              {
                backgroundColor: isDark ? '#3b2230' : '#fff2f2',
                borderColor: isDark ? '#7f3448' : '#f3b8c0',
              },
            ]}
          >
            <Text
              style={[
                styles.warningText,
                { color: isDark ? '#ffd7df' : '#9f1d35' },
              ]}
            >
              {t('auth.google_unavailable')}
            </Text>
          </View>
        ) : null}

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
            {signingIn ? (
              <ActivityIndicator size="small" color="#4A1A7A" />
            ) : (
              <GoogleIcon size={18} />
            )}
          </View>
          <Text style={styles.buttonText}>
            {signingIn ? t('auth.connecting') : t('auth.sign_in_google')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.terms, { color: isDark ? '#8f9bb5' : '#7b86a5' }]}>
          {t('login.terms')}
        </Text>
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
  card: {
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 38,
    alignItems: 'center',
    gap: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
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
    borderRadius: 8,
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
    borderRadius: 8,
    backgroundColor: '#4A1A7A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
    shadowColor: '#4A1A7A',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
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
