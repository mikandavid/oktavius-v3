import { describe, expect, it } from 'vitest';

import { normalizeOsirisRuntimeConfig } from './runtimeConfig';

describe('normalizeOsirisRuntimeConfig', () => {
  it('normalizes resolved backend config into a typed V3 runtime config', () => {
    const result = normalizeOsirisRuntimeConfig({
      org: {
        id: 'org_1',
        name: 'Oktavius Demo',
        slug: 'demo',
        industryKey: 'funeral',
        industryName: 'Funeral',
        enabledModules: ['contacts', 42, 'reports'],
        theme: { accent: 'violet' },
        settings: {
          dateTime: { dateFormat: 'YYYY-MM-DD', timeFormat: '12h', timezone: 'Europe/Berlin' },
          locations: { enforcementEnabled: true, sharedModules: ['reports'] },
        },
        logoUrl: 'data:image/png;base64,abc',
      },
      terminology: { client: 'Customer' },
      permissions: ['contacts.view'],
      preferences: { sidebar: 'compact' },
      agentAccess: true,
      roleName: 'Branch manager',
    });

    expect(result).not.toBeNull();
    if (!result) throw new Error('Expected normalized runtime config.');

    expect(result.org).toEqual({
      id: 'org_1',
      name: 'Oktavius Demo',
      slug: 'demo',
      industryKey: 'funeral',
      industryName: 'Funeral',
      enabledModules: ['contacts', 'reports'],
      theme: { accent: 'violet' },
      settings: expect.objectContaining({
        dateTime: { dateFormat: 'YYYY-MM-DD', timeFormat: '12h', timezone: 'Europe/Berlin' },
      }),
      logoUrl: 'data:image/png;base64,abc',
    });
    expect(result.terminology.client).toBe('Customer');
    expect(result.permissions).toEqual(['contacts.view']);
    expect(result.preferences).toEqual({ sidebar: 'compact' });
    expect(result.agentAccess).toBe(true);
    expect(result.roleName).toBe('Branch manager');
  });

  it('returns null for missing or malformed config', () => {
    expect(normalizeOsirisRuntimeConfig(null)).toBeNull();
    expect(normalizeOsirisRuntimeConfig({ org: null })).toBeNull();
  });
});
