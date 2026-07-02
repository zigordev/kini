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
import * as SystemUI from 'expo-system-ui';
import { Platform } from 'react-native';
import useAuth from '../hooks/useAuth';
import { updateTheme } from '../services/users.service';
import { palette } from '../theme/design';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (theme: ThemeMode) => void;
}

const STORAGE_KEY = 'kini-theme';
const LIGHT_BACKGROUND = palette.background;
const DARK_BACKGROUND = palette.darkBackground;

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readInitialTheme = (): ThemeMode => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyTheme = (theme: ThemeMode) => {
  const backgroundColor = theme === 'dark' ? DARK_BACKGROUND : LIGHT_BACKGROUND;

  if (Platform.OS !== 'web') {
    void SystemUI.setBackgroundColorAsync(backgroundColor).catch(
      (caughtError) => {
        console.warn('Failed to update native system background', caughtError);
      },
    );
    return;
  }

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = theme === 'dark' ? palette.darkInk : palette.ink;
};

export const ThemeProvider = ({
  children,
}: PropsWithChildren): ReactElement => {
  const { user, refresh } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);

  useEffect(() => {
    if (user?.theme === 'dark' || user?.theme === 'light') {
      setTheme(user.theme);
    }
  }, [user?.theme]);

  useEffect(() => {
    applyTheme(theme);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const persistTheme = useCallback(
    (next: ThemeMode) => {
      if (user) {
        void updateTheme(next)
          .then(() => refresh())
          .catch((caughtError) => {
            console.error('Failed to persist theme preference', caughtError);
          });
      }
    },
    [refresh, user],
  );

  const setThemeMode = useCallback(
    (next: ThemeMode) => {
      setTheme(next);
      persistTheme(next);
    },
    [persistTheme],
  );

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setThemeMode,
    }),
    [setThemeMode, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
