# Contacts Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class Contacts module to oktavius-v3 — a full-page list → detail/create/edit CRUD experience wired to the real osiris `/contacts` API.

**Architecture:** One registered route (`/contacts`) hosting three views (list, detail, create/edit) selected by nuqs query params (`id`, `mode`). Data flows through a `contactsClient` (fetch + snake→camel normalization) and React Query hooks scoped by `activeOrgId`. The list reuses `CrudListShell` + `useListPageState` (client-side search/filter/sort/paginate) and gets selectable rows, bulk delete, and per-row delete with built-in confirm dialogs from `buildStandardListCrudActions`. Create/edit use `EntityForm`; detail uses `DetailView`. Everything renders inside `ModulePage`.

**Tech Stack:** React 19, TypeScript, TanStack React Query, nuqs, react-router v7, Tailwind (semantic tokens), `@oktavius/base-ui`, Vitest + React Testing Library.

**Key references (read before starting):**

- Data-layer pattern: `apps/web/src/modules/support/data/{supportClient.ts,supportKeys.ts,useSupportData.ts,types.ts}`
- List wiring: `apps/web/src/modules/support/SupportTicketList.tsx`, `apps/web/src/components/data/CrudListShell.tsx`, `apps/web/src/lib/useListPageState.ts`, `apps/web/src/components/data/standardListCrud.tsx`
- Shared column/filter pattern: `apps/web/src/modules/support/shared.tsx`
- Form: `apps/web/src/components/forms/EntityForm.tsx`, field types `apps/web/src/lib/forms/types.ts`, result type `apps/web/src/lib/formValidation.ts`
- Spec: `docs/superpowers/specs/2026-06-16-contacts-module-design.md`

**Conventions that MUST hold (design system):** `ModulePage`/`CrudMainView` with `icon`; white `bg-card` tiles, no borders/shadow on surfaces; `Combobox`/multiselect (never `Select`); icons only from `@/lib/icons`; no custom `<table>`; no `window.confirm`; exactly one `cta` per header; `pnpm lint` clean.

---

## File structure

**Create:**

```
apps/web/src/modules/contacts/
  data/types.ts
  data/contactsKeys.ts
  data/contactsClient.ts
  data/contactsClient.test.ts
  data/useContactsData.ts
  shared.tsx
  shared.test.ts
  ContactsListView.tsx
  ContactsListView.test.tsx
  ContactDetailView.tsx
  ContactFormView.tsx
  ContactFormView.test.tsx
  ContactsPage.tsx
packages/i18n/locales/en/contacts.json
```

**Modify:**

```
apps/web/src/lib/appNavModules.ts          # add the contacts entry + icon import
packages/i18n/locales/en/navigation.json   # add "contacts" label if missing
<i18n namespace registry>                   # register 'contacts' namespace (Task 8)
```

**Test command (run from `apps/web/`):** `pnpm vitest run <path>`
**Lint (repo root):** `pnpm lint`

---

## Task 1: Data types & query keys

**Files:**

- Create: `apps/web/src/modules/contacts/data/types.ts`
- Create: `apps/web/src/modules/contacts/data/contactsKeys.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
export type Contact = {
  id: string;
  orgId: string | null;
  name: string;
  isBusiness: boolean;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  linkedin: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  clientCode: string;
  categoryIds: string[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactCategory = { id: string; name: string };

export type ListContactsParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
};

export type ListContactsResult = {
  data: Contact[];
  total: number;
  totalPages: number;
};

/** Write payload for create + update (no id/org/timestamps). */
export type ContactInput = {
  name: string;
  isBusiness: boolean;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  linkedin: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  clientCode: string;
  categoryIds: string[];
  tags: string[];
  notes: string;
};
```

- [ ] **Step 2: Write `contactsKeys.ts`**

```ts
import type { ListContactsParams } from './types';

type OrgId = string | null;

export const contactsKeys = {
  root: (org: OrgId) => ['contacts', org] as const,
  list: (org: OrgId, params: ListContactsParams) => ['contacts', org, 'list', params] as const,
  detail: (org: OrgId, id: string) => ['contacts', org, 'detail', id] as const,
  categories: (org: OrgId) => ['contacts', org, 'categories'] as const,
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/contacts/data/types.ts apps/web/src/modules/contacts/data/contactsKeys.ts
git commit -m "feat(contacts): add data types and query keys

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: contactsClient (HTTP + normalization)

**Files:**

- Create: `apps/web/src/modules/contacts/data/contactsClient.ts`
- Test: `apps/web/src/modules/contacts/data/contactsClient.test.ts`

> Mirrors `supportClient.ts`. Import helpers from `@/runtime/osiris/osirisClientUtils` and `@/runtime/osiris/apiBaseUrl`.

- [ ] **Step 1: Write the failing test**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createContactsClient } from './contactsClient';

const BASE = 'https://api.test';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('contactsClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists contacts and normalizes snake_case fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 'c1',
            org_id: 'o1',
            name: 'Maria Huber',
            is_business: false,
            email: 'm@h.at',
            address_line1: 'Hauptstr. 1',
            postal_code: '1010',
            category_ids: ['cat1'],
            tags: ['vip'],
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
        totalPages: 1,
      }),
    );

    const client = createContactsClient({ baseUrl: BASE });
    const result = await client.listContacts({ page: 1, pageSize: 100, sort: '-created_at' });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/contacts?');
    expect(url).toContain('pageSize=100');
    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: 'c1',
      orgId: 'o1',
      isBusiness: false,
      addressLine1: 'Hauptstr. 1',
      postalCode: '1010',
      categoryIds: ['cat1'],
      tags: ['vip'],
    });
  });

  it('sends a camelCase payload on create and normalizes the response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ id: 'c2', name: 'Acme GmbH', is_business: true }),
    );
    const client = createContactsClient({ baseUrl: BASE });
    const created = await client.createContact({
      name: 'Acme GmbH',
      isBusiness: true,
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      linkedin: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      clientCode: '',
      categoryIds: ['cat1'],
      tags: [],
      notes: '',
    });

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ name: 'Acme GmbH', isBusiness: true, categoryIds: ['cat1'] });
    expect(created).toMatchObject({ id: 'c2', isBusiness: true });
  });

  it('throws with the server message on a failed request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 500));
    const client = createContactsClient({ baseUrl: BASE });
    await expect(client.getContact('x')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/data/contactsClient.test.ts`
