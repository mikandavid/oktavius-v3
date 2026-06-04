import type { Dispatch, SetStateAction } from 'react';

import type { VendorRecord } from '@/app/demo-data';
import { type VendorsHandlers, type VendorsListParams, type ListResponse } from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildVendorsDemoHandlersOptions = {
  activeOrgId: string;
  getVendors: () => VendorRecord[];
  setVendors: Dispatch<SetStateAction<VendorRecord[]>>;
};

function matches(row: VendorRecord, params: VendorsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    [row.name, row.email, row.city].some((v) => v.toLowerCase().includes(search));
  const matchesStatus = !params.status || row.status === params.status;
  const matchesCategory = !params.category || row.category === params.category;
  return matchesSearch && matchesStatus && matchesCategory;
}

export function buildVendorsDemoHandlers({
  activeOrgId,
  getVendors,
  setVendors,
}: BuildVendorsDemoHandlersOptions): VendorsHandlers {
  return {
    async list(params): Promise<ListResponse<VendorRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const filtered = sortRows(
        getVendors().filter((row) => matches(row, params)),
        params.sort ?? 'name',
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
      return getVendors().find((r) => r.id === id) ?? null;
    },

    async create(input) {
      const next: VendorRecord = {
        orgId: activeOrgId,
        ...input,
        id: `vnd_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setVendors((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getVendors().find((r) => r.id === id);
      if (!existing) throw new Error('Vendor not found.');
      const updated = { ...existing, ...input };
      setVendors((current) => current.map((r) => (r.id === id ? updated : r)));
      return updated;
    },

    async delete(id) {
      setVendors((current) => current.filter((r) => r.id !== id));
    },
  };
}
