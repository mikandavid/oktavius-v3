import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildUserPreferenceSnapshot } from './preferenceSnapshot';

describe('runtime provider isolation', () => {
  it('mounts the Osiris runtime provider stack in app order', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/runtimeProviders.tsx'), 'utf8');

    const providerOrder = [
      'UserPreferencesProvider',
      'OsirisAuthProvider',
      'UserPreferencesBridge',
      'I18nBridge',
      'OsirisApiProvider',
      'ActiveLocationProvider',
      'AgentChatProvider',
    ];
    const positions = providerOrder.map((provider) => source.indexOf(`<${provider}`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(source).not.toContain('VITE_OKTAVIUS_RUNTIME');
    expect(source).not.toContain('DemoDataProvider');
    expect(source).not.toContain('DemoRuntimeProviders');
    expect(source).toContain('onUnauthorized');
  });

  it('keeps App.tsx as a thin app shell', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');

    expect(source).toContain('RuntimeProviders');
    expect(source).not.toContain('DemoDataProvider');
    expect(source).not.toContain('OsirisAuthProvider');
  });

  it('maps Osiris user_preferences table-shaped UI settings into V3 preferences', () => {
    const snapshot = buildUserPreferenceSnapshot({
      currentUser: {
        id: 'usr_1',
        email: 'anna@example.test',
        fullName: 'Anna',
        isSuperadmin: false,
        preferredLanguage: null,
      },
      config: {
        org: {
          id: 'org_1',
          name: 'Org One',
          slug: 'one',
          industryKey: 'general',
          industryName: 'General',
          enabledModules: [],
          theme: {},
          settings: {} as never,
          logoUrl: null,
        },
        terminology: {},
        permissions: [],
        preferences: {
          ui_settings: {
            theme: 'system',
            sidebar_collapsed: true,
            module_order: ['reports', 42, 'clients'],
          },
        },
        agentAccess: false,
      },
    });

    expect(snapshot).toEqual({
      locale: null,
      theme: 'system',
      sidebarCollapsed: true,
      moduleOrder: ['reports', 'clients'],
    });
  });
});
