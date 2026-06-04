import { describe, expect, it, vi } from 'vitest';

import { ApiAuthorizationError, type DemoApiRegistry } from '@/api/demo-client';

import { requireApiPermission, withPermissionedDemoApiRegistry } from './apiPermissions';

const memberSubject = { isSuperadmin: false, role: 'member', permissions: [] } as const;
const managerSubject = {
  isSuperadmin: false,
  role: 'admin',
  permissions: ['org.manage', 'records.delete'],
} as const;

const registry = {
  cases: { delete: vi.fn(async () => undefined) },
  caseChecklists: {},
  clients: { delete: vi.fn(async () => undefined) },
  contracts: { delete: vi.fn(async () => undefined) },
  incidents: { delete: vi.fn(async () => undefined) },
  invoices: { delete: vi.fn(async () => undefined) },
  orders: { delete: vi.fn(async () => undefined) },
  organizations: {
    list: vi.fn(async () => ({ data: [], total: 0, totalPages: 1, page: 1, pageSize: 10 })),
    create: vi.fn(async (input: unknown) => input),
  },
  parties: {},
  products: { delete: vi.fn(async () => undefined) },
  projects: { delete: vi.fn(async () => undefined) },
  users: {
    list: vi.fn(async () => ({ data: [], total: 0, totalPages: 1, page: 1, pageSize: 10 })),
    delete: vi.fn(async () => undefined),
  },
} as unknown as DemoApiRegistry;

describe('API permission enforcement', () => {
  it('allows API operations when the subject satisfies the requirement', () => {
    expect(() =>
      requireApiPermission(managerSubject, 'deleteRecords', 'Delete client'),
    ).not.toThrow();
  });

  it('throws authorization errors when requirements are not satisfied', () => {
    expect(() =>
      requireApiPermission(memberSubject, 'deleteRecords', 'Delete client'),
    ).toThrowError(ApiAuthorizationError);
  });

  it('guards generated delete handlers through the demo API registry', async () => {
    const permissionedRegistry = withPermissionedDemoApiRegistry(registry, memberSubject);

    await expect(permissionedRegistry.clients.delete('cli_1')).rejects.toMatchObject({
      name: 'ApiAuthorizationError',
      requirement: 'deleteRecords',
    });
  });

  it('allows generated delete handlers for managers', async () => {
    const permissionedRegistry = withPermissionedDemoApiRegistry(registry, managerSubject);

    await expect(permissionedRegistry.clients.delete('cli_1')).resolves.toBeUndefined();
  });

  it('guards superadmin organization handlers', async () => {
    const permissionedRegistry = withPermissionedDemoApiRegistry(registry, managerSubject);

    await expect(permissionedRegistry.organizations.list({})).rejects.toMatchObject({
      name: 'ApiAuthorizationError',
      requirement: 'superadmin',
    });
  });

  it('guards user administration handlers for non-managers', async () => {
    const permissionedRegistry = withPermissionedDemoApiRegistry(registry, memberSubject);

    await expect(permissionedRegistry.users.list({})).rejects.toMatchObject({
      name: 'ApiAuthorizationError',
      requirement: 'manageOrganization',
    });
  });
});
