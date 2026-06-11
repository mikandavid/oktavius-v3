import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisLocationAdminClient } from './locationAdminClient';

describe('createOsirisLocationAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists and normalizes organization locations', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          locations: [
            {
              id: 'site_1',
              org_id: 'org_1',
              name: 'Vienna',
              branch_code: '21',
              is_active: true,
              company_name: 'Oktavius Vienna',
              postal_code: '1010',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createOsirisLocationAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const locations = await client.listOrgLocations('org_1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/orgs/org_1/locations', {
      credentials: 'include',
    });
    expect(locations).toEqual([
      {
        id: 'site_1',
        orgId: 'org_1',
        name: 'Vienna',
        address: {},
        branchCode: '21',
        designation: null,
        locality: null,
        category: null,
        phone: null,
        mobilePhone: null,
        fax: null,
        companyName: 'Oktavius Vienna',
        email: null,
        street: null,
        postalCode: '1010',
        isActive: true,
      },
    ]);
  });

  it('creates, updates, and deactivates locations with the backend camelCase payload', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ location: { id: 'site_2', name: 'Graz' } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ location: { id: 'site_2', name: 'Graz Süd' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ location: { id: 'site_2', name: 'Graz Süd' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const client = createOsirisLocationAdminClient();

    await client.createOrgLocation('org_1', { name: 'Graz', branchCode: '22' });
    await client.updateOrgLocation('org_1', 'site_2', { name: 'Graz Süd' });
    await client.deactivateOrgLocation('org_1', 'site_2');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/orgs/org_1/locations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Graz', branchCode: '22' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/orgs/org_1/locations/site_2', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Graz Süd' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/orgs/org_1/locations/site_2', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
  });
});
