import type { Dispatch, SetStateAction } from 'react';

import type { LeadRecord } from '@/app/demo-data';
import { type LeadsHandlers, type LeadsListParams, type ListResponse } from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildLeadsDemoHandlersOptions = {
  activeOrgId: string;
  getLeads: () => LeadRecord[];
  setLeads: Dispatch<SetStateAction<LeadRecord[]>>;
};

function matches(row: LeadRecord, params: LeadsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    [row.title, row.company, row.contactName].some((v) => v.toLowerCase().includes(search));
  const matchesStage = !params.stage || row.stage === params.stage;
  const matchesAssigned = !params.assignedTo || row.assignedTo === params.assignedTo;
  const matchesSource = !params.source || row.source === params.source;
  return matchesSearch && matchesStage && matchesAssigned && matchesSource;
}

export function buildLeadsDemoHandlers({
  activeOrgId,
  getLeads,
  setLeads,
}: BuildLeadsDemoHandlersOptions): LeadsHandlers {
  return {
    async list(params): Promise<ListResponse<LeadRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const filtered = sortRows(
        getLeads().filter((row) => matches(row, params)),
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
      return getLeads().find((r) => r.id === id) ?? null;
    },

    async create(input) {
      const next: LeadRecord = {
        orgId: activeOrgId,
        ...input,
        id: `lead_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setLeads((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getLeads().find((r) => r.id === id);
      if (!existing) throw new Error('Lead not found.');
      const updated = { ...existing, ...input };
      setLeads((current) => current.map((r) => (r.id === id ? updated : r)));
      return updated;
    },

    async updateStage(id, stage) {
      const existing = getLeads().find((r) => r.id === id);
      if (!existing) throw new Error('Lead not found.');
      const updated = { ...existing, stage };
      setLeads((current) => current.map((r) => (r.id === id ? updated : r)));
      return updated;
    },

    async delete(id) {
      setLeads((current) => current.filter((r) => r.id !== id));
    },
  };
}
