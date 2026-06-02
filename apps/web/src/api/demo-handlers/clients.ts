import type { Dispatch, SetStateAction } from 'react';

import type { ClientRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ClientsHandlers,
  type ClientsListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildClientsDemoHandlersOptions = {
  activeOrgId: string;
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

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? '';
}

function validateClientInput(
  clients: ClientRecord[],
  input: Partial<Pick<ClientRecord, 'email' | 'name'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.name?.trim()) {
    fieldErrors.name = 'Client name is required.';
  }

  const email = normalizeEmail(input.email);
  if (
    email &&
    clients.some((client) => client.id !== currentId && normalizeEmail(client.email) === email)
  ) {
    fieldErrors.email = 'A client with this email already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Client could not be saved.', fieldErrors);
  }
}

export function buildClientsDemoHandlers({
  activeOrgId,
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

    async create(input) {
      validateClientInput(getClients(), input);
      const next: ClientRecord = {
        orgId: activeOrgId,
        ...input,
        id: `cli_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
        email: input.email.trim(),
      };
      setClients((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getClients().find((client) => client.id === id);
      if (!existing) {
        throw new Error('Client not found.');
      }
      validateClientInput(getClients(), { ...existing, ...input }, id);

      const updated: ClientRecord = {
        ...existing,
        ...input,
        email: input.email == null ? existing.email : input.email.trim(),
      };
      setClients((current) => current.map((client) => (client.id === id ? updated : client)));
      return updated;
    },

    async delete(id) {
      setClients((current) => current.filter((client) => client.id !== id));
    },
  };
}
