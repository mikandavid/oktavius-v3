import { describe, expect, it } from 'vitest';

import type { OrderRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildOrdersDemoHandlers } from './orders';

const baseOrder: OrderRecord = {
  id: 'ord_1',
  orgId: 'org_1',
  orderNumber: 'SO-001',
  clientId: 'cli_1',
  clientName: 'Existing Client',
  status: 'Confirmed',
  total: '1000',
  orderDate: '2024-01-01',
  dueDate: '2024-01-31',
  owner: 'Existing Owner',
  lineCount: 2,
};

function createHandlers(seed: OrderRecord[] = [baseOrder]) {
  let orders = seed;
  return {
    handlers: buildOrdersDemoHandlers({
      activeOrgId: 'org_1',
      getOrders: () => orders,
      setOrders: (next) => {
        orders = typeof next === 'function' ? next(orders) : next;
      },
    }),
    getOrders: () => orders,
  };
}

describe('buildOrdersDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseOrder, id: 'ord_1', orderNumber: 'SO-002', clientName: 'Bravo Client' },
      { ...baseOrder, id: 'ord_2', orderNumber: 'SO-001', clientName: 'Alpha Client' },
      { ...baseOrder, id: 'ord_3', orderNumber: 'SO-003', clientName: 'Charlie Client' },
    ]);

    await expect(
      handlers.list({ page: '1', pageSize: '2', sort: 'orderNumber' }),
    ).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'ord_2', orderNumber: 'SO-001' }),
        expect.objectContaining({ id: 'ord_1', orderNumber: 'SO-002' }),
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
        ...baseOrder,
        id: 'ord_1',
        orderNumber: 'SO-101',
        clientName: 'Apex Client',
        status: 'Confirmed',
        owner: 'Anna Hofer',
      },
      {
        ...baseOrder,
        id: 'ord_2',
        orderNumber: 'SO-102',
        clientName: 'Apex Client',
        status: 'Draft',
        owner: 'Anna Hofer',
      },
      {
        ...baseOrder,
        id: 'ord_3',
        orderNumber: 'SO-103',
        clientName: 'Kunz Client',
        status: 'Confirmed',
        owner: 'Markus Leitner',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-orderNumber',
      search: 'apex',
      status: 'Confirmed',
      owner: 'Anna Hofer',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'ord_1', orderNumber: 'SO-101' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate order numbers with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseOrder,
        orderNumber: ' so-001 ',
        clientName: 'Duplicate Client',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { orderNumber: 'An order with this number already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('updates and deletes orders through the API registry contract', async () => {
    const { getOrders, handlers } = createHandlers();

    const updated = await handlers.update(baseOrder.id, {
      orderNumber: ' SO-002 ',
      clientName: ' Updated Client ',
      owner: ' Updated Owner ',
      total: ' 1250 ',
    });

    expect(updated.orderNumber).toBe('SO-002');
    expect(updated.clientName).toBe('Updated Client');
    expect(updated.owner).toBe('Updated Owner');
    expect(updated.total).toBe('1250');
    expect(getOrders()).toEqual([updated]);

    await handlers.delete(baseOrder.id);

    expect(getOrders()).toEqual([]);
  });
});
