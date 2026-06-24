import { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import LanguagePicker from '../components/LanguagePicker';
import SignInScreen from '../components/SignInScreen';
import useAuth from '../hooks/useAuth';
import sharedStyles from '../index.styles';
import showErrorToast from '../utils/toast';

const ProfileScreen = () => {
  const {
    user,
    loading,
    signingIn,
    signInWithGoogle,
    signOut,
    googleAuthEnabled,
    providersLoading,
  } = useAuth();

  const { t } = useTranslation();

  const handleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (caughtError) {
      console.error('Google authentication failed', caughtError);
      showErrorToast(caughtError);
    }
  }, [signInWithGoogle]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (caughtError) {
      console.error('Failed to end session', caughtError);
      showErrorToast(caughtError);
    }
  }, [signOut]);

  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.safeArea}>
        <View style={profileStyles.centered}>
          <ActivityIndicator size="large" color="#2d6cdf" />
          <Text style={profileStyles.centeredText}>
            Preparando tu perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={sharedStyles.safeArea}>
        <SignInScreen
          signingIn={signingIn}
          providersLoading={providersLoading}
          googleAuthEnabled={googleAuthEnabled}
          onSignIn={handleSignIn}
        />
      </SafeAreaView>
    );
  }

  const initials =
    user.name?.trim().charAt(0)?.toUpperCase() ??
    user.email?.trim().charAt(0)?.toUpperCase() ??
    '';

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <ScrollView contentContainerStyle={profileStyles.scrollContent}>
        <View style={profileStyles.card}>
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={profileStyles.avatarImage}
            />
          ) : (
            <View style={profileStyles.avatarFallback}>
              <Text style={profileStyles.avatarFallbackLabel}>{initials}</Text>
            </View>
          )}
          <View style={profileStyles.details}>
            <Text style={profileStyles.name}>
              {user.name ?? t('user.anonymous')}
            </Text>
            {user.email ? (
              <Text style={profileStyles.email}>{user.email}</Text>
            ) : null}
          </View>
        </View>
        <View style={profileStyles.settingsCard}>
          <LanguagePicker />
        </View>
        <View style={profileStyles.actions}>
          <TouchableOpacity
            style={profileStyles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <Text style={profileStyles.signOutLabel}>{t('auth.sign_out')}</Text>
          </TouchableOpacity>
          <Text style={profileStyles.hint}>{t('profile.support_hint')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const profileStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  centeredText: {
    fontSize: 16,
    color: '#536089',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d9e2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A1A7A', // Brand purple
  },
  details: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A1A7A', // Brand purple
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#536089',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  signOutButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#d14c4c',
  },
  signOutLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  hint: {
    fontSize: 14,
    color: '#6f7a9b',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A1A7A', // Brand purple
  },
  updatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  updatingText: {
    fontSize: 14,
    color: '#536089',
  },
});

export default ProfileScreen;
