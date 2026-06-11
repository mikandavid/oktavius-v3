import type { ClientRecord, OrderRecord } from '@/app/demo-data';

import type { SearchProvider, SearchResult } from '../types';
import { limitResults, matchesSearch } from './utils';

export function createDemoClientsSearchProvider(clients: ClientRecord[]): SearchProvider {
  return {
    id: 'clients',
    label: 'Clients',
    search: async (query, signal) => {
      if (signal.aborted) return [];
      return limitResults(
        clients
          .filter((client) => matchesSearch(query, client.name, client.email, client.status))
          .map<SearchResult>((client) => ({
            id: client.id,
            title: client.name,
            subtitle: [client.email, client.status].filter(Boolean).join(' · '),
            href: `/clients/${client.id}`,
            groupId: 'Clients',
          })),
      );
    },
  };
}

export function createDemoOrdersSearchProvider(orders: OrderRecord[]): SearchProvider {
  return {
    id: 'orders',
    label: 'Orders',
    search: async (query, signal) => {
      if (signal.aborted) return [];
      return limitResults(
        orders
          .filter((order) =>
            matchesSearch(query, order.orderNumber, order.clientName, order.status),
          )
          .map<SearchResult>((order) => ({
            id: order.id,
            title: order.orderNumber,
            subtitle: [order.clientName, order.status].filter(Boolean).join(' · '),
            href: `/orders/${order.id}`,
            groupId: 'Orders',
          })),
      );
    },
  };
}
