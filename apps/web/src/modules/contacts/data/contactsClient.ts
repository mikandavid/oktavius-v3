import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

import type {
  Contact,
  ContactCategory,
  ContactInput,
  ListContactsParams,
  ListContactsResult,
} from './types';

function normalizeContact(value: unknown): Contact {
  const v = readRecord(value);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    name: readString(v.name),
    isBusiness: Boolean(v.is_business ?? v.isBusiness ?? false),
    email: readString(v.email),
    phone: readString(v.phone),
    mobile: readString(v.mobile),
    fax: readString(v.fax),
    linkedin: readString(v.linkedin),
    addressLine1: readString(v.address_line1 ?? v.addressLine1),
    addressLine2: readString(v.address_line2 ?? v.addressLine2),
    city: readString(v.city),
    state: readString(v.state),
    postalCode: readString(v.postal_code ?? v.postalCode),
    country: readString(v.country),
    clientCode: readString(v.client_code ?? v.clientCode),
    categoryIds: readStringArray(v.category_ids ?? v.categoryIds),
    tags: readStringArray(v.tags),
    notes: readString(v.notes),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function normalizeCategory(value: unknown): ContactCategory {
  const v = readRecord(value);
  return { id: readString(v.id), name: readString(v.name) };
}

function toPayload(input: ContactInput): Record<string, unknown> {
  return {
    name: input.name,
    isBusiness: input.isBusiness,
    email: input.email,
    phone: input.phone,
    mobile: input.mobile,
    fax: input.fax,
    linkedin: input.linkedin,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    clientCode: input.clientCode,
    categoryIds: input.categoryIds,
    tags: input.tags,
    notes: input.notes,
  };
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    sp.set(key, String(value));
  }
  const query = sp.toString();
  return query ? `?${query}` : '';
}

export function createContactsClient({ baseUrl }: { baseUrl: string }) {
  const url = (path: string) => joinOsirisApiBaseUrl(baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function sendJson(
    method: 'POST' | 'PATCH',
    path: string,
    body: unknown,
    fallback: string,
  ): Promise<unknown> {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async listContacts(params: ListContactsParams = {}): Promise<ListContactsResult> {
      const query = buildQuery({
        page: params.page,
        pageSize: params.pageSize,
        sort: params.sort,
        search: params.search,
      });
      const raw = readRecord(await getJson(`/contacts${query}`, 'Failed to load contacts.'));
      const data = Array.isArray(raw.data) ? raw.data.map(normalizeContact) : [];
      return {
        data,
        total: readNumber(raw.total, data.length),
        totalPages: readNumber(raw.totalPages ?? raw.total_pages, 1),
      };
    },

    async getContact(id: string): Promise<Contact> {
      return normalizeContact(
        await getJson(`/contacts/${encodeURIComponent(id)}`, 'Failed to load contact.'),
      );
    },

    async createContact(input: ContactInput): Promise<Contact> {
      return normalizeContact(
        await sendJson('POST', '/contacts', toPayload(input), 'Failed to create contact.'),
      );
    },

    async updateContact(id: string, input: ContactInput): Promise<Contact> {
      return normalizeContact(
        await sendJson(
          'PATCH',
          `/contacts/${encodeURIComponent(id)}`,
          toPayload(input),
          'Failed to update contact.',
        ),
      );
    },

    async deleteContact(id: string): Promise<void> {
      const response = await fetch(url(`/contacts/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Failed to delete contact.'));
    },

    async listCategories(): Promise<ContactCategory[]> {
      const raw = readRecord(await getJson('/contacts/categories', 'Failed to load categories.'));
      return Array.isArray(raw.data) ? raw.data.map(normalizeCategory) : [];
    },
  };
}

export type ContactsClient = ReturnType<typeof createContactsClient>;
