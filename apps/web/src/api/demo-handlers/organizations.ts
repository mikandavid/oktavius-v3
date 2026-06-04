import type { Dispatch, SetStateAction } from 'react';

import type { OrganizationRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ListResponse,
  type OrganizationsHandlers,
  type OrganizationsListParams,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildOrganizationsDemoHandlersOptions = {
  getOrganizations: () => OrganizationRecord[];
  setOrganizations: Dispatch<SetStateAction<OrganizationRecord[]>>;
};

const ORGANIZATION_SEARCH_KEYS: Array<keyof OrganizationRecord> = [
  'name',
  'slug',
  'region',
  'ownerName',
  'billingEmail',
];

function matchesOrganization(row: OrganizationRecord, params: OrganizationsListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    ORGANIZATION_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesPlan = !params.plan || row.plan === params.plan;
  const matchesStatus = !params.status || row.status === params.status;
  const matchesEnvironment = !params.environment || row.environment === params.environment;

  return matchesSearch && matchesPlan && matchesStatus && matchesEnvironment;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function validateOrganizationInput(
  organizations: OrganizationRecord[],
  input: Partial<Pick<OrganizationRecord, 'billingEmail' | 'name' | 'slug'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.name?.trim()) {
    fieldErrors.name = 'Organization name is required.';
  }
  if (!input.slug?.trim()) {
    fieldErrors.slug = 'Slug is required.';
  }

  const slug = normalizeText(input.slug);
  if (
    slug &&
    organizations.some(
      (organization) => organization.id !== currentId && normalizeText(organization.slug) === slug,
    )
  ) {
    fieldErrors.slug = 'An organization with this slug already exists.';
  }

  const billingEmail = normalizeText(input.billingEmail);
  if (
    billingEmail &&
    organizations.some(
      (organization) =>
        organization.id !== currentId && normalizeText(organization.billingEmail) === billingEmail,
    )
  ) {
    fieldErrors.billingEmail = 'An organization with this billing email already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Organization could not be saved.', fieldErrors);
  }
}

export function buildOrganizationsDemoHandlers({
  getOrganizations,
  setOrganizations,
}: BuildOrganizationsDemoHandlersOptions): OrganizationsHandlers {
  return {
    async list(params): Promise<ListResponse<OrganizationRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'name';

      const filtered = sortRows(
        getOrganizations().filter((row) => matchesOrganization(row, params)),
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
      return getOrganizations().find((organization) => organization.id === id) ?? null;
    },

    async create(input) {
      validateOrganizationInput(getOrganizations(), input);
      const next: OrganizationRecord = {
        ...input,
        id: `org_${Date.now()}`,
        memberCount: 1,
        createdAt: new Date().toISOString().slice(0, 10),
        name: input.name.trim(),
        slug: input.slug.trim(),
        billingEmail: input.billingEmail.trim(),
      };
      setOrganizations((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getOrganizations().find((organization) => organization.id === id);
      if (!existing) {
        throw new Error('Organization not found.');
      }
      validateOrganizationInput(getOrganizations(), { ...existing, ...input }, id);

      const updated: OrganizationRecord = {
        ...existing,
        ...input,
        name: input.name == null ? existing.name : input.name.trim(),
        slug: input.slug == null ? existing.slug : input.slug.trim(),
        billingEmail:
          input.billingEmail == null ? existing.billingEmail : input.billingEmail.trim(),
      };
      setOrganizations((current) =>
        current.map((organization) => (organization.id === id ? updated : organization)),
      );
      return updated;
    },

    async delete(id) {
      setOrganizations((current) => current.filter((organization) => organization.id !== id));
    },
  };
}
