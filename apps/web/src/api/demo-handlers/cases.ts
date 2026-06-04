import type { Dispatch, SetStateAction } from 'react';

import type { CaseRecord, ClientRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type CasesHandlers,
  type CasesListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildCasesDemoHandlersOptions = {
  activeOrgId: string;
  industryKey: 'generic' | 'funeral';
  getCases: () => CaseRecord[];
  getClients: () => ClientRecord[];
  setCases: Dispatch<SetStateAction<CaseRecord[]>>;
};

const VALID_CASE_STAGES: ReadonlySet<CaseRecord['stage']> = new Set([
  'Intake',
  'Investigation',
  'Resolution',
  'Closed',
  'Aufnahme',
  'Planung',
  'Durchführung',
  'Abgeschlossen',
]);

const CASE_SEARCH_KEYS: Array<keyof CaseRecord> = [
  'caseNumber',
  'title',
  'clientName',
  'assignee',
  'summary',
  'deceasedName',
  'locationSite',
];

function matchesCase(row: CaseRecord, params: CasesListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    CASE_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesType = !params.type || row.type === params.type;
  const matchesStage = !params.stage || row.stage === params.stage;
  const matchesPriority = !params.priority || row.priority === params.priority;

  return matchesSearch && matchesType && matchesStage && matchesPriority;
}

function resolveClient(clients: ClientRecord[], clientName: string) {
  return clients.find((client) => client.name === clientName.trim()) ?? null;
}

function validateCaseInput(
  clients: ClientRecord[],
  input: Partial<Pick<CaseRecord, 'clientName' | 'title'>>,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.title?.trim()) {
    fieldErrors.title = 'Case title is required.';
  }

  if (input.clientName?.trim() && !resolveClient(clients, input.clientName)) {
    fieldErrors.clientName = 'Select an existing client.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Case could not be saved.', fieldErrors);
  }
}

function buildCaseNumber(industryKey: 'generic' | 'funeral') {
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-4);
  return industryKey === 'funeral' ? `KUNZ-${year}-${seq}` : `CASE-${year}-${seq}`;
}

export function buildCasesDemoHandlers({
  activeOrgId,
  industryKey,
  getCases,
  getClients,
  setCases,
}: BuildCasesDemoHandlersOptions): CasesHandlers {
  return {
    async list(params): Promise<ListResponse<CaseRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'caseNumber';

      const filtered = sortRows(
        getCases().filter((row) => matchesCase(row, params)),
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
      return getCases().find((caseRecord) => caseRecord.id === id) ?? null;
    },

    async create(input) {
      const clients = getClients();
      validateCaseInput(clients, input);
      const client = input.clientName ? resolveClient(clients, input.clientName) : null;
      const next: CaseRecord = {
        orgId: activeOrgId,
        ...input,
        ...(client ? { clientId: client.id, clientName: client.name } : {}),
        id: `case_${Date.now()}`,
        caseNumber: buildCaseNumber(industryKey),
        openedAt: new Date().toISOString().slice(0, 10),
        slaStatus: 'ok',
        title: input.title.trim(),
      };
      setCases((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getCases().find((caseRecord) => caseRecord.id === id);
      if (!existing) {
        throw new Error('Case not found.');
      }

      const clients = getClients();
      validateCaseInput(clients, { ...existing, ...input });
      const client = input.clientName ? resolveClient(clients, input.clientName) : null;
      const updated: CaseRecord = {
        ...existing,
        ...input,
        ...(client ? { clientId: client.id, clientName: client.name } : {}),
        title: input.title == null ? existing.title : input.title.trim(),
      };
      setCases((current) =>
        current.map((caseRecord) => (caseRecord.id === id ? updated : caseRecord)),
      );
      return updated;
    },

    async updateStage(id, stage) {
      if (!VALID_CASE_STAGES.has(stage)) {
        throw new Error('Invalid case stage.');
      }
      const existing = getCases().find((caseRecord) => caseRecord.id === id);
      if (!existing) {
        throw new Error('Case not found.');
      }
      const updated = { ...existing, stage };
      setCases((current) =>
        current.map((caseRecord) => (caseRecord.id === id ? updated : caseRecord)),
      );
      return updated;
    },

    async delete(id) {
      setCases((current) => current.filter((caseRecord) => caseRecord.id !== id));
    },
  };
}
