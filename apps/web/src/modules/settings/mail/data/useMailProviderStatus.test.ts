import { describe, expect, it } from 'vitest';

import { hostedNylasProviderLabel } from '@/components/common/ConnectedAccountsHeaderMenu';

import { DISCONNECTED_MAIL_STATUS, SUPPORTED_MAIL_PROVIDERS } from './useMailProviderStatus';

describe('mail provider data', () => {
  it('lists google, microsoft and exchange as supported providers', () => {
    expect(SUPPORTED_MAIL_PROVIDERS).toEqual(['google', 'microsoft', 'ews']);
  });

  it('maps supported providers to display labels', () => {
    expect(SUPPORTED_MAIL_PROVIDERS.map(hostedNylasProviderLabel)).toEqual([
      'Google',
      'Microsoft',
      'Exchange Server',
    ]);
  });

  it('defaults to a disconnected status with no accounts', () => {
    expect(DISCONNECTED_MAIL_STATUS).toEqual({ status: 'disconnected', accounts: [] });
  });
});
