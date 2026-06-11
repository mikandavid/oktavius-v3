import { describe, expect, it } from 'vitest';

import type { ClientRecord, OrderRecord } from '@/app/demo-data';

import { createDemoClientsSearchProvider, createDemoOrdersSearchProvider } from './demoEntities';

describe('demo entity search providers', () => {
  it('searches scoped demo clients', async () => {
    const provider = createDemoClientsSearchProvider([
      { id: 'cli_1', name: 'Apex GmbH', email: 'hello@apex.test', status: 'Active' },
      { id: 'cli_2', name: 'Bruckner Consulting', email: 'office@bruckner.test', status: 'Lead' },
    ] as unknown as ClientRecord[]);

    const results = await provider.search('apex', new AbortController().signal);

    expect(results).toMatchObject([
      {
        title: 'Apex GmbH',
        href: '/clients/cli_1',
        groupId: 'Clients',
      },
    ]);
  });

  it('searches scoped demo orders', async () => {
    const provider = createDemoOrdersSearchProvider([
      {
        id: 'ord_1',
        orderNumber: 'SO-100',
        clientName: 'Apex GmbH',
        status: 'Draft',
      },
    ] as unknown as OrderRecord[]);

    const results = await provider.search('SO-100', new AbortController().signal);

    expect(results[0]).toMatchObject({
      title: 'SO-100',
      href: '/orders/ord_1',
      groupId: 'Orders',
    });
  });
});
