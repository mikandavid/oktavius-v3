import type { TranslationNamespace } from '@oktavius/i18n';
import { describe, expect, it } from 'vitest';

import {
  buildOverrideScopeKey,
  mergeRequestedNamespaceOverrides,
  resetRequestedNamespacesToBase,
} from './namespaceOverrides';
import { buildWarmupNamespaceKey, selectWarmupNamespaces } from './namespaceWarmup';

describe('selectWarmupNamespaces', () => {
  it('warms enabled dashboard, clients, and email namespaces while excluding core namespaces', () => {
    const allNamespaces: TranslationNamespace[] = [
      'common',
      'navigation',
      'dashboard',
      'clients',
      'email',
      'calendar',
    ];
    const coreNamespaces: TranslationNamespace[] = ['common', 'navigation'];

    expect(
      selectWarmupNamespaces({
        allNamespaces,
        coreNamespaces,
        enabledModuleIds: ['dashboard', 'clients', 'email', 'common'],
      }),
    ).toEqual(['dashboard', 'clients', 'email']);
  });

  it('excludes disabled heavy module namespaces', () => {
    const allNamespaces: TranslationNamespace[] = [
      'dashboard',
      'bills',
      'doc_processing',
      'knowledge',
      'template_gen',
    ];
    const coreNamespaces: TranslationNamespace[] = [];

    expect(
      selectWarmupNamespaces({
        allNamespaces,
        coreNamespaces,
        enabledModuleIds: ['dashboard'],
      }),
    ).toEqual(['dashboard']);
  });

  it('builds the same warmup key for the same selected namespace set', () => {
    expect(buildWarmupNamespaceKey(['email', 'dashboard', 'email'])).toBe(
      buildWarmupNamespaceKey(['dashboard', 'email']),
    );
  });
});

describe('namespace overrides', () => {
  it('builds a stable override scope key from organization and industry scope', () => {
    expect(buildOverrideScopeKey({ organizationId: 'org_1', industryKey: 'funeral' })).toBe(
      'org:org_1|industry:funeral',
    );
    expect(buildOverrideScopeKey({ organizationId: null, industryKey: 'funeral' })).toBe(
      'org:none|industry:funeral',
    );
    expect(buildOverrideScopeKey({ organizationId: null, industryKey: null })).toBe(
      'org:none|industry:none',
    );
  });

  it('changes override scope key when industry changes under the same organization', () => {
    expect(buildOverrideScopeKey({ organizationId: 'org_1', industryKey: 'funeral' })).not.toBe(
      buildOverrideScopeKey({ organizationId: 'org_1', industryKey: 'legal' }),
    );
  });

  it('resets requested namespaces to base translations when new scope has no override', () => {
    const currentLanguageStore = {
      dashboard: {
        title: 'Old org dashboard',
        nested: { base: 'Base', oldOrgOnly: 'Remove me' },
      },
      email: {
        title: 'Email',
      },
    };
    const baseLanguageStore = {
      dashboard: {
        title: 'Dashboard',
        nested: { base: 'Base' },
      },
      email: {
        title: 'Email',
      },
    };

    expect(
      mergeRequestedNamespaceOverrides({
        currentLanguageStore,
        baseLanguageStore,
        namespaces: ['dashboard', 'email'],
        overrides: {
          email: { title: 'New org email' },
        },
      }),
    ).toEqual({
      dashboard: {
        title: 'Dashboard',
        nested: { base: 'Base' },
      },
      email: {
        title: 'New org email',
      },
    });
  });

  it('resets requested namespaces to base translations when override scope clears', () => {
    const currentLanguageStore = {
      dashboard: {
        title: 'Old org dashboard',
        nested: { base: 'Base', stale: 'Remove me' },
      },
    };
    const baseLanguageStore = {
      dashboard: {
        title: 'Dashboard',
        nested: { base: 'Base' },
      },
    };

    expect(
      resetRequestedNamespacesToBase({
        currentLanguageStore,
        baseLanguageStore,
        namespaces: ['dashboard'],
      }),
    ).toEqual({
      dashboard: {
        title: 'Dashboard',
        nested: { base: 'Base' },
      },
    });
  });
});