Expected: FAIL — `createContactsClient` is not defined / module not found.

- [ ] **Step 3: Write `contactsClient.ts`**

```ts
import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

import type {
  Contact,
  ContactCategory,
  ContactInput,
  ListContactsParams,
  ListContactsResult,
} from './types';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function normalizeContact(value: unknown): Contact {
  const v = readRecord(value);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId ?? null),
    name: str(v.name),
    isBusiness: Boolean(v.is_business ?? v.isBusiness ?? false),
    email: str(v.email),
    phone: str(v.phone),
    mobile: str(v.mobile),
    fax: str(v.fax),
    linkedin: str(v.linkedin),
    addressLine1: str(v.address_line1 ?? v.addressLine1),
    addressLine2: str(v.address_line2 ?? v.addressLine2),
    city: str(v.city),
    state: str(v.state),
    postalCode: str(v.postal_code ?? v.postalCode),
    country: str(v.country),
    clientCode: str(v.client_code ?? v.clientCode),
    categoryIds: readStringArray(v.category_ids ?? v.categoryIds),
    tags: readStringArray(v.tags),
    notes: str(v.notes),
    createdAt: str(v.created_at ?? v.createdAt),
    updatedAt: str(v.updated_at ?? v.updatedAt),
  };
}

function normalizeCategory(value: unknown): ContactCategory {
  const v = readRecord(value);
  return { id: readString(v.id), name: str(v.name) };
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

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') sp.set(key, String(value));
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
        total: readNumber(raw.total ?? data.length),
        totalPages: readNumber(raw.totalPages ?? raw.total_pages ?? 1),
      };
    },

    async getContact(id: string): Promise<Contact> {
      return normalizeContact(await getJson(`/contacts/${id}`, 'Failed to load contact.'));
    },

    async createContact(input: ContactInput): Promise<Contact> {
      return normalizeContact(
        await sendJson('POST', '/contacts', toPayload(input), 'Failed to create contact.'),
      );
    },

    async updateContact(id: string, input: ContactInput): Promise<Contact> {
      return normalizeContact(
        await sendJson('PATCH', `/contacts/${id}`, toPayload(input), 'Failed to update contact.'),
      );
    },

    async deleteContact(id: string): Promise<void> {
      const response = await fetch(url(`/contacts/${id}`), {
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/data/contactsClient.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: VERIFY against the live API (one-time check, adjust if needed)**

The plan assumes (a) list/detail responses include `category_ids` inline and (b) create/update accept `categoryIds` in the body and the response echoes the saved contact. Confirm against a real osiris response (e.g. via the network tab or a `curl` to the dev API). If `category_ids` is NOT returned inline by the list endpoint, leave the client as-is (it already defaults to `[]`) and note in Task 5 that the **Category filter** must be disabled until server-side list params land — the rest of the module is unaffected. Record the finding in the commit message if you change anything.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/contacts/data/contactsClient.ts apps/web/src/modules/contacts/data/contactsClient.test.ts
git commit -m "feat(contacts): add contactsClient with normalization + tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: React Query hooks

**Files:**

- Create: `apps/web/src/modules/contacts/data/useContactsData.ts`

> No standalone test — these hooks are exercised by the component tests (Tasks 5 & 7), matching how `useSupportData.ts` is covered.

- [ ] **Step 1: Write `useContactsData.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createContactsClient } from './contactsClient';
import { contactsKeys } from './contactsKeys';
import type { ContactInput, ListContactsParams } from './types';

/** v1 fetches a single server page and filters client-side (see useListPageState).
 *  Documented limitation; server-side pagination is a follow-up. */
const LIST_PARAMS: ListContactsParams = { page: 1, pageSize: 100, sort: '-created_at' };

function useContactsClient() {
  return useMemo(() => createContactsClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId(): string | null {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useContacts() {
  const client = useContactsClient();
  const org = useOrgId();
  return useQuery({
    queryKey: contactsKeys.list(org, LIST_PARAMS),
    queryFn: () => client.listContacts(LIST_PARAMS),
  });
}

export function useContact(id: string | null) {
  const client = useContactsClient();
  const org = useOrgId();
  return useQuery({
    queryKey: contactsKeys.detail(org, id ?? ''),
    queryFn: () => client.getContact(id as string),
    enabled: Boolean(id),
  });
}

export function useContactCategories() {
  const client = useContactsClient();
  const org = useOrgId();
  return useQuery({
    queryKey: contactsKeys.categories(org),
    queryFn: () => client.listCategories(),
  });
}

export function useContactMutations() {
  const client = useContactsClient();
  const org = useOrgId();
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: contactsKeys.root(org) });
  };

  const createContact = useMutation({
    mutationFn: (input: ContactInput) => client.createContact(input),
    onSuccess: invalidate,
  });
  const updateContact = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ContactInput }) =>
      client.updateContact(id, input),
    onSuccess: invalidate,
  });
  const deleteContacts = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => client.deleteContact(id))).then(() => undefined),
    onSuccess: invalidate,
  });

  return { createContact, updateContact, deleteContacts };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm lint`
Expected: no errors in the new file (it is imported by later tasks; unused-import warnings here are fine until then).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/contacts/data/useContactsData.ts
git commit -m "feat(contacts): add react-query hooks

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: shared.tsx (rows, columns, filters, form fields)

**Files:**

- Create: `apps/web/src/modules/contacts/shared.tsx`
- Test: `apps/web/src/modules/contacts/shared.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { contactFilters, contactFormFields, toContactRow } from './shared';
import type { Contact } from './data/types';

