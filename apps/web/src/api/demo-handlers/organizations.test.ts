import { describe, expect, it } from 'vitest';

import type { OrganizationRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildOrganizationsDemoHandlers } from './organizations';

const baseOrganization: OrganizationRecord = {
  id: 'org_1',
  name: 'Existing Org',
  slug: 'existing-org',
  plan: 'Enterprise',
  status: 'Active',
  environment: 'Production',
  region: 'EU · Vienna',
  billingEmail: 'billing@example.com',
  ownerName: 'Existing Owner',
  memberCount: 12,
  createdAt: '2024-01-01',
};

function createHandlers(seed: OrganizationRecord[] = [baseOrganization]) {
  let organizations = seed;
  return {
    handlers: buildOrganizationsDemoHandlers({
      getOrganizations: () => organizations,
      setOrganizations: (next) => {
        organizations = typeof next === 'function' ? next(organizations) : next;
      },
    }),
    getOrganizations: () => organizations,
  };
}

describe('buildOrganizationsDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseOrganization, id: 'org_1', name: 'Bravo Org', slug: 'bravo' },
      { ...baseOrganization, id: 'org_2', name: 'Alpha Org', slug: 'alpha' },
      { ...baseOrganization, id: 'org_3', name: 'Charlie Org', slug: 'charlie' },
    ]);

    await expect(handlers.list({ page: '1', pageSize: '2', sort: 'name' })).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'org_2', name: 'Alpha Org' }),
        expect.objectContaining({ id: 'org_1', name: 'Bravo Org' }),
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
        ...baseOrganization,
        id: 'org_1',
        name: 'Apex Production',
        slug: 'apex-production',
        plan: 'Enterprise',
        status: 'Active',
        environment: 'Production',
        ownerName: 'Anna Hofer',
      },
      {
        ...baseOrganization,
        id: 'org_2',
        name: 'Apex Trial',
        slug: 'apex-trial',
        plan: 'Starter',
        status: 'Trial',
        environment: 'Trial',
        ownerName: 'Anna Hofer',
      },
      {
        ...baseOrganization,
        id: 'org_3',
        name: 'Kunz Production',
        slug: 'kunz-production',
        plan: 'Enterprise',
        status: 'Active',
        environment: 'Production',
        ownerName: 'Markus Leitner',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-slug',
      search: 'apex',
      plan: 'Enterprise',
      status: 'Active',
      environment: 'Production',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'org_1', slug: 'apex-production' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate slugs and billing emails with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseOrganization,
        name: 'Duplicate Org',
        slug: ' Existing-Org ',
        billingEmail: ' Billing@Example.com ',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: {
        slug: 'An organization with this slug already exists.',
        billingEmail: 'An organization with this billing email already exists.',
      },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates organizations through the API registry contract', async () => {
    const { getOrganizations, handlers } = createHandlers([]);
    const unsafeInput = {
      ...baseOrganization,
      id: 'ignored',
      memberCount: 99,
      createdAt: '1999-01-01',
      name: 'New Org',
      slug: ' new-org ',
      billingEmail: ' billing@new.example ',
    } as unknown as Parameters<typeof handlers.create>[0];

    const created = await handlers.create(unsafeInput);

    expect(created.id).toMatch(/^org_/);
    expect(created.memberCount).toBe(1);
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(created.name).toBe('New Org');
    expect(created.slug).toBe('new-org');
    expect(created.billingEmail).toBe('billing@new.example');
    expect(getOrganizations()).toEqual([created]);
  });
});
