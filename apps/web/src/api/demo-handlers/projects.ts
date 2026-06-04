import type { Dispatch, SetStateAction } from 'react';

import type { ProjectRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ListResponse,
  type ProjectsHandlers,
  type ProjectsListParams,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildProjectsDemoHandlersOptions = {
  activeOrgId: string;
  getProjects: () => ProjectRecord[];
  setProjects: Dispatch<SetStateAction<ProjectRecord[]>>;
};

const PROJECT_SEARCH_KEYS: Array<keyof ProjectRecord> = ['name', 'clientName', 'manager'];

function matchesProject(row: ProjectRecord, params: ProjectsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    PROJECT_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesStatus = !params.status || row.status === params.status;
  const matchesManager = !params.manager || row.manager === params.manager;
  const matchesClient = !params.clientName || row.clientName === params.clientName;

  return matchesSearch && matchesStatus && matchesManager && matchesClient;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function validateProjectInput(
  input: Partial<Pick<ProjectRecord, 'budget' | 'clientName' | 'name'>>,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.name?.trim()) {
    fieldErrors.name = 'Project name is required.';
  }
  if (!input.clientName?.trim()) {
    fieldErrors.clientName = 'Client is required.';
  }

  const budget = Number(input.budget);
  if (input.budget != null && (!Number.isFinite(budget) || budget < 0)) {
    fieldErrors.budget = 'Budget must be a positive number.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Project could not be saved.', fieldErrors);
  }
}

function trimProject(input: ProjectRecord): ProjectRecord {
  return {
    ...input,
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    manager: input.manager.trim(),
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
    budget: input.budget.trim(),
    completion: clampPercent(input.completion),
  };
}

export function buildProjectsDemoHandlers({
  activeOrgId,
  getProjects,
  setProjects,
}: BuildProjectsDemoHandlersOptions): ProjectsHandlers {
  return {
    async list(params): Promise<ListResponse<ProjectRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'name';

      const filtered = sortRows(
        getProjects().filter((row) => matchesProject(row, params)),
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
      return getProjects().find((project) => project.id === id) ?? null;
    },

    async create(input) {
      validateProjectInput(input);
      const next = trimProject({
        orgId: activeOrgId,
        ...input,
        id: `prj_${Date.now()}`,
      });
      setProjects((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getProjects().find((project) => project.id === id);
      if (!existing) {
        throw new Error('Project not found.');
      }
      validateProjectInput({ ...existing, ...input });

      const updated = trimProject({ ...existing, ...input });
      setProjects((current) => current.map((project) => (project.id === id ? updated : project)));
      return updated;
    },

    async delete(id) {
      setProjects((current) => current.filter((project) => project.id !== id));
    },
  };
}
