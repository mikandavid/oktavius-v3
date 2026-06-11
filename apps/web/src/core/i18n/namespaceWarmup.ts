import type { TranslationNamespace } from '@oktavius/i18n';

type SelectWarmupNamespacesInput = {
  allNamespaces: readonly TranslationNamespace[];
  coreNamespaces: readonly TranslationNamespace[];
  enabledModuleIds: readonly string[];
};

export function selectWarmupNamespaces({
  allNamespaces,
  coreNamespaces,
  enabledModuleIds,
}: SelectWarmupNamespacesInput): TranslationNamespace[] {
  const coreNamespaceSet = new Set(coreNamespaces);
  const enabledModuleSet = new Set(enabledModuleIds);

  return allNamespaces.filter(
    (namespace) => !coreNamespaceSet.has(namespace) && enabledModuleSet.has(namespace),
  );
}

export function buildWarmupNamespaceKey(namespaces: readonly TranslationNamespace[]): string {
  return [...new Set(namespaces)].sort().join(',');
}
