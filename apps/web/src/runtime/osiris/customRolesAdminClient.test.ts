// apps/web/src/runtime/osiris/customRolesAdminClient.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisCustomRolesAdminClient } from './customRolesAdminClient';

describe('createOsirisCustomRolesAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists and normalizes custom roles', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          customRoles: [
            {
              id: 'role_1',
              name: 'Dispatcher',
              description: 'Handles routing',
              base_role: 'member',
              agent_access: true,
              permissions: ['calendar.view'],
              allowed_modules: ['calendar'],
              member_count: 3,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createOsirisCustomRolesAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const roles = await client.listCustomRoles('org_1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/orgs/org_1/custom-roles', {
      credentials: 'include',
    });
    expect(roles).toEqual([
      {
        id: 'role_1',
        name: 'Dispatcher',
        description: 'Handles routing',
        baseRole: 'member',
        agentAccess: true,
        permissions: ['calendar.view'],
        allowedModules: ['calendar'],
        memberCount: 3,
      },
    ]);
  });

  it('creates, updates, and deletes a custom role', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ customRole: { id: 'role_2', name: 'Auditor' } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ customRole: { id: 'role_2', name: 'Senior Auditor' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const client = createOsirisCustomRolesAdminClient();
    const created = await client.createCustomRole('org_1', {
      name: 'Auditor',
      description: 'Read-only audit',
      baseRole: 'viewer',
      agentAccess: false,
      permissions: ['reports.view'],
      allowedModules: ['reports'],
    });
    const updated = await client.updateCustomRole('org_1', 'role_2', { name: 'Senior Auditor' });
    await client.deleteCustomRole('org_1', 'role_2');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/orgs/org_1/custom-roles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auditor',
        description: 'Read-only audit',
        baseRole: 'viewer',
        agentAccess: false,
        permissions: ['reports.view'],
        allowedModules: ['reports'],
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/orgs/org_1/custom-roles/role_2', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Senior Auditor' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/orgs/org_1/custom-roles/role_2', {
      method: 'DELETE',
      credentials: 'include',
    });
    expect(created).toEqual({
      id: 'role_2',
      name: 'Auditor',
      description: '',
      baseRole: 'member',
      agentAccess: false,
      permissions: [],
      allowedModules: [],
      memberCount: 0,
    });
    expect(updated).toEqual({
      id: 'role_2',
      name: 'Senior Auditor',
      description: '',
      baseRole: 'member',
      agentAccess: false,
      permissions: [],
      allowedModules: [],
      memberCount: 0,
    });
  });
});
