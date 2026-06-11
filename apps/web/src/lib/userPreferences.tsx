import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';

export type UiLocale = 'de' | 'en';
export type UiTheme = 'light' | 'dark' | 'system';

const LOCALE_STORAGE_KEY = 'oktavius.ui.locale';
const THEME_STORAGE_KEY = 'oktavius.ui.theme';

const LOCALE_LABELS: Record<UiLocale, string> = {
  de: 'Deutsch',
  en: 'English',
};

const THEME_LABELS: Record<UiTheme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

type UserPreferencesContextValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  localeLabel: string;
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
  themeLabel: string;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

function readStoredLocale(): UiLocale {
  const storage = getWindowStorage('localStorage');
  const stored = safeStorageGet(storage, LOCALE_STORAGE_KEY);
  if (stored === 'de' || stored === 'en') {
    return stored;
  }
  return 'en';
}

function readStoredTheme(): UiTheme {
  const storage = getWindowStorage('localStorage');
  const stored = safeStorageGet(storage, THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'light';
}

function resolveTheme(theme: UiTheme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme: UiTheme) {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(() => readStoredLocale());
  const [theme, setThemeState] = useState<UiTheme>(() => readStoredTheme());

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    safeStorageSet(getWindowStorage('localStorage'), LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next);
    safeStorageSet(getWindowStorage('localStorage'), THEME_STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    applyTheme(theme);

    if (theme !== 'system') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [locale, theme]);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      locale,
      setLocale,
      localeLabel: LOCALE_LABELS[locale],
      theme,
      setTheme,
      themeLabel: THEME_LABELS[theme],
    }),
    [locale, setLocale, theme, setTheme],
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used inside UserPreferencesProvider');
  }
  return context;
}

export const UI_LOCALE_OPTIONS: Array<{ value: UiLocale; label: string }> = [
  { value: 'de', label: LOCALE_LABELS.de },
  { value: 'en', label: LOCALE_LABELS.en },
];

export const UI_THEME_OPTIONS: Array<{ value: UiTheme; label: string }> = [
  { value: 'light', label: THEME_LABELS.light },
  { value: 'dark', label: THEME_LABELS.dark },
  { value: 'system', label: THEME_LABELS.system },
];
