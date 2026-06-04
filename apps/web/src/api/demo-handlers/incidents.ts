import type { Dispatch, SetStateAction } from 'react';

import type { IncidentRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type IncidentsHandlers,
  type IncidentsListParams,
  type ListResponse,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildIncidentsDemoHandlersOptions = {
  activeOrgId: string;
  getIncidents: () => IncidentRecord[];
  setIncidents: Dispatch<SetStateAction<IncidentRecord[]>>;
};

const INCIDENT_SEARCH_KEYS: Array<keyof IncidentRecord> = [
  'incidentNumber',
  'title',
  'service',
  'assignee',
  'impact',
];

function matchesIncident(row: IncidentRecord, params: IncidentsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    INCIDENT_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesSeverity = !params.severity || row.severity === params.severity;
  const matchesStatus = !params.status || row.status === params.status;
  const matchesService = !params.service || row.service === params.service;

  return matchesSearch && matchesSeverity && matchesStatus && matchesService;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function validateIncidentInput(
  incidents: IncidentRecord[],
  input: Partial<Pick<IncidentRecord, 'incidentNumber' | 'service' | 'title'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.title?.trim()) {
    fieldErrors.title = 'Title is required.';
  }
  if (!input.incidentNumber?.trim()) {
    fieldErrors.incidentNumber = 'Incident number is required.';
  }
  if (!input.service?.trim()) {
    fieldErrors.service = 'Service is required.';
  }

  const incidentNumber = normalizeText(input.incidentNumber);
  if (
    incidentNumber &&
    incidents.some(
      (incident) =>
        incident.id !== currentId && normalizeText(incident.incidentNumber) === incidentNumber,
    )
  ) {
    fieldErrors.incidentNumber = 'An incident with this number already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Incident could not be saved.', fieldErrors);
  }
}

function trimIncident(input: IncidentRecord): IncidentRecord {
  return {
    ...input,
    incidentNumber: input.incidentNumber.trim(),
    title: input.title.trim(),
    service: input.service.trim(),
    assignee: input.assignee.trim(),
    reportedAt: input.reportedAt.trim(),
    impact: input.impact.trim(),
  };
}

export function buildIncidentsDemoHandlers({
  activeOrgId,
  getIncidents,
  setIncidents,
}: BuildIncidentsDemoHandlersOptions): IncidentsHandlers {
  return {
    async list(params): Promise<ListResponse<IncidentRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'reportedAt';

      const filtered = sortRows(
        getIncidents().filter((row) => matchesIncident(row, params)),
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
      return getIncidents().find((incident) => incident.id === id) ?? null;
    },

    async create(input) {
      validateIncidentInput(getIncidents(), input);
      const next = trimIncident({
        orgId: activeOrgId,
        ...input,
        id: `inc_${Date.now()}`,
      });
      setIncidents((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getIncidents().find((incident) => incident.id === id);
      if (!existing) {
        throw new Error('Incident not found.');
      }
      validateIncidentInput(getIncidents(), { ...existing, ...input }, id);

      const updated = trimIncident({ ...existing, ...input });
      setIncidents((current) =>
        current.map((incident) => (incident.id === id ? updated : incident)),
      );
      return updated;
    },

    async delete(id) {
      setIncidents((current) => current.filter((incident) => incident.id !== id));
    },
  };
}
