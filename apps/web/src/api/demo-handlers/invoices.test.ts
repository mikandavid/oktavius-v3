import { describe, expect, it } from 'vitest';

import type { InvoiceRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildInvoicesDemoHandlers } from './invoices';

const baseInvoice: InvoiceRecord = {
  id: 'inv_1',
  orgId: 'org_1',
  invoiceNumber: 'INV-001',
  clientName: 'Existing Client',
  orderNumber: 'SO-001',
  status: 'Sent',
  amount: '1000',
  issuedAt: '2024-01-01',
  dueAt: '2024-01-31',
};

function createHandlers(seed: InvoiceRecord[] = [baseInvoice]) {
  let invoices = seed;
  return {
    handlers: buildInvoicesDemoHandlers({
      activeOrgId: 'org_1',
      getInvoices: () => invoices,
      setInvoices: (next) => {
        invoices = typeof next === 'function' ? next(invoices) : next;
      },
    }),
    getInvoices: () => invoices,
  };
}

describe('buildInvoicesDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseInvoice, id: 'inv_1', invoiceNumber: 'INV-002', clientName: 'Bravo Client' },
      { ...baseInvoice, id: 'inv_2', invoiceNumber: 'INV-001', clientName: 'Alpha Client' },
      { ...baseInvoice, id: 'inv_3', invoiceNumber: 'INV-003', clientName: 'Charlie Client' },
    ]);

    await expect(
      handlers.list({ page: '1', pageSize: '2', sort: 'invoiceNumber' }),
    ).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'inv_2', invoiceNumber: 'INV-001' }),
        expect.objectContaining({ id: 'inv_1', invoiceNumber: 'INV-002' }),
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
        ...baseInvoice,
        id: 'inv_1',
        invoiceNumber: 'INV-101',
        clientName: 'Apex Client',
        status: 'Sent',
      },
      {
        ...baseInvoice,
        id: 'inv_2',
        invoiceNumber: 'INV-102',
        clientName: 'Apex Client',
        status: 'Paid',
      },
      {
        ...baseInvoice,
        id: 'inv_3',
        invoiceNumber: 'INV-103',
        clientName: 'Kunz Client',
        status: 'Sent',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-invoiceNumber',
      search: 'apex',
      status: 'Sent',
      clientName: 'Apex Client',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'inv_1', invoiceNumber: 'INV-101' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate invoice numbers with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseInvoice,
        invoiceNumber: ' inv-001 ',
        clientName: 'Duplicate Client',
      } as unknown as Parameters<typeof handlers.create>[0]),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { invoiceNumber: 'An invoice with this number already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('updates invoices through the API registry contract', async () => {
    const { getInvoices, handlers } = createHandlers();

    const updated = await handlers.update(baseInvoice.id, {
      invoiceNumber: ' INV-002 ',
      clientName: ' Updated Client ',
      amount: ' 1250 ',
    });

    expect(updated.invoiceNumber).toBe('INV-002');
    expect(updated.clientName).toBe('Updated Client');
    expect(updated.amount).toBe('1250');
    expect(getInvoices()).toEqual([updated]);
  });
});
