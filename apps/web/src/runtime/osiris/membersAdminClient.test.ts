import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisMembersAdminClient } from './membersAdminClient';

describe('createOsirisMembersAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists and normalizes org members (snake or camel)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          users: [
            {
              user_id: 'usr_1',
              membership_id: 'mem_1',
              org_role: 'admin',
              custom_role_id: null,
              email: 'anna@example.test',
              full_name: 'Anna Admin',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createOsirisMembersAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const members = await client.listOrgMembers('org_1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/orgs/org_1/users', {
      credentials: 'include',
    });
    expect(members).toEqual([
      {
        userId: 'usr_1',
        membershipId: 'mem_1',
        role: 'admin',
        customRoleId: null,
        email: 'anna@example.test',
        fullName: 'Anna Admin',
      },
    ]);
  });

  it('updates a member role and removes a member', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ membership: { id: 'mem_1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const client = createOsirisMembersAdminClient();
    await client.updateMemberRole('org_1', 'usr_1', { role: 'member', customRoleId: null });
    await client.removeMember('org_1', 'usr_1');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/orgs/org_1/users/usr_1/role', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'member', customRoleId: null }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/orgs/org_1/users/usr_1', {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('throws a readable error when the list request fails', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }),
    );
    const client = createOsirisMembersAdminClient();
    await expect(client.listOrgMembers('org_1')).rejects.toThrow('Forbidden');
  });
});