const t = (_key: string, _vars?: unknown, fallback?: string) => fallback ?? _key;

const base: Contact = {
  id: 'c1',
  orgId: 'o1',
  name: 'Maria Huber',
  isBusiness: false,
  email: 'm@h.at',
  phone: '',
  mobile: '',
  fax: '',
  linkedin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  clientCode: '',
  categoryIds: ['cat1'],
  tags: [],
  notes: '',
  createdAt: '',
  updatedAt: '',
};

describe('contacts shared', () => {
  it('maps a contact to a row with type + category labels', () => {
    const names = new Map([['cat1', 'Primär']]);
    const row = toContactRow(base, t, names);
    expect(row.typeValue).toBe('person');
    expect(row.typeLabel).toBe('Person');
    expect(row.categoryLabel).toBe('Primär');
  });

  it('marks business contacts', () => {
    const row = toContactRow({ ...base, isBusiness: true }, t, new Map());
    expect(row.typeValue).toBe('business');
  });

  it('builds two filters (type + category) with category options from the list', () => {
    const filters = contactFilters(t, [{ id: 'cat1', name: 'Primär' }]);
    expect(filters.map((f) => f.key)).toEqual(['type', 'category']);
    expect(filters[1].options).toEqual([{ value: 'cat1', label: 'Primär' }]);
  });

  it('includes a required name field and a multiselect categories field', () => {
    const fields = contactFormFields(t, [{ id: 'cat1', name: 'Primär' }]);
    const name = fields.find((f) => f.name === 'name');
    const categories = fields.find((f) => f.name === 'categoryIds');
    expect(name?.required).toBe(true);
    expect(categories?.type).toBe('multiselect');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/shared.test.ts`
Expected: FAIL — module `./shared` not found.

- [ ] **Step 3: Write `shared.tsx`**

```tsx
import type { BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import type { FilterDef } from '@/components/data/FilterToolbar';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { FormField } from '@/components/forms/EntityForm';

import type { Contact, ContactCategory, ContactInput } from './data/types';

type TFn = (key: string, vars?: Record<string, unknown>, fallback?: string) => string;

export const TYPE_VARIANT: Record<string, BadgeProps['variant']> = {
  business: 'info',
  person: 'secondary',
};

export type ContactRow = Contact & {
  typeValue: 'business' | 'person';
  typeLabel: string;
  categoryLabel: string;
};

export function toContactRow(
  contact: Contact,
  t: TFn,
  categoryNameById: Map<string, string>,
): ContactRow {
  const names = contact.categoryIds
    .map((id) => categoryNameById.get(id))
    .filter((name): name is string => Boolean(name));
  return {
    ...contact,
    typeValue: contact.isBusiness ? 'business' : 'person',
    typeLabel: contact.isBusiness
      ? t('contacts.typeBusiness', undefined, 'Business')
      : t('contacts.typePerson', undefined, 'Person'),
    categoryLabel: names.join(', '),
  };
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const result = parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  return result || '?';
}

export function contactColumns(t: TFn): CrudColumn<ContactRow>[] {
  return [
    {
      key: 'name',
      header: t('contacts.colName', undefined, 'Name'),
      sortable: true,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials(row.name)}
          </span>
          <span className="truncate font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: t('contacts.colEmail', undefined, 'Email'),
      sortable: true,
      render: (row) => row.email || '—',
    },
    {
      key: 'phone',
      header: t('contacts.colPhone', undefined, 'Phone'),
      render: (row) => row.phone || row.mobile || '—',
    },
    {
      key: 'typeValue',
      header: t('contacts.colType', undefined, 'Type'),
      sortable: true,
      render: (row) => (
        <StatusBadge status={row.typeValue} label={row.typeLabel} variantMap={TYPE_VARIANT} />
      ),
    },
    {
      key: 'categoryLabel',
      header: t('contacts.colCategory', undefined, 'Category'),
      render: (row) => row.categoryLabel || '—',
    },
  ];
}

export function contactFilters(t: TFn, categories: ContactCategory[]): FilterDef[] {
  return [
    {
      key: 'type',
      label: t('contacts.colType', undefined, 'Type'),
      options: [
        { value: 'business', label: t('contacts.typeBusiness', undefined, 'Business') },
        { value: 'person', label: t('contacts.typePerson', undefined, 'Person') },
      ],
    },
    {
      key: 'category',
      label: t('contacts.colCategory', undefined, 'Category'),
      options: categories.map((category) => ({ value: category.id, label: category.name })),
    },
  ];
}

export function contactFormFields(t: TFn, categories: ContactCategory[]): FormField[] {
  const general = t('contacts.sectionGeneral', undefined, 'General');
  const address = t('contacts.sectionAddress', undefined, 'Address');
  const web = t('contacts.sectionWeb', undefined, 'Web');
  const classification = t('contacts.sectionClassification', undefined, 'Classification');
  const notesSection = t('contacts.sectionNotes', undefined, 'Notes');
  return [
    {
      name: 'name',
      label: t('contacts.fieldName', undefined, 'Name'),
      type: 'text',
      required: true,
      section: general,
      colSpan: 2,
    },
    {
      name: 'isBusiness',
      label: t('contacts.fieldIsBusiness', undefined, 'Business contact'),
      type: 'switch',
      section: general,
    },
    {
      name: 'email',
      label: t('contacts.fieldEmail', undefined, 'Email'),
      type: 'email',
      section: general,
    },
    {
      name: 'phone',
      label: t('contacts.fieldPhone', undefined, 'Phone'),
      type: 'phone',
      section: general,
    },
    {
      name: 'mobile',
      label: t('contacts.fieldMobile', undefined, 'Mobile'),
      type: 'phone',
      section: general,
    },
    {
      name: 'fax',
      label: t('contacts.fieldFax', undefined, 'Fax'),
      type: 'text',
      section: general,
    },
    {
      name: 'clientCode',
      label: t('contacts.fieldClientCode', undefined, 'Client code'),
      type: 'text',
      section: general,
    },
    {
      name: 'addressLine1',
      label: t('contacts.fieldAddressLine1', undefined, 'Street'),
      type: 'text',
      section: address,
      colSpan: 2,
    },
    {
      name: 'addressLine2',
      label: t('contacts.fieldAddressLine2', undefined, 'Address line 2'),
      type: 'text',
      section: address,
      colSpan: 2,
    },
    {
      name: 'city',
      label: t('contacts.fieldCity', undefined, 'City'),
      type: 'text',
      section: address,
    },
    {
      name: 'postalCode',
      label: t('contacts.fieldPostalCode', undefined, 'Postal code'),
      type: 'text',
      section: address,
    },
    {
      name: 'state',
      label: t('contacts.fieldState', undefined, 'State'),
      type: 'text',
      section: address,
    },
    {
      name: 'country',
      label: t('contacts.fieldCountry', undefined, 'Country'),
      type: 'text',
      section: address,
    },
    {
      name: 'linkedin',
      label: t('contacts.fieldLinkedin', undefined, 'LinkedIn'),
      type: 'url',
      section: web,
      colSpan: 2,
    },
    {
      name: 'categoryIds',
      label: t('contacts.fieldCategories', undefined, 'Categories'),
      type: 'multiselect',
      options: categories.map((category) => ({ value: category.id, label: category.name })),
      section: classification,
    },
    {
      name: 'tags',
      label: t('contacts.fieldTags', undefined, 'Tags'),
      type: 'tags',
      section: classification,
    },
    {
      name: 'notes',
      label: t('contacts.fieldNotes', undefined, 'Notes'),
      type: 'textarea',
      section: notesSection,
      colSpan: 2,
    },
  ];
}

export const EMPTY_CONTACT_INPUT: ContactInput = {
  name: '',
  isBusiness: false,
  email: '',
  phone: '',
  mobile: '',
  fax: '',
  linkedin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  clientCode: '',
  categoryIds: [],
  tags: [],
  notes: '',
};

export function contactToInput(contact: Contact): ContactInput {
  return {
    name: contact.name,
    isBusiness: contact.isBusiness,
    email: contact.email,
    phone: contact.phone,
    mobile: contact.mobile,
    fax: contact.fax,
    linkedin: contact.linkedin,
    addressLine1: contact.addressLine1,
    addressLine2: contact.addressLine2,
    city: contact.city,
    state: contact.state,
    postalCode: contact.postalCode,
    country: contact.country,
    clientCode: contact.clientCode,
    categoryIds: contact.categoryIds,
    tags: contact.tags,
    notes: contact.notes,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/shared.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/contacts/shared.tsx apps/web/src/modules/contacts/shared.test.ts
git commit -m "feat(contacts): add shared columns, filters, and form fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: ContactsListView

**Files:**

- Create: `apps/web/src/modules/contacts/ContactsListView.tsx`
- Test: `apps/web/src/modules/contacts/ContactsListView.test.tsx`

> Uses `CrudListShell` + `useListPageState`. Passing `enableListCrud` (default true) + `entityLabel` + `getRowHref` + `onDeleteRows` auto-builds selectable rows, per-row edit/delete, and bulk delete with built-in confirm dialogs and toasts (see `standardListCrud.tsx`). Row click and the row "edit" action both navigate to the detail URL.

- [ ] **Step 1: Write the failing test**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { ContactsListView } from './ContactsListView';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'o1',
    permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
  }),
}));

vi.mock('./data/useContactsData', () => ({
  useContacts: () => ({
    data: {
      data: [
        {
          id: 'c1',
          orgId: 'o1',
          name: 'Maria Huber',
          isBusiness: false,
          email: 'm@h.at',
          phone: '',
          mobile: '',
          fax: '',
          linkedin: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          clientCode: '',
          categoryIds: [],
          tags: [],
          notes: '',
          createdAt: '',
          updatedAt: '',
        },
      ],
      total: 1,
      totalPages: 1,
    },
    isLoading: false,
  }),
  useContactCategories: () => ({ data: [] }),
  useContactMutations: () => ({
    createContact: { mutateAsync: vi.fn() },
    updateContact: { mutateAsync: vi.fn() },
    deleteContacts: { mutateAsync: vi.fn() },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/contacts']}>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            <TestI18nProvider>
              <ContactsListView />
            </TestI18nProvider>
          </QueryClientProvider>
        </NuqsAdapter>
      </MemoryRouter>,
    );
  });
}

describe('ContactsListView', () => {
  it('renders the contact rows', () => {
    renderView();
    expect(container.textContent).toContain('Maria Huber');
    expect(container.textContent).toContain('m@h.at');
  });

  it('renders a search input', () => {
    renderView();
    expect(container.querySelector('input')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/ContactsListView.test.tsx`
Expected: FAIL — `ContactsListView` not found.

- [ ] **Step 3: Write `ContactsListView.tsx`**

```tsx
import { useMemo } from 'react';

import { PlusIcon, UsersIcon } from '@/lib/icons';
import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import { CrudListShell } from '@/components/data/CrudListShell';
import { ModulePage } from '@/components/common/PageLayout';
import { modulePageIcon } from '@/lib/modulePageIcons';
import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { useContacts, useContactCategories, useContactMutations } from './data/useContactsData';
import { contactColumns, contactFilters, type ContactRow, toContactRow } from './shared';

export function ContactsListView() {
  const { t } = useTranslation();
  const contactsQuery = useContacts();
  const categoriesQuery = useContactCategories();
  const { deleteContacts } = useContactMutations();

  const categoryNameById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );

  const rows = useMemo(
    () =>
      (contactsQuery.data?.data ?? []).map((contact) => toContactRow(contact, t, categoryNameById)),
    [contactsQuery.data, t, categoryNameById],
  );

  const list = useListPageState<ContactRow>({
    rows,
    defaultSort: 'name',
    pageSize: 20,
    filterKeys: ['type', 'category'],
    queryNamespace: 'contacts-list',
    filterFn: (row, { search, filters }) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        ['name', 'email', 'phone', 'mobile', 'city'].some((key) =>
          String((row as Record<string, unknown>)[key] ?? '')
            .toLowerCase()
            .includes(query),
        );
      const matchesType = !filters.type || row.typeValue === filters.type;
      const matchesCategory = !filters.category || row.categoryIds.includes(filters.category);
      return matchesSearch && matchesType && matchesCategory;
    },
  });

  return (
    <ModulePage
      title={t('contacts.title', undefined, 'Contacts')}
      subtitle={t('contacts.subtitle', undefined, 'People and organizations')}
      icon={modulePageIcon(UsersIcon)}
      actions={
        <PageHeaderCtaLink to="/contacts?mode=new">
          <PlusIcon size={16} />
          {t('contacts.newContact', undefined, 'New contact')}
        </PageHeaderCtaLink>
      }
    >
      <CrudListShell<ContactRow>
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder={t('contacts.searchPlaceholder', undefined, 'Search name, email, phone…')}
        filters={contactFilters(t, categoriesQuery.data ?? [])}
        values={list.values}
        onFilterChange={list.onFilterChange}
        onReset={list.onReset}
        rows={list.paged}
        columns={contactColumns(t)}
        sort={list.sort}
        onSortChange={list.onSortChange}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.onPageChange}
        isLoading={contactsQuery.isLoading}
        emptyTitle={t('contacts.emptyTitle', undefined, 'No contacts yet')}
        emptyDescription={t(
          'contacts.emptyDescription',
          undefined,
          'Create your first contact to get started.',
        )}
        entityLabel="contact"
        getRowHref={(row) => `/contacts?id=${row.id}`}
        onDeleteRows={async (ids) => {
          await deleteContacts.mutateAsync(ids);
        }}
      />
    </ModulePage>
  );
}
```

> If Task 2 Step 5 found that the list endpoint does NOT return `category_ids`, drop the `'category'` entry from `filterKeys`, remove the category filter from `contactFilters` usage here (pass `[]`), and leave a `// TODO: category filter pending server-side list params` comment. Everything else stands.

- [ ] **Step 4: Run to verify it passes**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/ContactsListView.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/contacts/ContactsListView.tsx apps/web/src/modules/contacts/ContactsListView.test.tsx
git commit -m "feat(contacts): add list view with filters and bulk delete

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: ContactDetailView

**Files:**

- Create: `apps/web/src/modules/contacts/ContactDetailView.tsx`

> `DetailView` groups `fields` by `section`. Header uses `IconEditButton` (link to edit URL) + `IconDeleteButton` (opens `ConfirmActionDialog`). Delete calls the mutation, toasts, and navigates back to the list.

- [ ] **Step 1: Write `ContactDetailView.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView, type DetailFieldProps } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { useTranslation } from '@/core/i18n';
import { UserCircleIcon } from '@/lib/icons';
import { modulePageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

import { useContact, useContactCategories, useContactMutations } from './data/useContactsData';

export function ContactDetailView({ contactId }: { contactId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contact, isLoading, isError } = useContact(contactId);
  const { data: categories } = useContactCategories();
  const { deleteContacts } = useContactMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <ModulePage
        title={t('contacts.detailLoading', undefined, 'Contact')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo="/contacts"
      >
        <div className="h-40 animate-pulse rounded-card bg-muted/60" />
      </ModulePage>
    );
  }

  if (isError || !contact) {
    return (
      <ModulePage
        title={t('contacts.notFoundTitle', undefined, 'Contact not found')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo="/contacts"
      >
        <p className="text-sm text-muted-foreground">
          {t('contacts.notFoundDescription', undefined, 'This contact may have been deleted.')}
        </p>
      </ModulePage>
    );
  }

  const categoryNames = contact.categoryIds
    .map((id) => (categories ?? []).find((category) => category.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const general = t('contacts.sectionGeneral', undefined, 'General');
  const address = t('contacts.sectionAddress', undefined, 'Address');
  const web = t('contacts.sectionWeb', undefined, 'Web');
  const classification = t('contacts.sectionClassification', undefined, 'Classification');
  const notesSection = t('contacts.sectionNotes', undefined, 'Notes');
  const dash = '—';

  const fields: DetailFieldProps[] = [
    {
      label: t('contacts.fieldEmail', undefined, 'Email'),
      value: contact.email || dash,
      section: general,
    },
    {
      label: t('contacts.fieldPhone', undefined, 'Phone'),
      value: contact.phone || dash,
      section: general,
    },
    {
      label: t('contacts.fieldMobile', undefined, 'Mobile'),
      value: contact.mobile || dash,
      section: general,
    },
    {
      label: t('contacts.fieldFax', undefined, 'Fax'),
      value: contact.fax || dash,
      section: general,
    },
    {
      label: t('contacts.fieldClientCode', undefined, 'Client code'),
      value: contact.clientCode || dash,
      section: general,
    },
    {
      label: t('contacts.fieldAddressLine1', undefined, 'Street'),
      value: [contact.addressLine1, contact.addressLine2].filter(Boolean).join(', ') || dash,
      section: address,
    },
    {
      label: t('contacts.fieldCity', undefined, 'City'),
      value: [contact.postalCode, contact.city].filter(Boolean).join(' ') || dash,
      section: address,
    },
    {
      label: t('contacts.fieldState', undefined, 'State'),
      value: contact.state || dash,
      section: address,
    },
    {
      label: t('contacts.fieldCountry', undefined, 'Country'),
      value: contact.country || dash,
      section: address,
    },
    {
      label: t('contacts.fieldLinkedin', undefined, 'LinkedIn'),
      value: contact.linkedin || dash,
      section: web,
    },
    {
      label: t('contacts.fieldCategories', undefined, 'Categories'),
      value: categoryNames.join(', ') || dash,
      section: classification,
    },
    {
      label: t('contacts.fieldTags', undefined, 'Tags'),
      value: contact.tags.join(', ') || dash,
      section: classification,
    },
    {
      label: t('contacts.fieldNotes', undefined, 'Notes'),
      value: contact.notes || dash,
      section: notesSection,
    },
  ];

  const typeLabel = contact.isBusiness
    ? t('contacts.typeBusiness', undefined, 'Business')
    : t('contacts.typePerson', undefined, 'Person');

  return (
    <ModulePage
      title={contact.name}
      subtitle={[typeLabel, ...categoryNames].join(' · ')}
      icon={modulePageIcon(UserCircleIcon)}
      backTo="/contacts"
      actions={
        <div className="flex items-center gap-2">
          <IconEditButton
            to={`/contacts?id=${contactId}&mode=edit`}
            label={t('common.edit', undefined, 'Edit')}
          />
          <IconDeleteButton
            onClick={() => setConfirmOpen(true)}
            label={t('common.delete', undefined, 'Delete')}
          />
        </div>
      }
    >
      <DetailView title={contact.name} subtitle={typeLabel} fields={fields} />

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('contacts.deleteTitle', undefined, 'Delete this contact?')}
        description={t('contacts.deleteDescription', undefined, 'This action cannot be undone.')}
        confirmLabel={t('common.delete', undefined, 'Delete')}
        confirmVariant="destructive"
        onConfirm={async () => {
          try {
            await deleteContacts.mutateAsync([contactId]);
            appToast.success(t('contacts.toastDeleted', undefined, 'Contact deleted.'));
            navigate('/contacts');
          } catch (error) {
            appToast.fromApiError(
              error,
              t('contacts.deleteError', undefined, 'Contact could not be deleted.'),
            );
          }
        }}
      />
    </ModulePage>
  );
}
```

- [ ] **Step 2: Typecheck / lint**

Run: `pnpm lint`
Expected: no errors. If `DetailFieldProps` does not accept a plain `value: string`, wrap values as needed per `apps/web/src/components/common/DetailView.tsx` (it accepts `ReactNode`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/contacts/ContactDetailView.tsx
git commit -m "feat(contacts): add detail view with delete confirm

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: ContactFormView (create + edit)

**Files:**

- Create: `apps/web/src/modules/contacts/ContactFormView.tsx`
- Test: `apps/web/src/modules/contacts/ContactFormView.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { ContactFormView } from './ContactFormView';

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'o1',
    permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
  }),
}));

vi.mock('./data/useContactsData', () => ({
  useContact: () => ({ data: undefined, isLoading: false }),
  useContactCategories: () => ({ data: [] }),
  useContactMutations: () => ({
    createContact: { mutateAsync: vi.fn().mockResolvedValue({ id: 'new1' }) },
    updateContact: { mutateAsync: vi.fn() },
    deleteContacts: { mutateAsync: vi.fn() },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ContactFormView', () => {
  it('renders the create form with a name field', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/contacts?mode=new']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <ContactFormView mode="create" />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.textContent?.toLowerCase()).toContain('name');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/ContactFormView.test.tsx`
Expected: FAIL — `ContactFormView` not found.

- [ ] **Step 3: Write `ContactFormView.tsx`**

```tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@oktavius/base-ui';

import { EntityForm } from '@/components/forms/EntityForm';
import { ModulePage } from '@/components/common/PageLayout';
import { useTranslation } from '@/core/i18n';
import type { FormSubmissionResult } from '@/lib/formValidation';
import { UserCircleIcon } from '@/lib/icons';
import { modulePageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

import { useContact, useContactCategories, useContactMutations } from './data/useContactsData';
import type { ContactInput } from './data/types';
import { contactFormFields, contactToInput, EMPTY_CONTACT_INPUT } from './shared';

type ContactFormViewProps = {
  mode: 'create' | 'edit';
  contactId?: string;
};

export function ContactFormView({ mode, contactId }: ContactFormViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: categories } = useContactCategories();
  const existing = useContact(mode === 'edit' ? (contactId ?? null) : null);
  const { createContact, updateContact } = useContactMutations();

  const fields = useMemo(() => contactFormFields(t, categories ?? []), [t, categories]);
  const cancelHref = mode === 'edit' && contactId ? `/contacts?id=${contactId}` : '/contacts';

  if (mode === 'edit' && !existing.data) {
    return (
      <ModulePage
        title={t('contacts.editTitle', undefined, 'Edit contact')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo={cancelHref}
      >
        <div className="h-40 animate-pulse rounded-card bg-muted/60" />
      </ModulePage>
    );
  }

  const defaultValues: ContactInput =
    mode === 'edit' && existing.data ? contactToInput(existing.data) : EMPTY_CONTACT_INPUT;

  const onSubmit = async (values: ContactInput): Promise<FormSubmissionResult> => {
    try {
      if (mode === 'create') {
        const created = await createContact.mutateAsync(values);
        appToast.success(t('contacts.toastCreated', undefined, 'Contact created.'));
        navigate(`/contacts?id=${created.id}`);
      } else {
        await updateContact.mutateAsync({ id: contactId as string, input: values });
        appToast.success(t('contacts.toastUpdated', undefined, 'Contact updated.'));
        navigate(`/contacts?id=${contactId}`);
      }
      return;
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : t('contacts.saveError', undefined, 'Save failed.'),
      };
    }
  };

  return (
    <ModulePage
      title={
        mode === 'create'
          ? t('contacts.newContact', undefined, 'New contact')
          : t('contacts.editTitle', undefined, 'Edit contact')
      }
      icon={modulePageIcon(UserCircleIcon)}
      backTo={cancelHref}
    >
      <EntityForm<ContactInput>
        title={
          mode === 'create'
            ? t('contacts.newContact', undefined, 'New contact')
            : t('contacts.editTitle', undefined, 'Edit contact')
        }
        showHeader={false}
        surface="page"
        fields={fields}
        defaultValues={defaultValues}
        submitLabel={t('common.save', undefined, 'Save')}
        submitVariant="default"
        onSubmit={onSubmit}
        footerActions={
          <Button type="button" variant="ghost" onClick={() => navigate(cancelHref)}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
        }
      />
    </ModulePage>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts/ContactFormView.test.tsx`
Expected: PASS (1 test). If `Button` is not exported from `@oktavius/base-ui`, import it from the path Support uses (grep `import { Button }` in `apps/web/src/modules/support`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/contacts/ContactFormView.tsx apps/web/src/modules/contacts/ContactFormView.test.tsx
git commit -m "feat(contacts): add create/edit form view

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: ContactsPage host + i18n namespace

**Files:**

- Create: `apps/web/src/modules/contacts/ContactsPage.tsx`
- Create: `packages/i18n/locales/en/contacts.json`
- Modify: `packages/i18n/locales/en/navigation.json` (add `contacts` if missing)
- Modify: i18n namespace registry (register `contacts`)

- [ ] **Step 1: Write `ContactsPage.tsx`**

```tsx
import { parseAsString, useQueryStates } from 'nuqs';

import { usePreloadNamespaces } from '@/core/i18n';

import { ContactDetailView } from './ContactDetailView';
import { ContactFormView } from './ContactFormView';
import { ContactsListView } from './ContactsListView';

export function ContactsPage() {
  const { ready } = usePreloadNamespaces(['contacts']);
  const [params] = useQueryStates({
    id: parseAsString,
    mode: parseAsString,
  });

  if (!ready) return null;

  if (params.mode === 'new') return <ContactFormView mode="create" />;
  if (params.id && params.mode === 'edit')
    return <ContactFormView mode="edit" contactId={params.id} />;
  if (params.id) return <ContactDetailView contactId={params.id} />;
  return <ContactsListView />;
}
```

- [ ] **Step 2: Create `packages/i18n/locales/en/contacts.json`**

```json
{
  "title": "Contacts",
  "subtitle": "People and organizations",
  "newContact": "New contact",
  "searchPlaceholder": "Search name, email, phone…",
  "emptyTitle": "No contacts yet",
  "emptyDescription": "Create your first contact to get started.",
  "colName": "Name",
  "colEmail": "Email",
  "colPhone": "Phone",
  "colType": "Type",
  "colCategory": "Category",
  "typeBusiness": "Business",
  "typePerson": "Person",
  "sectionGeneral": "General",
  "sectionAddress": "Address",
  "sectionWeb": "Web",
  "sectionClassification": "Classification",
  "sectionNotes": "Notes",
  "fieldName": "Name",
  "fieldIsBusiness": "Business contact",
  "fieldEmail": "Email",
  "fieldPhone": "Phone",
  "fieldMobile": "Mobile",
  "fieldFax": "Fax",
  "fieldClientCode": "Client code",
  "fieldAddressLine1": "Street",
  "fieldAddressLine2": "Address line 2",
  "fieldCity": "City",
  "fieldPostalCode": "Postal code",
  "fieldState": "State",
  "fieldCountry": "Country",
  "fieldLinkedin": "LinkedIn",
  "fieldCategories": "Categories",
  "fieldTags": "Tags",
  "fieldNotes": "Notes",
  "editTitle": "Edit contact",
  "detailLoading": "Contact",
  "notFoundTitle": "Contact not found",
  "notFoundDescription": "This contact may have been deleted.",
  "deleteTitle": "Delete this contact?",
  "deleteDescription": "This action cannot be undone.",
  "deleteError": "Contact could not be deleted.",
  "saveError": "Save failed.",
  "toastCreated": "Contact created.",
  "toastUpdated": "Contact updated.",
  "toastDeleted": "Contact deleted."
}
```

- [ ] **Step 3: Register the `contacts` namespace + nav label**

Run discovery to find how `support` is registered:

```bash
grep -rn "'support'\|\"support\"" packages/i18n/src apps/web/src/core/i18n 2>/dev/null
grep -n "contacts" packages/i18n/locales/en/navigation.json
```

- Add `contacts` to wherever the `TranslationNamespace` union / namespace manifest lists `support`/`storage` (mirror the `support` entry exactly).
- If `navigation.json` lacks a `contacts` key, add `"contacts": "Contacts"`.
- If the i18n package uses codegen (see memory: codegen lives in `tools/`), run the generator the repo uses (e.g. `pnpm i18n:codegen` or the script in `package.json`) so the new namespace + keys are picked up.

- [ ] **Step 4: Typecheck**

Run: `pnpm lint`
Expected: `usePreloadNamespaces(['contacts'])` type-checks (proves the namespace is registered). Fix registration if it errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/contacts/ContactsPage.tsx packages/i18n
git commit -m "feat(contacts): add page host and i18n namespace

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Register the module in navigation/routing

**Files:**

- Modify: `apps/web/src/lib/appNavModules.ts`

- [ ] **Step 1: Add the icon import**

At the top of `appNavModules.ts`, add `UserCircleIcon` to the existing `@/lib/icons` import (it is already exported there).

- [ ] **Step 2: Add the manifest entry**

Insert into the `APP_NAV_MODULES` array (near the `storage` entry, `section: 'modules'`):

```ts
{
  id: 'contacts',
  path: '/contacts',
  label: 'Contacts',
  labelKey: 'navigation.contacts',
  icon: UserCircleIcon,
  section: 'modules',
  permission: 'contacts.view',
  loadPage: () => import('@/modules/contacts/ContactsPage'),
  pageExport: 'ContactsPage',
},
```

> `AppNavRouteId` / `OrgModuleId` may be a typed union — if TS complains that `'contacts'` is not assignable, add `'contacts'` to that union (grep `type AppNavRouteId` / `OrgModuleId` in `apps/web/src/lib`). The `contacts.view` permission string likewise may need adding to the permission union; mirror how `storage.view` is declared.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm lint`
Expected: clean. Resolve any union-membership errors per the note above.

- [ ] **Step 4: Manual smoke test**

Run the dev server (`pnpm dev` or the repo's script). Confirm:

- "Contacts" appears in the Modules nav (when the org has it enabled / for a permitted user).
- `/contacts` shows the list; clicking a row shows detail (`?id=`); Edit shows the form (`?id=&mode=edit`); "New contact" shows the create form (`?mode=new`); browser back works.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/appNavModules.ts
git commit -m "feat(contacts): register module in navigation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Full verification

- [ ] **Step 1: Run the module's tests**

Run (from `apps/web/`): `pnpm vitest run src/modules/contacts`
Expected: all tests PASS.

- [ ] **Step 2: Lint the whole repo**

Run: `pnpm lint`
Expected: clean (no `bg-white`/`text-gray-*`/`rounded-lg`, no `Select`, no `@phosphor-icons/react` direct import, single `cta` per header).

- [ ] **Step 3: Typecheck the web app**

Run the repo's typecheck script (e.g. `pnpm typecheck` or `pnpm -w typecheck`).
Expected: no type errors.

- [ ] **Step 4: Final commit (if anything changed)**

```bash
git add -A apps/web/src/modules/contacts packages/i18n apps/web/src/lib/appNavModules.ts
git commit -m "chore(contacts): finalize module — tests, lint, typecheck green

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Known v1 limitations (documented, not bugs)

- **Client-side list** over a single 100-row server page (mirrors Support's documented cap). Server-side pagination/search is the first follow-up.
- **Category filter** depends on `category_ids` being present on list rows (verified in Task 2 Step 5); disabled if absent until server-side list params land.
- **Category management** (create/rename/delete) is not in v1 — assignment only.
- Deferred per spec: bulk import, credit-risk panel, linked entities, doc generation, custom fields, site selector.

## Self-review notes (completed)

- **Spec coverage:** list+filters+sort+pagination+bulk delete (Task 5), detail (Task 6), create/edit (Task 7), category assign+filter (Tasks 4–7, with verified fallback), real API client (Task 2), hooks (Task 3), i18n (Task 8), registration (Task 9). All spec sections map to a task.
- **Placeholder scan:** none — every code step contains full code; verification/discovery steps carry concrete commands.
- **Type consistency:** `ContactInput`/`Contact`/`ContactRow`/`ContactCategory` names and the `createContactsClient`/`contactsKeys`/hook names are used identically across tasks; `FormSubmissionResult` returns `void` on success or `{ ok: false, message }` on failure (matches `formValidation.ts`).
