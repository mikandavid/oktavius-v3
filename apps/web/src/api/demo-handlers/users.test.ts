import { describe, expect, it } from 'vitest';

import type { UserRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildUsersDemoHandlers } from './users';

const baseUser: UserRecord = {
  id: 'usr_1',
  name: 'Existing User',
  email: 'existing@example.com',
  role: 'Admin',
  status: 'Active',
  team: 'Operations',
};

function createHandlers(seed: UserRecord[] = [baseUser]) {
  let users = seed;
  return {
    handlers: buildUsersDemoHandlers({
      getUsers: () => users,
      setUsers: (next) => {
        users = typeof next === 'function' ? next(users) : next;
      },
    }),
    getUsers: () => users,
  };
}

describe('buildUsersDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseUser, id: 'usr_1', name: 'Bravo User', email: 'bravo@example.com' },
      { ...baseUser, id: 'usr_2', name: 'Alpha User', email: 'alpha@example.com' },
      { ...baseUser, id: 'usr_3', name: 'Charlie User', email: 'charlie@example.com' },
    ]);

    await expect(handlers.list({ page: '1', pageSize: '2', sort: 'name' })).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'usr_2', name: 'Alpha User' }),
        expect.objectContaining({ id: 'usr_1', name: 'Bravo User' }),
      ],
      total: 3,
      totalPages: 2,
      page: 1,
      pageSize: 2,
    });
  });

  it('applies search and filter params before pagination', async () => {
    const { handlers } = createHandlers([
      {
        ...baseUser,
        id: 'usr_1',
        name: 'Anna Admin',
        email: 'anna@example.com',
        role: 'Admin',
        status: 'Active',
        team: 'Operations',
      },
      {
        ...baseUser,
        id: 'usr_2',
        name: 'Anna Manager',
        email: 'anna.manager@example.com',
        role: 'Manager',
        status: 'Active',
        team: 'Operations',
      },
      {
        ...baseUser,
        id: 'usr_3',
        name: 'Markus Admin',
        email: 'markus@example.com',
        role: 'Admin',
        status: 'Suspended',
        team: 'Finance',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-email',
      search: 'anna',
      role: 'Admin',
      status: 'Active',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'usr_1', email: 'anna@example.com' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate emails with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseUser,
        email: ' Existing@Example.com ',
        name: 'Duplicate User',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { email: 'A user with this email already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates users through the API registry contract', async () => {
    const { getUsers, handlers } = createHandlers([]);
    const unsafeInput = {
      ...baseUser,
      id: 'ignored',
      email: 'new@example.com',
      name: 'New User',
    } as unknown as Parameters<typeof handlers.create>[0];

    const created = await handlers.create(unsafeInput);

    expect(created.id).toMatch(/^usr_/);
    expect(created.email).toBe('new@example.com');
    expect(getUsers()).toEqual([created]);
  });
});
