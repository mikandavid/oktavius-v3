type NamespaceTranslations = Record<string, unknown>;
type LanguageNamespaceStore = Record<string, NamespaceTranslations>;

export function buildOverrideScopeKey({
  organizationId,
  industryKey,
}: {
  organizationId?: string | null;
  industryKey?: string | null;
}): string {
  return `org:${organizationId ?? 'none'}|industry:${industryKey ?? 'none'}`;
}

function deepMergeTranslations(...objs: NamespaceTranslations[]): NamespaceTranslations {
  const out: NamespaceTranslations = {};
  for (const obj of objs) {
    for (const key in obj) {
      const value = obj[key];
      if (value === null || value === undefined) continue;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        out[key] = deepMergeTranslations(
          (out[key] as NamespaceTranslations) ?? {},
          value as NamespaceTranslations,
        );
      } else {
        out[key] = value;
      }
    }
  }
  return out;
}

export function mergeRequestedNamespaceOverrides({
  currentLanguageStore,
  baseLanguageStore,
  namespaces,
  overrides,
}: {
  currentLanguageStore: LanguageNamespaceStore;
  baseLanguageStore: LanguageNamespaceStore;
  namespaces: readonly string[];
  overrides: Record<string, NamespaceTranslations>;
}): LanguageNamespaceStore {
  const nextLanguageStore = { ...currentLanguageStore };

  for (const namespace of namespaces) {
    nextLanguageStore[namespace] = deepMergeTranslations(
      baseLanguageStore[namespace] ?? {},
      overrides[namespace] ?? {},
    );
  }

  return nextLanguageStore;
}

export function resetRequestedNamespacesToBase({
  currentLanguageStore,
  baseLanguageStore,
  namespaces,
}: {
  currentLanguageStore: LanguageNamespaceStore;
  baseLanguageStore: LanguageNamespaceStore;
  namespaces: readonly string[];
}): LanguageNamespaceStore {
  return mergeRequestedNamespaceOverrides({
    currentLanguageStore,
    baseLanguageStore,
    namespaces,
    overrides: {},
  });
}
