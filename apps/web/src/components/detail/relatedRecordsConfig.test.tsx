import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import {
  GeneratedRelatedRecordsPanel,
  buildRelatedRecordItems,
  type RelatedRecordsConfig,
} from './relatedRecordsConfig';

type Client = { id: string; name: string };
type Order = { id: string; clientId: string; number: string; status: string };

const client: Client = { id: 'cli_1', name: 'Apex' };
const orders: Order[] = [
  { id: 'ord_1', clientId: 'cli_1', number: 'SO-001', status: 'Open' },
  { id: 'ord_2', clientId: 'cli_2', number: 'SO-002', status: 'Closed' },
];

const config: RelatedRecordsConfig<Client, Order> = {
  title: 'Orders',
  emptyLabel: 'No orders yet.',
  viewAllHref: '/orders',
  match: (parent, order) => order.clientId === parent.id,
  item: (order) => ({
    id: order.id,
    title: order.number,
    subtitle: order.status,
    href: `/orders/${order.id}`,
  }),
};

describe('related records config', () => {
  it('builds linked related-record items from a generated relation config', () => {
    expect(buildRelatedRecordItems(config, client, orders)).toEqual([
      {
        id: 'ord_1',
        title: 'SO-001',
        subtitle: 'Open',
        href: '/orders/ord_1',
      },
    ]);
  });

  it('renders a RelatedRecordsPanel from the generated relation config', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <GeneratedRelatedRecordsPanel config={config} parent={client} rows={orders} />
      </MemoryRouter>,
    );

    expect(markup).toContain('Orders');
    expect(markup).toContain('SO-001');
    expect(markup).not.toContain('SO-002');
  });
});
