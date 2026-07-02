import {
  PropsWithChildren,
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  registerPushToken,
  unregisterPushToken,
} from '../services/notifications.service';

import {
  fetchGoogleConfig,
  fetchSessionUser,
  logout as requestLogout,
  exchangeMobileSession,
} from '../services/auth.service';
import type { GoogleConfig } from '../services/auth.service';
import { resolveApiUrl } from '../config/api';
import { AuthenticatedUser } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

export interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  googleAuthEnabled: boolean;
  providersLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig | null>(null);

  const refresh = useCallback(async () => {
    try {
      const sessionUser = await fetchSessionUser();
      setUser(sessionUser);
      if (
        sessionUser &&
        (Platform.OS === 'ios' || Platform.OS === 'android')
      ) {
        try {
          const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            return;
          }
          const projectId =
            (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
            (Constants as any)?.easConfig?.projectId;
          if (!projectId) {
            return;
          }
          const pushToken = (
            await Notifications.getExpoPushTokenAsync({ projectId })
          ).data;
          await registerPushToken(pushToken, Platform.OS);
        } catch (error) {
          // Silently continue without push notifications if they're not available
        }
      }
    } catch (error) {
      console.error('Failed to refresh session', error);
      setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [sessionUser, fetchedGoogleConfig] = await Promise.all([
          fetchSessionUser(),
          fetchGoogleConfig().catch((error) => {
            console.error('Failed to load OAuth config', error);
            return null;
          }),
        ]);
        if (!cancelled) {
          setUser(sessionUser);
          setGoogleConfig(fetchedGoogleConfig);
          setGoogleAuthEnabled(Boolean(fetchedGoogleConfig?.enabled));
        }
      } catch (error) {
        console.error('Failed to bootstrap session', error);
        if (!cancelled) {
          setUser(null);
          setGoogleConfig(null);
          setGoogleAuthEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setProvidersLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void (async () => {
          try {
            await refresh();
          } catch (error) {
            console.error(
              'Failed to refresh session after history navigation',
              error,
            );
          }
        })();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [refresh]);

  const signInWithGoogle = useCallback(async () => {
    if (!googleAuthEnabled) {
      throw new Error('Inicio de sesión con Google no disponible.');
    }

    setSigningIn(true);
    try {
      const envRedirectUri = process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL?.trim();
      const mobileRedirectUri = googleConfig?.mobileRedirectUri?.trim();
      const fallbackWebRedirectUri =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : null;

      const fallbackNativeRedirectUri = AuthSession.makeRedirectUri({
        scheme: 'kini',
        path: 'auth/callback',
        preferLocalhost: true,
      });

      const redirectUri =
        Platform.OS === 'web'
          ? (fallbackWebRedirectUri ??
            envRedirectUri ??
            fallbackNativeRedirectUri)
          : mobileRedirectUri && mobileRedirectUri.length > 0
            ? mobileRedirectUri
            : fallbackNativeRedirectUri;

      const loginUrl = new URL(resolveApiUrl('/auth/google'));
      loginUrl.searchParams.set('redirect_uri', redirectUri);
      loginUrl.searchParams.set('failure_redirect', redirectUri);
      loginUrl.searchParams.set('prompt', 'select_account');

      if (Platform.OS === 'web') {
        window.location.href = loginUrl.toString();
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl.toString(),
        redirectUri,
      );

      if (result.type !== 'success') {
        if (result.type !== 'dismiss') {
        }
        return;
      }

      if (result.url) {
        const callbackUrl = new URL(result.url);
        const errorCode = callbackUrl.searchParams.get('error');
        const mobileToken = callbackUrl.searchParams.get('mobile_token');

        if (errorCode) {
          throw new Error(`Google sign-in failed: ${errorCode}`);
        }

        if (mobileToken && mobileToken.trim().length > 0) {
          await exchangeMobileSession(mobileToken.trim());
        }
      }

      await refresh();

      // Register push token after successful sign-in on mobile
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          const projectId =
            (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
            (Constants as any)?.easConfig?.projectId;
          if (projectId) {
            const { status: existingStatus } =
              await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus === 'granted') {
              const pushToken = (
                await Notifications.getExpoPushTokenAsync({ projectId })
              ).data;
              await registerPushToken(pushToken, Platform.OS);
            }
          }
        } catch (error) {
          // Silently continue without push notifications if they're not available
        }
      }
    } finally {
      setSigningIn(false);
    }
  }, [googleAuthEnabled, googleConfig?.mobileRedirectUri, refresh]);

  const signOut = useCallback(async () => {
    try {
      await requestLogout();
      // Clean up push token on sign out
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          const projectId =
            (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
            (Constants as any)?.easConfig?.projectId;
          if (projectId) {
            const pushToken = (
              await Notifications.getExpoPushTokenAsync({ projectId })
            ).data;
            await unregisterPushToken(pushToken);
          }
        } catch (error) {
          // Silently continue if push token unregistration fails
        }
      }
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signingIn,
      signInWithGoogle,
      refresh,
      signOut,
      googleAuthEnabled,
      providersLoading,
    }),
    [
      googleAuthEnabled,
      loading,
      providersLoading,
      refresh,
      signInWithGoogle,
      signOut,
      signingIn,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
};
