'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '@/lib/api';
import type { AuthenticatedUser } from '@/types/domain';
import { usePreferences } from './PreferencesContext';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  signingIn: boolean;
  googleAuthEnabled: boolean;
  refresh: () => Promise<void>;
  signInWithGoogle: (returnPath?: string) => void;
  signOut: () => Promise<void>;
  updateUser: (user: AuthenticatedUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { setLanguage, setTheme } = usePreferences();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  const applyUser = useCallback(
    (next: AuthenticatedUser | null) => {
      setUser(next);
      if (next?.language === 'en' || next?.language === 'es') {
        setLanguage(next.language);
      }
      if (next?.theme === 'light' || next?.theme === 'dark') {
        setTheme(next.theme);
      }
    },
    [setLanguage, setTheme],
  );

  const refresh = useCallback(async () => {
    applyUser(await authApi.me());
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    void Promise.all([authApi.me(), authApi.googleConfig().catch(() => null)])
      .then(([sessionUser, config]) => {
        if (!active) return;
        applyUser(sessionUser);
        setGoogleAuthEnabled(Boolean(config?.enabled));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyUser]);

  const signInWithGoogle = useCallback((returnPath?: string) => {
    setSigningIn(true);
    const callback = new URL('/auth/callback', window.location.origin);
    if (returnPath?.startsWith('/')) {
      callback.searchParams.set('next', returnPath);
    }
    window.location.assign(authApi.loginUrl(callback.toString()));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setSigningIn(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signingIn,
      googleAuthEnabled,
      refresh,
      signInWithGoogle,
      signOut,
      updateUser: applyUser,
    }),
    [
      applyUser,
      googleAuthEnabled,
      loading,
      refresh,
      signInWithGoogle,
      signOut,
      signingIn,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
