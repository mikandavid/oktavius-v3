import { describe, expect, it } from 'vitest';

import {
  buildStandardCrudListQueryKey,
  buildStandardCrudListRequestParams,
} from './standardCrudQuery';

describe('buildStandardCrudListRequestParams', () => {
  it('serializes list state into stable server list params', () => {
    const params = buildStandardCrudListRequestParams({
      page: 2,
      pageSize: 10,
      sort: '-name',
      search: 'kunz',
      values: { status: 'active', type: '' },
    });

    expect(params).toEqual({
      page: '2',
      pageSize: '10',
      sort: '-name',
      search: 'kunz',
      status: 'active',
      type: '',
    });
  });
});

describe('buildStandardCrudListQueryKey', () => {
  it('scopes server-backed CRUD list cache keys by active org and site', () => {
    const requestParams = buildStandardCrudListRequestParams({
      page: 1,
      pageSize: 25,
      sort: 'name',
      search: '',
      values: { status: 'active' },
    });

    expect(
      buildStandardCrudListQueryKey({
        resourceKey: 'clients',
        activeOrgId: 'org_1',
        activeSiteId: 'site_1',
        requestParams,
      }),
    ).toEqual(['scope', 'org_1', 'site_1', 'standard-crud-list', 'clients', requestParams]);
  });

  it('uses none fallbacks when org or site scope is absent', () => {
    const requestParams = buildStandardCrudListRequestParams({
      page: 1,
      pageSize: 10,
      sort: 'name',
      search: '',
      values: {},
    });

    expect(
      buildStandardCrudListQueryKey({
        resourceKey: 'clients',
        activeOrgId: null,
        activeSiteId: null,
        requestParams,
      }),
    ).toEqual(['scope', 'none', 'none', 'standard-crud-list', 'clients', requestParams]);
  });
});
