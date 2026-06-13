// apps/web/src/runtime/osiris/invitationsAdminClient.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisInvitationsAdminClient } from './invitationsAdminClient';

describe('createOsirisInvitationsAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists email invitations and creates one (returning acceptUrl)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            invitations: [
              {
                id: 'inv_1',
                org_id: 'org_1',
                email: 'bob@example.test',
                role: 'member',
                token: 'tok_1',
                invited_by: 'usr_a',
                expires_at: '2026-07-01T00:00:00.000Z',
                accepted_at: null,
                created_at: '2026-06-13T00:00:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            invitation: { id: 'inv_2', email: 'cara@example.test', role: 'viewer' },
            acceptUrl: '/invite/tok_2',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const client = createOsirisInvitationsAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const invitations = await client.listInvitations('org_1');
    const created = await client.createInvitation('org_1', {
      email: 'cara@example.test',
      role: 'viewer',
      expiresInDays: 7,
    });

    expect(invitations[0]).toEqual({
      id: 'inv_1',
      orgId: 'org_1',
      email: 'bob@example.test',
      role: 'member',
      customRoleId: null,
      token: 'tok_1',
      invitedBy: 'usr_a',
      expiresAt: '2026-07-01T00:00:00.000Z',
      acceptedAt: null,
      createdAt: '2026-06-13T00:00:00.000Z',
    });
    expect(created.acceptUrl).toBe('/invite/tok_2');
    expect(created.invitation.email).toBe('cara@example.test');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/v1/invitations/orgs/org_1/invitations',
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'cara@example.test',
          role: 'viewer',
          customRoleId: null,
          expiresInDays: 7,
        }),
      },
    );
  });

  it('revokes invitations, lists/creates/revokes links', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // revokeInvitation
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            links: [
              {
                id: 'lnk_1',
                org_id: 'org_1',
                token: 't',
                role: 'member',
                max_uses: 10,
                use_count: 2,
                created_by: 'usr_a',
                expires_at: 'x',
                created_at: 'y',
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ link: { id: 'lnk_2', role: 'viewer' }, inviteUrl: '/invite/tok_link' }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 })); // revokeInviteLink

    const client = createOsirisInvitationsAdminClient();
    await client.revokeInvitation('org_1', 'inv_1');
    const links = await client.listInviteLinks('org_1');
    const created = await client.createInviteLink('org_1', {
      role: 'viewer',
      maxUses: 5,
      expiresInDays: 14,
    });
    await client.revokeInviteLink('org_1', 'lnk_1');

    expect(links[0]).toEqual({
      id: 'lnk_1',
      orgId: 'org_1',
      token: 't',
      role: 'member',
      customRoleId: null,
      maxUses: 10,
      useCount: 2,
      createdBy: 'usr_a',
      expiresAt: 'x',
      createdAt: 'y',
    });
    expect(created.inviteUrl).toBe('/invite/tok_link');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/invitations/orgs/org_1/invitations/inv_1', {
      method: 'DELETE',
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/invitations/orgs/org_1/links', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'viewer', customRoleId: null, maxUses: 5, expiresInDays: 14 }),
    });
  });
});
