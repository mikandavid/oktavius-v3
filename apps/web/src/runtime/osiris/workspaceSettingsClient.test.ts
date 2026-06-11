import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDefaultOsirisWorkspaceSettings,
  createOsirisWorkspaceSettingsClient,
  normalizeOsirisWorkspaceSettings,
} from './workspaceSettingsClient';

describe('createOsirisWorkspaceSettingsClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads workspace settings through the configured Oktavius API base URL', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          settings: {
            dateTime: { dateFormat: 'YYYY-MM-DD', timeFormat: '12h', timezone: 'Europe/Berlin' },
            locations: { enforcementEnabled: true, sharedModules: ['reports'] },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createOsirisWorkspaceSettingsClient({ baseUrl: 'https://api.example.test/v1' });
    const settings = await client.loadWorkspaceSettings('org_1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/orgs/org_1/settings', {
      credentials: 'include',
    });
    expect(settings.dateTime).toEqual({
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '12h',
      timezone: 'Europe/Berlin',
    });
    expect(settings.locations).toEqual({
      enforcementEnabled: true,
      sharedModules: ['reports'],
    });
  });

  it('saves a complete settings payload so the existing backend schema accepts it', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ settings: createDefaultOsirisWorkspaceSettings() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createOsirisWorkspaceSettingsClient();
    const settings = createDefaultOsirisWorkspaceSettings({
      dateTime: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h', timezone: 'Europe/Vienna' },
      locations: { enforcementEnabled: true, sharedModules: ['staff'] },
    });

    await client.updateWorkspaceSettings('org_2', settings);

    expect(fetchMock).toHaveBeenCalledWith('/orgs/org_2/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  });
});

describe('normalizeOsirisWorkspaceSettings', () => {
  it('fills required backend settings sections when bootstrap config is partial', () => {
    const result = normalizeOsirisWorkspaceSettings({
      dateTime: { dateFormat: 'MM/DD/YYYY' },
      locations: { sharedModules: ['calendar-v2', 42, 'reports'] },
    });

    expect(result.company.legalName).toBe('');
    expect(result.banking.bankName).toBe('');
    expect(result.invoicing.defaultPaymentTermsDays).toBe(30);
    expect(result.dateTime).toEqual({
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Vienna',
    });
    expect(result.locations).toEqual({
      enforcementEnabled: false,
      sharedModules: ['calendar-v2', 'reports'],
    });
  });
});
