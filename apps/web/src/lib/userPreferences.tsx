import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';

export type UiLocale = 'de' | 'en';
export type UiTheme = 'light' | 'dark' | 'system';

export type UserPreferenceSnapshot = {
  locale?: UiLocale | null;
  theme?: UiTheme | null;
  sidebarCollapsed?: boolean | null;
  moduleOrder?: string[] | null;
};

export type UserPreferencesPatch = {
  uiSettings?: {
    locale?: UiLocale;
    theme?: UiTheme;
    sidebarCollapsed?: boolean;
    moduleOrder?: string[];
  };
  defaultView?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
};

export type UserPreferencesRuntimeAdapter = {
  updatePreferences: (patch: UserPreferencesPatch) => Promise<void>;
};

const LOCALE_STORAGE_KEY = 'oktavius.ui.locale';
const THEME_STORAGE_KEY = 'oktavius.ui.theme';
export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';
export const MODULE_ORDER_STORAGE_KEY = 'sidebar-modules-order-v1';

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
  sidebarCollapsedPreference: boolean | null;
  setSidebarCollapsedPreference: (collapsed: boolean) => void;
  moduleOrderPreference: string[];
  setModuleOrderPreference: (order: string[]) => void;
  hydratePreferences: (snapshot: UserPreferenceSnapshot, sourceKey?: string) => void;
  setPreferencesRuntime: (runtime: UserPreferencesRuntimeAdapter | null) => void;
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

function readStoredSidebarCollapsedPreference(): boolean | null {
  const storage = getWindowStorage('localStorage');
  const stored = safeStorageGet(storage, SIDEBAR_COLLAPSED_STORAGE_KEY);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return null;
}

function readStoredModuleOrderPreference(): string[] {
  const storage = getWindowStorage('localStorage');
  if (!storage) return [];
  try {
    const raw = safeStorageGet(storage, MODULE_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function normalizeLocale(value: unknown): UiLocale | null {
  return value === 'de' || value === 'en' ? value : null;
}

function normalizeTheme(value: unknown): UiTheme | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

function normalizeBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeStringArray(value: unknown): string[] | null {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : null;
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

function persistLocale(locale: UiLocale) {
  safeStorageSet(getWindowStorage('localStorage'), LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

function persistTheme(theme: UiTheme) {
  safeStorageSet(getWindowStorage('localStorage'), THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

function persistSidebarCollapsedPreference(collapsed: boolean) {
  safeStorageSet(
    getWindowStorage('localStorage'),
    SIDEBAR_COLLAPSED_STORAGE_KEY,
    String(collapsed),
  );
}

function persistModuleOrderPreference(order: string[]) {
  safeStorageSet(getWindowStorage('localStorage'), MODULE_ORDER_STORAGE_KEY, JSON.stringify(order));
}

function warnPreferenceSaveError(label: string, error: unknown) {
  console.warn(`${label} preference could not be saved.`, error);
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(() => readStoredLocale());
  const [theme, setThemeState] = useState<UiTheme>(() => readStoredTheme());
  const [sidebarCollapsedPreference, setSidebarCollapsedPreferenceState] = useState<boolean | null>(
    () => readStoredSidebarCollapsedPreference(),
  );
  const [moduleOrderPreference, setModuleOrderPreferenceState] = useState<string[]>(() =>
    readStoredModuleOrderPreference(),
  );
  const hydratedSourcesRef = useRef<Set<string>>(new Set());
  const preferencesRuntimeRef = useRef<UserPreferencesRuntimeAdapter | null>(null);

  const setPreferencesRuntime = useCallback((runtime: UserPreferencesRuntimeAdapter | null) => {
    preferencesRuntimeRef.current = runtime;
  }, []);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next);
    persistTheme(next);
    void preferencesRuntimeRef.current
      ?.updatePreferences({ uiSettings: { theme: next } })
      .catch((error: unknown) => {
        warnPreferenceSaveError('Theme', error);
      });
  }, []);

  const setSidebarCollapsedPreference = useCallback((collapsed: boolean) => {
    setSidebarCollapsedPreferenceState(collapsed);
    persistSidebarCollapsedPreference(collapsed);
    void preferencesRuntimeRef.current
      ?.updatePreferences({ uiSettings: { sidebarCollapsed: collapsed } })
      .catch((error: unknown) => {
        warnPreferenceSaveError('Sidebar layout', error);
      });
  }, []);

  const setModuleOrderPreference = useCallback((order: string[]) => {
    const nextOrder = normalizeStringArray(order) ?? [];
    setModuleOrderPreferenceState(nextOrder);
    persistModuleOrderPreference(nextOrder);
    void preferencesRuntimeRef.current
      ?.updatePreferences({ uiSettings: { moduleOrder: nextOrder } })
      .catch((error: unknown) => {
        warnPreferenceSaveError('Module order', error);
      });
  }, []);

  const hydratePreferences = useCallback(
    (snapshot: UserPreferenceSnapshot, sourceKey = 'default') => {
      if (hydratedSourcesRef.current.has(sourceKey)) return;
      hydratedSourcesRef.current.add(sourceKey);

      const nextLocale = normalizeLocale(snapshot.locale);
      const nextTheme = normalizeTheme(snapshot.theme);
      const nextSidebarCollapsed = normalizeBoolean(snapshot.sidebarCollapsed);
      const nextModuleOrder = normalizeStringArray(snapshot.moduleOrder);

      if (nextLocale) {
        setLocaleState(nextLocale);
        persistLocale(nextLocale);
      }

      if (nextTheme) {
        setThemeState(nextTheme);
        persistTheme(nextTheme);
      }

      if (nextSidebarCollapsed != null) {
        setSidebarCollapsedPreferenceState(nextSidebarCollapsed);
        persistSidebarCollapsedPreference(nextSidebarCollapsed);
      }

      if (nextModuleOrder) {
        setModuleOrderPreferenceState(nextModuleOrder);
        persistModuleOrderPreference(nextModuleOrder);
      }
    },
    [],
  );

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
      sidebarCollapsedPreference,
      setSidebarCollapsedPreference,
      moduleOrderPreference,
      setModuleOrderPreference,
      hydratePreferences,
      setPreferencesRuntime,
    }),
    [
      locale,
      setLocale,
      theme,
      setTheme,
      sidebarCollapsedPreference,
      setSidebarCollapsedPreference,
      moduleOrderPreference,
      setModuleOrderPreference,
      hydratePreferences,
      setPreferencesRuntime,
    ],
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

export function useOptionalUserPreferences() {
  return useContext(UserPreferencesContext);
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
