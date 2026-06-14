import { describe, expect, it } from 'vitest';

import { whatsappKeys } from './whatsappKeys';

describe('whatsappKeys', () => {
  it('scopes keys by org id', () => {
    expect(whatsappKeys.status('org_1')).toEqual(['whatsapp', 'org_1', 'status']);
    expect(whatsappKeys.config('org_1')).toEqual(['whatsapp', 'org_1', 'config']);
    expect(whatsappKeys.contacts('org_1')).toEqual(['whatsapp', 'org_1', 'contacts']);
    expect(whatsappKeys.members('org_1')).toEqual(['whatsapp', 'org_1', 'members']);
  });

  it('uses a stable placeholder when org id is null', () => {
    expect(whatsappKeys.status(null)).toEqual(['whatsapp', 'none', 'status']);
  });
});
