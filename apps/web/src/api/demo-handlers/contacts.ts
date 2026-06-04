import type { Dispatch, SetStateAction } from 'react';

import type { ContactRecord } from '@/app/demo-data';
import {
  type ContactsHandlers,
  type ContactsListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildContactsDemoHandlersOptions = {
  activeOrgId: string;
  getContacts: () => ContactRecord[];
  setContacts: Dispatch<SetStateAction<ContactRecord[]>>;
};

const SEARCH_KEYS: Array<keyof ContactRecord> = ['firstName', 'lastName', 'email', 'role'];

function matches(row: ContactRecord, params: ContactsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const fullName = `${row.firstName} ${row.lastName}`.toLowerCase();
  const matchesSearch =
    search.length === 0 ||
    fullName.includes(search) ||
    SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );
  const matchesStatus = !params.status || row.status === params.status;
  const matchesClient = !params.clientId || row.clientId === params.clientId;
  return matchesSearch && matchesStatus && matchesClient;
}

export function buildContactsDemoHandlers({
  activeOrgId,
  getContacts,
  setContacts,
}: BuildContactsDemoHandlersOptions): ContactsHandlers {
  return {
    async list(params): Promise<ListResponse<ContactRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const filtered = sortRows(
        getContacts().filter((row) => matches(row, params)),
        params.sort ?? 'lastName',
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
      return getContacts().find((r) => r.id === id) ?? null;
    },

    async create(input) {
      const next: ContactRecord = {
        orgId: activeOrgId,
        ...input,
        id: `cnt_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setContacts((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getContacts().find((r) => r.id === id);
      if (!existing) throw new Error('Contact not found.');
      const updated = { ...existing, ...input };
      setContacts((current) => current.map((r) => (r.id === id ? updated : r)));
      return updated;
    },

    async delete(id) {
      setContacts((current) => current.filter((r) => r.id !== id));
    },
  };
}
