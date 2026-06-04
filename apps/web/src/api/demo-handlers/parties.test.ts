import { describe, expect, it } from 'vitest';

import type { PartyRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildPartiesDemoHandlers } from './parties';

const baseParty: PartyRecord = {
  id: 'pty_1',
  clientId: 'cli_1',
  name: 'Existing Contact',
  role: 'primary_contact',
  email: 'contact@example.test',
};

function createHandlers(seed: PartyRecord[] = [baseParty]) {
  let parties = seed;
  return {
    handlers: buildPartiesDemoHandlers({
      getParties: () => parties,
      setParties: (next) => {
        parties = typeof next === 'function' ? next(parties) : next;
      },
    }),
    getParties: () => parties,
  };
}

describe('buildPartiesDemoHandlers', () => {
  it('rejects missing names and roles with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        clientId: 'cli_1',
        name: ' ',
        role: ' ',
        email: 'new@example.test',
      }),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: {
        name: 'Name is required.',
        role: 'Role is required.',
      },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates trimmed parties through the API registry contract', async () => {
    const { getParties, handlers } = createHandlers([]);

    const created = await handlers.create({
      clientId: 'cli_1',
      name: ' New Contact ',
      role: ' billing_contact ',
      email: ' billing@example.test ',
    });

    expect(created.id).toMatch(/^pty_/);
    expect(created.name).toBe('New Contact');
    expect(created.role).toBe('billing_contact');
    expect(created.email).toBe('billing@example.test');
    expect(getParties()).toEqual([created]);
  });
});
