import type { Dispatch, SetStateAction } from 'react';

import type { StaffRecord } from '@/app/demo-data';
import { type StaffHandlers, type StaffListParams, type ListResponse } from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildStaffDemoHandlersOptions = {
  activeOrgId: string;
  getStaff: () => StaffRecord[];
  setStaff: Dispatch<SetStateAction<StaffRecord[]>>;
};

function matches(row: StaffRecord, params: StaffListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const fullName = `${row.firstName} ${row.lastName}`.toLowerCase();
  const matchesSearch =
    search.length === 0 ||
    fullName.includes(search) ||
    [row.email, row.position, row.department].some((v) => v.toLowerCase().includes(search));
  const matchesStatus = !params.status || row.status === params.status;
  const matchesDept = !params.department || row.department === params.department;
  const matchesType = !params.employmentType || row.employmentType === params.employmentType;
  return matchesSearch && matchesStatus && matchesDept && matchesType;
}

export function buildStaffDemoHandlers({
  activeOrgId,
  getStaff,
  setStaff,
}: BuildStaffDemoHandlersOptions): StaffHandlers {
  return {
    async list(params): Promise<ListResponse<StaffRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const filtered = sortRows(
        getStaff().filter((row) => matches(row, params)),
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
      return getStaff().find((r) => r.id === id) ?? null;
    },

    async create(input) {
      const next: StaffRecord = {
        orgId: activeOrgId,
        ...input,
        id: `stf_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setStaff((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getStaff().find((r) => r.id === id);
      if (!existing) throw new Error('Staff member not found.');
      const updated = { ...existing, ...input };
      setStaff((current) => current.map((r) => (r.id === id ? updated : r)));
      return updated;
    },

    async delete(id) {
      setStaff((current) => current.filter((r) => r.id !== id));
    },
  };
}
