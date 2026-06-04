import { describe, expect, it } from 'vitest';

import type { ProductRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildProductsDemoHandlers } from './products';

const baseProduct: ProductRecord = {
  id: 'prd_1',
  orgId: 'org_1',
  sku: 'LIC-BASE',
  name: 'Base License',
  category: 'Licenses',
  status: 'Active',
  currency: 'EUR',
  price: '1000',
  stock: 10,
  unit: 'seat',
};

function createHandlers(seed: ProductRecord[] = [baseProduct]) {
  let products = seed;
  return {
    handlers: buildProductsDemoHandlers({
      activeOrgId: 'org_1',
      getProducts: () => products,
      setProducts: (next) => {
        products = typeof next === 'function' ? next(products) : next;
      },
    }),
    getProducts: () => products,
  };
}

describe('buildProductsDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseProduct, id: 'prd_1', sku: 'SVC-B', name: 'Bravo Service', category: 'Services' },
      { ...baseProduct, id: 'prd_2', sku: 'LIC-A', name: 'Alpha License', category: 'Licenses' },
      { ...baseProduct, id: 'prd_3', sku: 'HW-C', name: 'Charlie Hardware', category: 'Hardware' },
    ]);

    await expect(handlers.list({ page: '1', pageSize: '2', sort: 'name' })).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'prd_2', name: 'Alpha License' }),
        expect.objectContaining({ id: 'prd_1', name: 'Bravo Service' }),
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
        ...baseProduct,
        id: 'prd_1',
        sku: 'SVC-PLAN',
        name: 'Planning Service',
        category: 'Services',
        status: 'Active',
      },
      {
        ...baseProduct,
        id: 'prd_2',
        sku: 'SVC-DRAFT',
        name: 'Draft Service',
        category: 'Services',
        status: 'Draft',
      },
      {
        ...baseProduct,
        id: 'prd_3',
        sku: 'LIC-PLAN',
        name: 'Planning License',
        category: 'Licenses',
        status: 'Active',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-sku',
      search: 'plan',
      category: 'Services',
      status: 'Active',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'prd_1', sku: 'SVC-PLAN' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate SKUs with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseProduct,
        sku: ' lic-base ',
        name: 'Duplicate License',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { sku: 'A product with this SKU already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates products through the API registry contract', async () => {
    const { getProducts, handlers } = createHandlers([]);
    const unsafeInput = {
      ...baseProduct,
      id: 'ignored',
      sku: 'SVC-NEW',
      name: 'New Service',
    } as unknown as Parameters<typeof handlers.create>[0];

    const created = await handlers.create(unsafeInput);

    expect(created.id).toMatch(/^prd_/);
    expect(created.orgId).toBe('org_1');
    expect(getProducts()).toEqual([created]);
  });
});
