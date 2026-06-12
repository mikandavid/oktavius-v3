/**
 * I18n React Provider.
 *
 * Architecture:
 * - Core namespaces are bundled eagerly via @oktavius/i18n/translations.
 * - Module namespaces are lazy-loaded via dynamic import on first preload.
 * - Language is sourced from UserPreferencesProvider (single source of truth).
 *   Persistence to backend (if any) is delegated to I18nRuntimeAdapter.persistLanguage.
 * - Org/industry overrides are fetched in background via I18nRuntimeAdapter.fetchOverrides.
 *
 * Components must wrap themselves with `usePreloadNamespaces(['ns', ...])` and gate
 * render on `ready` to avoid showing raw keys during the first paint of a module.
 */
import {
  ALL_NAMESPACES,
  CORE_NAMESPACES,
  coreTranslations,
  DEFAULT_LANGUAGE,
  interpolate,
  type InterpolationParams,
  type LanguageCode,
  loadNamespace,
  type TranslationNamespace,
} from '@oktavius/i18n';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { type UiLocale, useUserPreferences } from '@/lib/userPreferences';

import {
  buildOverrideScopeKey,
  mergeRequestedNamespaceOverrides,
  resetRequestedNamespacesToBase,
} from './namespaceOverrides';
import { buildWarmupNamespaceKey, selectWarmupNamespaces } from './namespaceWarmup';
import { type I18nRuntimeAdapter, NOOP_I18N_RUNTIME } from './runtime';

type Store = Record<LanguageCode, Record<string, Record<string, unknown>>>;

interface I18nContextValue {
  language: LanguageCode;
  overrideScopeKey: string;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: string, params?: InterpolationParams, defaultValue?: string) => string;
  preloadNamespaces: (namespaces: TranslationNamespace[]) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

type IdleWindow = Window & {
  requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const EMPTY_ENABLED_MODULE_IDS: readonly string[] = [];

function getNested(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function formatMissingKey(key: string): string {
  if (import.meta.env.DEV) return `[${key}]`;
  const parts = key.split('.');
  const last = parts[parts.length - 1] ?? key;
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function buildT(language: LanguageCode, store: Store) {
  return (key: string, params?: InterpolationParams, defaultValue?: string): string => {
    const parts = key.split('.');
    if (parts.length < 2) return defaultValue ?? formatMissingKey(key);
    const ns = parts[0];
    const inner = parts.slice(1).join('.');
    const nsMap = store[language]?.[ns];
    if (!nsMap) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] namespace not loaded: ${ns} (key=${key})`);
      }
      return defaultValue ?? formatMissingKey(key);
    }
    let value = getNested(nsMap, inner);
    if (value === undefined || value === null || typeof value === 'object') {
      const count = params?.count;
      if (typeof count === 'number') {
        const pluralKey = count === 1 ? `${inner}_one` : `${inner}_other`;
        value = getNested(nsMap, pluralKey);
      }
    }
    if (value === undefined || value === null || typeof value === 'object') {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] missing: ${key} (lang=${language})`);
      }
      return defaultValue ?? formatMissingKey(key);
    }
    return interpolate(String(value), params);
  };
}

function toLanguageCode(locale: UiLocale): LanguageCode {
  return locale === 'en' ? 'en' : 'de';
}

interface I18nProviderProps {
  children: ReactNode;
  runtime?: I18nRuntimeAdapter;
}

