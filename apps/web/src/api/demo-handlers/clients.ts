import type { Dispatch, SetStateAction } from 'react';

import type { ClientRecord } from '@/app/demo-data';
import type { ClientsHandlers, ClientsListParams, ListResponse } from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildClientsDemoHandlersOptions = {
  getClients: () => ClientRecord[];
  setClients: Dispatch<SetStateAction<ClientRecord[]>>;
};

const CLIENT_SEARCH_KEYS: Array<keyof ClientRecord> = [
  'name',
  'email',
  'industry',
  'city',
  'country',
];

function matchesClient(row: ClientRecord, params: ClientsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    CLIENT_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesStatus = !params.status || row.status === params.status;
  const matchesType = !params.type || row.type === params.type;

  return matchesSearch && matchesStatus && matchesType;
}

export function buildClientsDemoHandlers({
  getClients,
  setClients,
}: BuildClientsDemoHandlersOptions): ClientsHandlers {
  return {
    async list(params): Promise<ListResponse<ClientRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'name';

      const filtered = sortRows(
        getClients().filter((row) => matchesClient(row, params)),
        sort,
      );
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        total,
        totalPages,
        page: safePage,
        pageSize,
      };
    },

    async get(id) {
      return getClients().find((client) => client.id === id) ?? null;
    },

    async delete(id) {
      setClients((current) => current.filter((client) => client.id !== id));
    },
  };
}
