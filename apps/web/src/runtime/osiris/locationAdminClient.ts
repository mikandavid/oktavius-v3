import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisOrgLocation = {
  id: string;
  orgId: string | null;
  name: string;
  address: Record<string, unknown>;
  branchCode: string | null;
  designation: string | null;
  locality: string | null;
  category: string | null;
  phone: string | null;
  mobilePhone: string | null;
  fax: string | null;
  companyName: string | null;
  email: string | null;
  street: string | null;
  postalCode: string | null;
  isActive: boolean;
};

export type OsirisOrgLocationInput = Partial<{
  name: string;
  address: Record<string, unknown>;
  branchCode: string | null;
  designation: string | null;
  locality: string | null;
  category: string | null;
  phone: string | null;
  mobilePhone: string | null;
  fax: string | null;
  companyName: string | null;
  email: string | null;
  street: string | null;
  postalCode: string | null;
  isActive: boolean;
}>;

export type OsirisLocationAdminClientOptions = {
  baseUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeLocation(row: unknown): OsirisOrgLocation {
  const value = readRecord(row);
  return {
    id: readString(value.id),
    orgId: readStringOrNull(value.org_id ?? value.orgId),
    name: readString(value.name),
    address: readRecord(value.address),
    branchCode: readStringOrNull(value.branch_code ?? value.branchCode),
    designation: readStringOrNull(value.designation),
    locality: readStringOrNull(value.locality),
    category: readStringOrNull(value.category),
    phone: readStringOrNull(value.phone),
    mobilePhone: readStringOrNull(value.mobile_phone ?? value.mobilePhone),
    fax: readStringOrNull(value.fax),
    companyName: readStringOrNull(value.company_name ?? value.companyName),
    email: readStringOrNull(value.email),
    street: readStringOrNull(value.street),
    postalCode: readStringOrNull(value.postal_code ?? value.postalCode),
    isActive: value.is_active === false || value.isActive === false ? false : true,
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const payload: unknown = JSON.parse(text);
    if (isRecord(payload) && typeof payload.message === 'string') return payload.message;
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

async function readLocationResponse(response: Response): Promise<OsirisOrgLocation> {
  const payload: unknown = await response.json();
  return normalizeLocation(readRecord(payload).location);
}

export function createOsirisLocationAdminClient(options: OsirisLocationAdminClientOptions = {}) {
  return {
    async listOrgLocations(orgId: string): Promise<OsirisOrgLocation[]> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/orgs/${encodeURIComponent(orgId)}/locations`),
        { credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Locations could not be loaded.'));
      }
      const payload: unknown = await response.json();
      const locations = readRecord(payload).locations;
      return Array.isArray(locations) ? locations.map(normalizeLocation) : [];
    },

    async createOrgLocation(
      orgId: string,
      input: OsirisOrgLocationInput,
    ): Promise<OsirisOrgLocation> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/orgs/${encodeURIComponent(orgId)}/locations`),
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Location could not be created.'));
      }
      return readLocationResponse(response);
    },

    async updateOrgLocation(
      orgId: string,
      locationId: string,
      input: OsirisOrgLocationInput,
    ): Promise<OsirisOrgLocation> {
      const response = await fetch(
        joinOsirisApiBaseUrl(
          options.baseUrl,
          `/orgs/${encodeURIComponent(orgId)}/locations/${encodeURIComponent(locationId)}`,
        ),
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Location could not be saved.'));
      }
      return readLocationResponse(response);
    },

    async deactivateOrgLocation(orgId: string, locationId: string): Promise<OsirisOrgLocation> {
      return this.updateOrgLocation(orgId, locationId, { isActive: false });
    },
  };
}