export function I18nProvider({ children, runtime = NOOP_I18N_RUNTIME }: I18nProviderProps) {
  const { locale, setLocale } = useUserPreferences();
  const language: LanguageCode = toLanguageCode(locale);
  const overrideScopeKey = buildOverrideScopeKey({
    organizationId: runtime.organizationId,
    industryKey: runtime.industryKey,
  });

  const baseStoreRef = useRef<Store>({
    en: { ...coreTranslations.en },
    de: { ...coreTranslations.de },
  });
  const [store, setStore] = useState<Store>(() => ({
    en: { ...baseStoreRef.current.en },
    de: { ...baseStoreRef.current.de },
  }));

  const loadedModulesRef = useRef<Set<string>>(new Set());
  const pendingLoadsRef = useRef<Map<string, Promise<void>>>(new Map());
  const overridesLoadedRef = useRef<Set<string>>(new Set());
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;

  // ----- overrides -----
  const fetchOverrides = useCallback(
    async (namespaces: string[]) => {
      const rt = runtimeRef.current;
      const requestedNamespaces = Array.from(new Set(namespaces));
      if (!rt.fetchOverrides || overrideScopeKey === 'org:none|industry:none') {
        setStore((prev) => ({
          ...prev,
          [language]: resetRequestedNamespacesToBase({
            currentLanguageStore: prev[language] ?? {},
            baseLanguageStore: baseStoreRef.current[language] ?? {},
            namespaces: requestedNamespaces,
          }),
        }));
        return;
      }
      const toFetch = requestedNamespaces.filter(
        (ns) => !overridesLoadedRef.current.has(`${overrideScopeKey}:${language}:${ns}`),
      );
      if (toFetch.length === 0) return;
      try {
        const result = await rt.fetchOverrides(language, toFetch);
        const currentScopeKey = buildOverrideScopeKey({
          organizationId: runtimeRef.current.organizationId,
          industryKey: runtimeRef.current.industryKey,
        });
        if (currentScopeKey !== overrideScopeKey) return;
        setStore((prev) => {
          const langStore = mergeRequestedNamespaceOverrides({
            currentLanguageStore: prev[language] ?? {},
            baseLanguageStore: baseStoreRef.current[language] ?? {},
            namespaces: toFetch,
            overrides: result,
          });
          for (const ns of toFetch) {
            overridesLoadedRef.current.add(`${overrideScopeKey}:${language}:${ns}`);
          }
          return { ...prev, [language]: langStore };
        });
      } catch (error) {
        console.warn('[i18n] fetchOverrides failed', error);
      }
    },
    [language, overrideScopeKey],
  );

  // reset override cache on language/runtime org change
  useEffect(() => {
    overridesLoadedRef.current.clear();
  }, [language, overrideScopeKey]);

  // fetch overrides for core namespaces on language change
  useEffect(() => {
    void fetchOverrides(CORE_NAMESPACES);
  }, [language, overrideScopeKey, fetchOverrides]);

  // ----- setLanguage -----
  const setLanguage = useCallback(
    async (next: LanguageCode) => {
      setLocale(next as UiLocale);
      try {
        await runtimeRef.current.persistLanguage?.(next);
      } catch (error) {
        console.warn('[i18n] persistLanguage failed', error);
      }
    },
    [setLocale],
  );

  // ----- preload namespaces (lazy) -----
  const preloadNamespaces = useCallback(
    async (namespaces: TranslationNamespace[]) => {
      const requestedNamespaces = Array.from(new Set(namespaces));
      const toLoad = requestedNamespaces.filter(
        (ns) => !store[language]?.[ns] && !loadedModulesRef.current.has(`${language}:${ns}`),
      );
      if (toLoad.length === 0) {
        void fetchOverrides(requestedNamespaces);
        return;
      }

      const loads = toLoad.map((ns) => {
        const key = `${language}:${ns}`;
        const pending = pendingLoadsRef.current.get(key);
        if (pending) return pending;
        const promise = (async () => {
          try {
            const translations = await loadNamespace(language, ns);
            baseStoreRef.current = {
              ...baseStoreRef.current,
              [language]: { ...baseStoreRef.current[language], [ns]: translations },
            };
            loadedModulesRef.current.add(key);
            setStore((prev) => ({
              ...prev,
              [language]: { ...prev[language], [ns]: translations },
            }));
          } catch (error) {
            console.error(`[i18n] failed to load namespace ${ns}`, error);
          } finally {
            pendingLoadsRef.current.delete(key);
          }
        })();
        pendingLoadsRef.current.set(key, promise);
        return promise;
      });

      await Promise.all(loads);
      void fetchOverrides(requestedNamespaces);
    },
    [language, store, fetchOverrides],
  );

  // ----- background warm module namespaces -----
  const warmedRef = useRef<Set<string>>(new Set());
  const preloadNamespacesRef = useRef(preloadNamespaces);
  preloadNamespacesRef.current = preloadNamespaces;
  const enabledModuleIds = runtime.enabledModuleIds ?? EMPTY_ENABLED_MODULE_IDS;
  const warmupNamespaces = selectWarmupNamespaces({
    allNamespaces: ALL_NAMESPACES,
    coreNamespaces: CORE_NAMESPACES,
    enabledModuleIds,
  });
  const warmupNamespaceKey = buildWarmupNamespaceKey(warmupNamespaces);
  const warmupNamespacesRef = useRef(warmupNamespaces);
  warmupNamespacesRef.current = warmupNamespaces;
  useEffect(() => {
    if (!warmupNamespaceKey) return;

    const cacheKey = `${language}:${overrideScopeKey}:${warmupNamespaceKey}`;
    if (warmedRef.current.has(cacheKey)) return;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const idleWindow = window as IdleWindow;

    const run = () => {
      if (cancelled) return;
      const moduleNs = warmupNamespacesRef.current;
      if (moduleNs.length === 0) return;
      warmedRef.current.add(cacheKey);
      preloadNamespacesRef.current(moduleNs).catch((error) => {
        console.warn('[i18n] background warm failed', error);
        warmedRef.current.delete(cacheKey);
      });
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(run, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(run, 500);
    }
    return () => {
      cancelled = true;
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [language, overrideScopeKey, warmupNamespaceKey]);

  const t = useMemo(() => buildT(language, store), [language, store]);

  const value = useMemo<I18nContextValue>(
    () => ({ language, overrideScopeKey, setLanguage, t, preloadNamespaces }),
    [language, overrideScopeKey, setLanguage, t, preloadNamespaces],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function TestI18nProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => ({
    en: { ...coreTranslations.en },
    de: { ...coreTranslations.de },
  }));
  const language: LanguageCode = DEFAULT_LANGUAGE;
  const t = useMemo(() => buildT(language, store), [language, store]);
  const preloadNamespaces = useCallback(
    async (namespaces: TranslationNamespace[]) => {
      const uniqueNamespaces = [...new Set(namespaces)];
      if (uniqueNamespaces.length === 0) return;

      const entries = await Promise.all(
        uniqueNamespaces.map(
          async (namespace) => [namespace, await loadNamespace(language, namespace)] as const,
        ),
      );

      setStore((prev) => ({
        ...prev,
        [language]: {
          ...prev[language],
          ...Object.fromEntries(entries),
        },
      }));
    },
    [language],
  );
  const value: I18nContextValue = {
    language,
    overrideScopeKey: 'none',
    setLanguage: async () => {},
    t,
    preloadNamespaces,
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useTranslation() {
  const { t, language } = useI18n();
  return { t, language };
}

export function usePreloadNamespaces(namespaces: TranslationNamespace[]): { ready: boolean } {
  const { language, overrideScopeKey, preloadNamespaces } = useI18n();
  const key = useMemo(() => namespaces.slice().sort().join(','), [namespaces]);
  const [ready, setReady] = useState(false);
  const loadedRef = useRef<Set<string>>(new Set());
  const nsRef = useRef(namespaces);
  nsRef.current = namespaces;
  const preloadRef = useRef(preloadNamespaces);
  preloadRef.current = preloadNamespaces;

  useEffect(() => {
    const cacheKey = `${language}:${overrideScopeKey}:${key}`;
    if (loadedRef.current.has(cacheKey)) {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    preloadRef
      .current(nsRef.current)
      .then(() => {
        if (cancelled) return;
        loadedRef.current.add(cacheKey);
        setReady(true);
      })
      .catch((error) => {
        console.error('[i18n] preload failed', error);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [language, overrideScopeKey, key]);

  return { ready };
}
