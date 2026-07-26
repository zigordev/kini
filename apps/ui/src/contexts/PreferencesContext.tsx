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
import { translate } from '@/i18n/messages';
import type { Language, ThemeMode } from '@/types/domain';

interface PreferencesContextValue {
  language: Language;
  theme: ThemeMode;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const initialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem('kini-language');
  if (stored === 'en' || stored === 'es') return stored;
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
};

const initialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('kini-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [language, updateLanguage] = useState<Language>('en');
  const [theme, updateTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    updateLanguage(initialLanguage());
    updateTheme(initialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('kini-language', language);
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('kini-theme', theme);
  }, [theme]);

  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
  }, []);
  const setTheme = useCallback((next: ThemeMode) => {
    updateTheme(next);
  }, []);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, theme, setLanguage, setTheme, t }),
    [language, setLanguage, setTheme, t, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return value;
};
