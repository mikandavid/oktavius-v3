import type { Dispatch, SetStateAction } from 'react';

import type { PurchaseOrderRecord } from '@/app/demo-data';
import {
  type PurchasingHandlers,
  type PurchasingListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildPurchasingDemoHandlersOptions = {
  activeOrgId: string;
  getPurchaseOrders: () => PurchaseOrderRecord[];
  setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrderRecord[]>>;
};

function matches(row: PurchaseOrderRecord, params: PurchasingListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    [row.poNumber, row.vendorName].some((v) => v.toLowerCase().includes(search));
  const matchesStatus = !params.status || row.status === params.status;
  const matchesReqBy = !params.requestedBy || row.requestedBy === params.requestedBy;
  return matchesSearch && matchesStatus && matchesReqBy;
}

export function buildPurchasingDemoHandlers({
  activeOrgId,
  getPurchaseOrders,
  setPurchaseOrders,
}: BuildPurchasingDemoHandlersOptions): PurchasingHandlers {
  return {
    async list(params): Promise<ListResponse<PurchaseOrderRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const filtered = sortRows(
        getPurchaseOrders().filter((row) => matches(row, params)),
        params.sort ?? 'createdAt',
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
      return getPurchaseOrders().find((r) => r.id === id) ?? null;
    },

    async create(input) {
      const seq = String(Date.now()).slice(-4);
      const next: PurchaseOrderRecord = {
        orgId: activeOrgId,
        ...input,
        id: `po_${Date.now()}`,
        poNumber: `PO-${new Date().getFullYear()}-${seq}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setPurchaseOrders((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getPurchaseOrders().find((r) => r.id === id);
      if (!existing) throw new Error('Purchase order not found.');
      const updated = { ...existing, ...input };
      setPurchaseOrders((current) => current.map((r) => (r.id === id ? updated : r)));
      return updated;
    },

    async delete(id) {
      setPurchaseOrders((current) => current.filter((r) => r.id !== id));
    },
  };
}
