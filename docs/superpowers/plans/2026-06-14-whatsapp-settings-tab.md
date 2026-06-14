# WhatsApp Settings Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a permission-gated **WhatsApp** tab to the V3 Settings page that reproduces the osiris WhatsApp settings at full parity — bot connection status, messaging policies, and the contacts allowlist CRUD — wired to the existing osiris `/whatsapp` backend.

**Architecture:** Mirror the V3 storage module's data pattern: a module-local fetch client (`createOsirisWhatsAppClient`, using `joinOsirisApiBaseUrl` + `osirisClientUtils` + `credentials: 'include'`) consumed by react-query hooks that read `activeOrgId` from `useOptionalOsirisRuntime`. UI is built from `@oktavius/base-ui` primitives + `PhoneInput`; the "link user" dropdown sources `listOrgMembers` from the osiris runtime. The tab is a new entry in `SettingsPage`'s `settingsSections` array, auto-hidden by `SettingsPageFactory` when `org.manage` is absent.

**Tech Stack:** React 19, TypeScript, `@tanstack/react-query`, `@oktavius/base-ui`, `@oktavius/i18n`, Vitest + `react-dom/client` (`createRoot`/`act`) test harness with `TestI18nProvider`.

---

## File Structure

All new frontend files live under `apps/web/src/modules/settings/whatsapp/`:

- `data/whatsappClient.ts` — fetch client + types (one responsibility: talk to `/whatsapp/*`).
- `data/whatsappClient.test.ts` — client unit tests.
- `data/whatsappKeys.ts` — react-query key factory.
- `data/useWhatsApp.ts` — react-query hooks (status/config/contacts + org members).
- `data/whatsappKeys.test.ts` — key factory unit test.
- `WhatsAppConnection.tsx` — connection status panel.
- `WhatsAppConnection.test.tsx`
- `WhatsAppContactsConfig.tsx` — policies + contacts allowlist + dialogs.
- `WhatsAppContactsConfig.test.tsx`
- `WhatsAppSettingsSection.tsx` — composes the two with the org guard.

Modified:

- `apps/web/src/lib/icons.ts` — add `WhatsAppIcon`, `WhatsAppConnectionIcon`, `WhatsAppPolicyIcon` aliases.
- `apps/web/src/modules/settings/SettingsPage.tsx` — register the tab.
- `apps/web/src/modules/settings/SettingsPage.test.tsx` — assert the tab renders.
- `packages/i18n/locales/en/settings.json` and `packages/i18n/locales/de/settings.json` — `whatsapp*` keys.

Reference facts (verified against the codebase):

- API responses are **camelCase** (`mapContact` / config / status in `osiris_erp/apps/api/src/routes/whatsapp.ts`). Normalizers still read snake_case as a fallback, matching `storageClient.ts`.
- `t` signature: `t(key, params?, defaultValue?)` (`@/core/i18n`).
- Toasts: `appToast` from `@/lib/toast` (`success`, `error`, `fromApiError`).
- `resolveOsirisApiBaseUrl()` and `joinOsirisApiBaseUrl()` from `@/runtime/osiris/apiBaseUrl`.
- `osirisClientUtils` exports `readRecord`, `readString`, `readStringOrNull`, `readNumber`, `readErrorMessage` (no `readBoolean` — define locally).
- `OsirisOrgMember` (`runtime/osiris/membersAdminClient.ts`): `{ userId, membershipId, role, customRoleId, email, fullName }`.
- The `settings` i18n namespace already loads on the settings route — no preload changes needed.

---

## Task 1: WhatsApp fetch client + types

**Files:**

- Create: `apps/web/src/modules/settings/whatsapp/data/whatsappClient.ts`
- Test: `apps/web/src/modules/settings/whatsapp/data/whatsappClient.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/settings/whatsapp/data/whatsappClient.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisWhatsAppClient } from './whatsappClient';

const BASE = 'https://api.example.test/v1';

describe('createOsirisWhatsAppClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('reads and normalizes bot status', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        status: 'connected',
        phoneNumber: '+431234567',
        connectedAt: 't',
        uptime: 90,
      }),
    );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const status = await client.getStatus();

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/whatsapp/status`, { credentials: 'include' });
    expect(status).toEqual({
      status: 'connected',
      phoneNumber: '+431234567',
      connectedAt: 't',
      uptime: 90,
    });
  });

  it('falls back to disconnected for an unknown status value', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'weird', phoneNumber: null }));
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const status = await client.getStatus();

    expect(status.status).toBe('disconnected');
    expect(status.phoneNumber).toBeNull();
    expect(status.uptime).toBeNull();
  });

  it('reads org config (camelCase) with policy fallbacks', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        orgId: 'org_1',
        autoReply: false,
        dmPolicy: 'allowlist',
        groupPolicy: 'bogus',
      }),
    );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const config = await client.getConfig();

    expect(config).toEqual({
      orgId: 'org_1',
      autoReply: false,
      dmPolicy: 'allowlist',
      groupPolicy: 'disabled',
    });
  });

  it('patches config and lists/normalizes contacts', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          orgId: 'org_1',
          autoReply: true,
          dmPolicy: 'allowlist',
          groupPolicy: 'disabled',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          contacts: [
            {
              id: 'c1',
              org_id: 'org_1',
              phone_number: '+4311111',
              display_name: null,
              contact_type: 'individual',
              group_jid: null,
              auto_reply: true,
              user_id: null,
              wa_role: 'viewer',
              created_by: null,
              created_at: 'a',
              updated_at: 'b',
            },
          ],
        }),
      );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    await client.updateConfig({ autoReply: true });
    const { contacts } = await client.listContacts();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${BASE}/whatsapp/config`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoReply: true }),
    });
    expect(contacts[0]).toMatchObject({
      id: 'c1',
      phoneNumber: '+4311111',
      autoReply: true,
      waRole: 'viewer',
      contactType: 'individual',
    });
  });

  it('adds, updates, and deletes a contact', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'c2',
          org_id: 'org_1',
          phone_number: '+4322222',
          display_name: 'Max',
          contact_type: 'individual',
          group_jid: null,
          auto_reply: true,
          user_id: 'u1',
          wa_role: 'member',
          created_by: 'u0',
          created_at: 'a',
          updated_at: 'b',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'c2',
          org_id: 'org_1',
          phone_number: '+4322222',
          display_name: 'Max',
          contact_type: 'individual',
          group_jid: null,
          auto_reply: false,
          user_id: 'u1',
          wa_role: 'admin',
          created_by: 'u0',
          created_at: 'a',
          updated_at: 'c',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const created = await client.addContact({
      phoneNumber: '+4322222',
      displayName: 'Max',
      userId: 'u1',
      waRole: 'member',
    });
    const updated = await client.updateContact('c2', { autoReply: false, waRole: 'admin' });
    await client.deleteContact('c2');

    expect(created.waRole).toBe('member');
    expect(updated.autoReply).toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${BASE}/whatsapp/contacts`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+4322222',
        displayName: 'Max',
        userId: 'u1',
        waRole: 'member',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${BASE}/whatsapp/contacts/c2`, {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('throws the server message on a failed request', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Number already registered' }), { status: 400 }),
    );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    await expect(client.addContact({ phoneNumber: '+4300000' })).rejects.toThrow(
      'Number already registered',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/data/whatsappClient.test.ts`
Expected: FAIL — `createOsirisWhatsAppClient` cannot be imported (module does not exist).

- [ ] **Step 3: Write the client**

Create `apps/web/src/modules/settings/whatsapp/data/whatsappClient.ts`:

```ts
import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

export type WhatsAppConnectionState = 'disconnected' | 'connecting' | 'connected';
export type WhatsAppPolicy = 'allowlist' | 'open' | 'disabled';
export type WhatsAppRole = 'owner' | 'admin' | 'member' | 'viewer';
export type WhatsAppContactType = 'individual' | 'group';

export interface OsirisWhatsAppStatus {
  status: WhatsAppConnectionState;
  phoneNumber: string | null;
  connectedAt: string | null;
  uptime: number | null;
}

export interface OsirisWhatsAppConfig {
  orgId: string;
  autoReply: boolean;
  dmPolicy: WhatsAppPolicy;
  groupPolicy: WhatsAppPolicy;
}

export interface OsirisWhatsAppContact {
  id: string;
  orgId: string;
  phoneNumber: string;
  displayName: string | null;
  contactType: WhatsAppContactType;
  groupJid: string | null;
  autoReply: boolean;
  userId: string | null;
  waRole: WhatsAppRole;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OsirisWhatsAppConfigInput {
  autoReply?: boolean;
  dmPolicy?: WhatsAppPolicy;
  groupPolicy?: WhatsAppPolicy;
}

export interface OsirisWhatsAppAddContactInput {
  phoneNumber: string;
  countryCode?: string;
  displayName?: string;
  autoReply?: boolean;
  userId?: string | null;
  waRole?: WhatsAppRole;
}

export interface OsirisWhatsAppUpdateContactInput {
  displayName?: string;
  autoReply?: boolean;
  userId?: string | null;
  waRole?: WhatsAppRole;
}

export type OsirisWhatsAppClientOptions = { baseUrl?: string };

const CONNECTION_STATES: readonly WhatsAppConnectionState[] = [
  'disconnected',
  'connecting',
  'connected',
];
const POLICIES: readonly WhatsAppPolicy[] = ['allowlist', 'open', 'disabled'];
const ROLES: readonly WhatsAppRole[] = ['owner', 'admin', 'member', 'viewer'];

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readState(value: unknown): WhatsAppConnectionState {
  return CONNECTION_STATES.includes(value as WhatsAppConnectionState)
    ? (value as WhatsAppConnectionState)
    : 'disconnected';
}

function readPolicy(value: unknown, fallback: WhatsAppPolicy): WhatsAppPolicy {
  return POLICIES.includes(value as WhatsAppPolicy) ? (value as WhatsAppPolicy) : fallback;
}

function readRole(value: unknown): WhatsAppRole {
  return ROLES.includes(value as WhatsAppRole) ? (value as WhatsAppRole) : 'viewer';
}

function normalizeStatus(payload: unknown): OsirisWhatsAppStatus {
  const v = readRecord(payload);
  return {
    status: readState(v.status),
    phoneNumber: readStringOrNull(v.phone_number ?? v.phoneNumber),
    connectedAt: readStringOrNull(v.connected_at ?? v.connectedAt),
    uptime: readNumberOrNull(v.uptime),
  };
}

function normalizeConfig(payload: unknown): OsirisWhatsAppConfig {
  const v = readRecord(payload);
  return {
    orgId: readString(v.org_id ?? v.orgId),
    autoReply: readBoolean(v.auto_reply ?? v.autoReply, true),
    dmPolicy: readPolicy(v.dm_policy ?? v.dmPolicy, 'allowlist'),
    groupPolicy: readPolicy(v.group_policy ?? v.groupPolicy, 'disabled'),
  };
}

function normalizeContact(row: unknown): OsirisWhatsAppContact {
  const v = readRecord(row);
  const contactType = (v.contact_type ?? v.contactType) === 'group' ? 'group' : 'individual';
  return {
    id: readString(v.id),
    orgId: readString(v.org_id ?? v.orgId),
    phoneNumber: readString(v.phone_number ?? v.phoneNumber),
    displayName: readStringOrNull(v.display_name ?? v.displayName),
    contactType,
    groupJid: readStringOrNull(v.group_jid ?? v.groupJid),
    autoReply: readBoolean(v.auto_reply ?? v.autoReply, true),
    userId: readStringOrNull(v.user_id ?? v.userId),
    waRole: readRole(v.wa_role ?? v.waRole),
    createdBy: readStringOrNull(v.created_by ?? v.createdBy),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

async function ensureOk(response: Response, fallback: string): Promise<void> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }
}

export function createOsirisWhatsAppClient(options: OsirisWhatsAppClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);
  const jsonInit = (method: string, body: unknown) => ({
    method,
    credentials: 'include' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return {
    async getStatus(): Promise<OsirisWhatsAppStatus> {
      const response = await fetch(url('/whatsapp/status'), { credentials: 'include' });
      await ensureOk(response, 'WhatsApp status could not be loaded.');
      return normalizeStatus(await response.json());
    },

    async getConfig(): Promise<OsirisWhatsAppConfig> {
      const response = await fetch(url('/whatsapp/config'), { credentials: 'include' });
      await ensureOk(response, 'WhatsApp settings could not be loaded.');
      return normalizeConfig(await response.json());
    },

    async updateConfig(input: OsirisWhatsAppConfigInput): Promise<OsirisWhatsAppConfig> {
      const response = await fetch(url('/whatsapp/config'), jsonInit('PATCH', input));
      await ensureOk(response, 'WhatsApp settings could not be saved.');
      return normalizeConfig(await response.json());
    },

    async listContacts(): Promise<{ contacts: OsirisWhatsAppContact[] }> {
      const response = await fetch(url('/whatsapp/contacts'), { credentials: 'include' });
      await ensureOk(response, 'WhatsApp contacts could not be loaded.');
      const payload: unknown = await response.json();
      const rows = readRecord(payload).contacts;
      return { contacts: Array.isArray(rows) ? rows.map(normalizeContact) : [] };
    },

    async addContact(input: OsirisWhatsAppAddContactInput): Promise<OsirisWhatsAppContact> {
      const response = await fetch(url('/whatsapp/contacts'), jsonInit('POST', input));
      await ensureOk(response, 'Contact could not be added.');
      return normalizeContact(await response.json());
    },

    async updateContact(
      id: string,
      input: OsirisWhatsAppUpdateContactInput,
    ): Promise<OsirisWhatsAppContact> {
      const response = await fetch(
        url(`/whatsapp/contacts/${encodeURIComponent(id)}`),
        jsonInit('PATCH', input),
      );
      await ensureOk(response, 'Contact could not be updated.');
      return normalizeContact(await response.json());
    },

    async deleteContact(id: string): Promise<void> {
      const response = await fetch(url(`/whatsapp/contacts/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      await ensureOk(response, 'Contact could not be removed.');
    },
  };
}

export type OsirisWhatsAppClient = ReturnType<typeof createOsirisWhatsAppClient>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/data/whatsappClient.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/settings/whatsapp/data/whatsappClient.ts apps/web/src/modules/settings/whatsapp/data/whatsappClient.test.ts
git commit -m "feat(settings): add WhatsApp osiris fetch client"
```

---

## Task 2: Query-key factory

**Files:**

- Create: `apps/web/src/modules/settings/whatsapp/data/whatsappKeys.ts`
- Test: `apps/web/src/modules/settings/whatsapp/data/whatsappKeys.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/settings/whatsapp/data/whatsappKeys.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { whatsappKeys } from './whatsappKeys';

describe('whatsappKeys', () => {
  it('scopes keys by org id', () => {
    expect(whatsappKeys.status('org_1')).toEqual(['whatsapp', 'org_1', 'status']);
    expect(whatsappKeys.config('org_1')).toEqual(['whatsapp', 'org_1', 'config']);
    expect(whatsappKeys.contacts('org_1')).toEqual(['whatsapp', 'org_1', 'contacts']);
    expect(whatsappKeys.members('org_1')).toEqual(['whatsapp', 'org_1', 'members']);
  });

  it('uses a stable placeholder when org id is null', () => {
    expect(whatsappKeys.status(null)).toEqual(['whatsapp', 'none', 'status']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/data/whatsappKeys.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the key factory**

Create `apps/web/src/modules/settings/whatsapp/data/whatsappKeys.ts`:

```ts
const orgScope = (orgId: string | null) => orgId ?? 'none';

export const whatsappKeys = {
  status: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'status'] as const,
  config: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'config'] as const,
  contacts: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'contacts'] as const,
  members: (orgId: string | null) => ['whatsapp', orgScope(orgId), 'members'] as const,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/data/whatsappKeys.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/settings/whatsapp/data/whatsappKeys.ts apps/web/src/modules/settings/whatsapp/data/whatsappKeys.test.ts
git commit -m "feat(settings): add WhatsApp query-key factory"
```

---

## Task 3: react-query hooks

**Files:**

- Create: `apps/web/src/modules/settings/whatsapp/data/useWhatsApp.ts`

No standalone test — these hooks are exercised through the component tests in Tasks 5–7 (which mock `whatsappClient` and provide the runtime + a `QueryClientProvider`). This matches how the storage module tests its hooks via components.

- [ ] **Step 1: Write the hooks module**

Create `apps/web/src/modules/settings/whatsapp/data/useWhatsApp.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import {
  createOsirisWhatsAppClient,
  type OsirisWhatsAppAddContactInput,
  type OsirisWhatsAppConfigInput,
  type OsirisWhatsAppUpdateContactInput,
} from './whatsappClient';
import { whatsappKeys } from './whatsappKeys';

export function useWhatsAppClient() {
  return useMemo(() => createOsirisWhatsAppClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useWhatsAppStatus() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  return useQuery({
    queryKey: whatsappKeys.status(orgId),
    queryFn: () => client.getStatus(),
    refetchInterval: 30_000,
  });
}

export function useWhatsAppConfig() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  return useQuery({
    queryKey: whatsappKeys.config(orgId),
    queryFn: () => client.getConfig(),
    enabled: Boolean(orgId),
  });
}

export function useUpdateWhatsAppConfig() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OsirisWhatsAppConfigInput) => client.updateConfig(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.config(orgId) });
    },
  });
}

export function useWhatsAppContacts() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  return useQuery({
    queryKey: whatsappKeys.contacts(orgId),
    queryFn: () => client.listContacts(),
    enabled: Boolean(orgId),
  });
}

export function useAddWhatsAppContact() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OsirisWhatsAppAddContactInput) => client.addContact(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts(orgId) });
    },
  });
}

export function useUpdateWhatsAppContact() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & OsirisWhatsAppUpdateContactInput) =>
      client.updateContact(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts(orgId) });
    },
  });
}

export function useDeleteWhatsAppContact() {
  const client = useWhatsAppClient();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.deleteContact(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.contacts(orgId) });
    },
  });
}

/** Org members for the "link user" dropdown. Empty when the runtime can't list members. */
export function useWhatsAppOrgMembers() {
  const runtime = useOptionalOsirisRuntime();
  const orgId = useOrgId();
  const listOrgMembers = runtime?.listOrgMembers;
  return useQuery({
    queryKey: whatsappKeys.members(orgId),
    queryFn: () => listOrgMembers!(orgId),
    enabled: Boolean(orgId) && Boolean(listOrgMembers),
  });
}
```

- [ ] **Step 2: Typecheck the module**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS (no type errors from the new file). If pre-existing unrelated errors appear, confirm none reference `whatsapp`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/settings/whatsapp/data/useWhatsApp.ts
git commit -m "feat(settings): add WhatsApp react-query hooks"
```

---

## Task 4: i18n keys (en + de)

**Files:**

- Modify: `packages/i18n/locales/en/settings.json`
- Modify: `packages/i18n/locales/de/settings.json`

- [ ] **Step 1: Add English keys**

Insert these keys into the top-level object in `packages/i18n/locales/en/settings.json` (alongside the existing keys — JSON object order is irrelevant; do not duplicate any existing key):

```json
  "whatsappTab": "WhatsApp",
  "whatsappSettingsTitle": "WhatsApp",
  "whatsappSettingsDescription": "Connect the WhatsApp bot, set messaging policies, and manage the contact allowlist.",
  "whatsappConnection": "Connection",
  "whatsappBotTitle": "WhatsApp bot",
  "whatsappConnected": "Connected",
  "whatsappConnecting": "Connecting",
  "whatsappDisconnected": "Disconnected",
  "whatsappUptime": "Uptime",
  "whatsappPairingHint": "The bot is not paired. Pair it from the server to enable messaging.",
  "whatsappMessagingPolicies": "Messaging policies",
  "whatsappAutoReply": "Auto-reply",
  "whatsappAutoReplyDescription": "Let the bot reply automatically to allowed contacts.",
  "whatsappDmPolicy": "Direct messages",
  "whatsappDmPolicyDescription": "Who the bot responds to in direct chats.",
  "whatsappGroupPolicy": "Group messages",
  "whatsappGroupPolicyDescription": "Who the bot responds to in group chats.",
  "whatsappPolicyAllowlist": "Allowlist",
  "whatsappPolicyDisabled": "Disabled",
  "whatsappAllowedContacts": "Allowed contacts",
  "whatsappAllowedContactsDescription": "Only contacts on this list can interact with the bot.",
  "whatsappNoContacts": "No contacts yet.",
  "whatsappAddContact": "Add contact",
  "whatsappEditContact": "Edit contact",
  "whatsappDisableAutoReply": "Disable auto-reply",
  "whatsappEnableAutoReply": "Enable auto-reply",
  "whatsappPhoneNumber": "Phone number",
  "whatsappPhoneHint": "Select the country and enter the number; it is normalized to international format.",
  "whatsappDisplayNameOptional": "Display name (optional)",
  "whatsappLinkUser": "Linked user",
  "whatsappNoLinkedUser": "No linked user",
  "whatsappRoleOverride": "Role override",
  "whatsappPhoneRequired": "Enter a phone number.",
  "whatsappContactAdded": "Contact added.",
  "whatsappAddContactFailed": "Contact could not be added.",
  "whatsappContactUpdated": "Contact updated.",
  "whatsappUpdateContactFailed": "Contact could not be updated.",
  "whatsappContactRemoved": "Contact removed.",
  "whatsappRemoveContactFailed": "Contact could not be removed.",
  "whatsappUpdateSettingsFailed": "Settings could not be saved.",
  "whatsappDeleteContactTitle": "Remove contact?",
  "whatsappDeleteContactDescription": "This contact will no longer be able to interact with the bot.",
  "roleOwner": "Owner",
  "roleAdmin": "Admin",
  "roleMember": "Member",
  "roleViewer": "Viewer",
```

Note: if any of `roleOwner`/`roleAdmin`/`roleMember`/`roleViewer` already exist in the file, skip those four lines (the validate step in Step 3 will catch a duplicate-key mistake).

- [ ] **Step 2: Add German keys**

Insert the matching keys into `packages/i18n/locales/de/settings.json`:

```json
  "whatsappTab": "WhatsApp",
  "whatsappSettingsTitle": "WhatsApp",
  "whatsappSettingsDescription": "WhatsApp-Bot verbinden, Nachrichtenrichtlinien festlegen und die Kontaktfreigabeliste verwalten.",
  "whatsappConnection": "Verbindung",
  "whatsappBotTitle": "WhatsApp-Bot",
  "whatsappConnected": "Verbunden",
  "whatsappConnecting": "Verbindet",
  "whatsappDisconnected": "Getrennt",
  "whatsappUptime": "Laufzeit",
  "whatsappPairingHint": "Der Bot ist nicht gekoppelt. Koppeln Sie ihn auf dem Server, um Nachrichten zu aktivieren.",
  "whatsappMessagingPolicies": "Nachrichtenrichtlinien",
  "whatsappAutoReply": "Automatische Antwort",
  "whatsappAutoReplyDescription": "Lassen Sie den Bot automatisch auf freigegebene Kontakte antworten.",
  "whatsappDmPolicy": "Direktnachrichten",
  "whatsappDmPolicyDescription": "Auf wen der Bot in Direktchats antwortet.",
  "whatsappGroupPolicy": "Gruppennachrichten",
  "whatsappGroupPolicyDescription": "Auf wen der Bot in Gruppenchats antwortet.",
  "whatsappPolicyAllowlist": "Freigabeliste",
  "whatsappPolicyDisabled": "Deaktiviert",
  "whatsappAllowedContacts": "Freigegebene Kontakte",
  "whatsappAllowedContactsDescription": "Nur Kontakte auf dieser Liste können mit dem Bot interagieren.",
  "whatsappNoContacts": "Noch keine Kontakte.",
  "whatsappAddContact": "Kontakt hinzufügen",
  "whatsappEditContact": "Kontakt bearbeiten",
  "whatsappDisableAutoReply": "Automatische Antwort deaktivieren",
  "whatsappEnableAutoReply": "Automatische Antwort aktivieren",
  "whatsappPhoneNumber": "Telefonnummer",
  "whatsappPhoneHint": "Land auswählen und Nummer eingeben; sie wird ins internationale Format umgewandelt.",
  "whatsappDisplayNameOptional": "Anzeigename (optional)",
  "whatsappLinkUser": "Verknüpfter Benutzer",
  "whatsappNoLinkedUser": "Kein verknüpfter Benutzer",
  "whatsappRoleOverride": "Rollenüberschreibung",
  "whatsappPhoneRequired": "Geben Sie eine Telefonnummer ein.",
  "whatsappContactAdded": "Kontakt hinzugefügt.",
  "whatsappAddContactFailed": "Kontakt konnte nicht hinzugefügt werden.",
  "whatsappContactUpdated": "Kontakt aktualisiert.",
  "whatsappUpdateContactFailed": "Kontakt konnte nicht aktualisiert werden.",
  "whatsappContactRemoved": "Kontakt entfernt.",
  "whatsappRemoveContactFailed": "Kontakt konnte nicht entfernt werden.",
  "whatsappUpdateSettingsFailed": "Einstellungen konnten nicht gespeichert werden.",
  "whatsappDeleteContactTitle": "Kontakt entfernen?",
  "whatsappDeleteContactDescription": "Dieser Kontakt kann dann nicht mehr mit dem Bot interagieren.",
  "roleOwner": "Inhaber",
  "roleAdmin": "Administrator",
  "roleMember": "Mitglied",
  "roleViewer": "Betrachter",
```

(Same note: skip the four `role*` lines if they already exist in the de file.)

- [ ] **Step 3: Validate en/de parity and JSON**

Run: `pnpm --filter @oktavius/i18n validate`
Expected: PASS — no missing keys between en and de, valid JSON. If it reports a duplicate key, remove the duplicate `role*` lines you just added.

- [ ] **Step 4: Commit**

```bash
git add packages/i18n/locales/en/settings.json packages/i18n/locales/de/settings.json
git commit -m "feat(i18n): add WhatsApp settings keys (en, de)"
```

---

## Task 5: Connection status panel

**Files:**

- Create: `apps/web/src/modules/settings/whatsapp/WhatsAppConnection.tsx`
- Test: `apps/web/src/modules/settings/whatsapp/WhatsAppConnection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/settings/whatsapp/WhatsAppConnection.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

const getStatus = vi.fn();

vi.mock('./data/whatsappClient', () => ({
  createOsirisWhatsAppClient: () => ({ getStatus }),
}));
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({ activeOrgId: 'org_1' }),
}));

import { WhatsAppConnection } from './WhatsAppConnection';

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

async function renderPanel() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <WhatsAppConnection />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('WhatsAppConnection', () => {
  it('shows the connected phone number and formatted uptime', async () => {
    getStatus.mockResolvedValue({
      status: 'connected',
      phoneNumber: '+431234567',
      connectedAt: 't',
      uptime: 3720,
    });

    await renderPanel();

    expect(container.textContent).toContain('+431234567');
    expect(container.textContent).toContain('1h 2m');
  });

  it('shows the pairing hint when disconnected', async () => {
    getStatus.mockResolvedValue({
      status: 'disconnected',
      phoneNumber: null,
      connectedAt: null,
      uptime: null,
    });

    await renderPanel();

    expect(container.textContent).not.toContain('+');
    expect(container.querySelector('[data-testid="wa-pairing-hint"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/WhatsAppConnection.test.tsx`
Expected: FAIL — `WhatsAppConnection` module does not exist.

- [ ] **Step 3: Write the component**

Create `apps/web/src/modules/settings/whatsapp/WhatsAppConnection.tsx`:

```tsx
import { Badge } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { WhatsAppConnectionIcon } from '@/lib/icons';

import { useWhatsAppStatus } from './data/useWhatsApp';

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function WhatsAppConnection() {
  const { t } = useTranslation();
  const { data: status, isLoading } = useWhatsAppStatus();

  const isConnected = status?.status === 'connected';
  const isConnecting = status?.status === 'connecting';

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <WhatsAppConnectionIcon size={14} className="text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('settings.whatsappConnection', undefined, 'Connection')}
        </h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          {t('common.loading', undefined, 'Loading…')}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {t('settings.whatsappBotTitle', undefined, 'WhatsApp bot')}
                </p>
                <Badge variant={isConnected ? 'success' : isConnecting ? 'warning' : 'outline'}>
                  {isConnected
                    ? t('settings.whatsappConnected', undefined, 'Connected')
                    : isConnecting
                      ? t('settings.whatsappConnecting', undefined, 'Connecting')
                      : t('settings.whatsappDisconnected', undefined, 'Disconnected')}
                </Badge>
              </div>
              {isConnected && status?.phoneNumber ? (
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {status.phoneNumber}
                </p>
              ) : null}
            </div>
            {isConnected && status?.uptime != null ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {t('settings.whatsappUptime', undefined, 'Uptime')}: {formatUptime(status.uptime)}
              </span>
            ) : null}
          </div>

          {!isConnected && !isConnecting ? (
            <p data-testid="wa-pairing-hint" className="text-xs text-muted-foreground">
              {t(
                'settings.whatsappPairingHint',
                undefined,
                'The bot is not paired. Pair it from the server to enable messaging.',
              )}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
```

Note: `WhatsAppConnectionIcon` is added in Task 8. Until then this import will not resolve — run this task's test after Task 8 if executing strictly in order, or add the icon alias first. To keep tasks independent, add the three icon aliases now as a one-line prelude (see Task 8, Step 1) and commit them with Task 8.

- [ ] **Step 4: Add the icon aliases (prerequisite for rendering)**

Apply Task 8 Step 1 now (add `WhatsAppIcon`, `WhatsAppConnectionIcon`, `WhatsAppPolicyIcon` to `apps/web/src/lib/icons.ts`). Do not commit yet — it commits with Task 8.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/WhatsAppConnection.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/settings/whatsapp/WhatsAppConnection.tsx apps/web/src/modules/settings/whatsapp/WhatsAppConnection.test.tsx
git commit -m "feat(settings): add WhatsApp connection status panel"
```

---

## Task 6: Policies + contacts allowlist

**Files:**

- Create: `apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.tsx`
- Test: `apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

const getConfig = vi.fn();
const updateConfig = vi.fn();
const listContacts = vi.fn();
const deleteContact = vi.fn();

vi.mock('./data/whatsappClient', () => ({
  createOsirisWhatsAppClient: () => ({
    getConfig,
    updateConfig,
    listContacts,
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact,
  }),
}));
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'org_1',
    listOrgMembers: vi.fn().mockResolvedValue([]),
  }),
}));

import { WhatsAppContactsConfig } from './WhatsAppContactsConfig';

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  getConfig.mockResolvedValue({
    orgId: 'org_1',
    autoReply: true,
    dmPolicy: 'allowlist',
    groupPolicy: 'disabled',
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

async function renderConfig() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <WhatsAppContactsConfig />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('WhatsAppContactsConfig', () => {
  it('renders an empty allowlist state', async () => {
    listContacts.mockResolvedValue({ contacts: [] });

    await renderConfig();

    expect(container.querySelector('[data-testid="wa-contacts-empty"]')).not.toBeNull();
  });

  it('lists contacts with their role badge', async () => {
    listContacts.mockResolvedValue({
      contacts: [
        {
          id: 'c1',
          orgId: 'org_1',
          phoneNumber: '+4311111',
          displayName: 'Max Mustermann',
          contactType: 'individual',
          groupJid: null,
          autoReply: true,
          userId: null,
          waRole: 'member',
          createdBy: null,
          createdAt: 'a',
          updatedAt: 'b',
        },
      ],
    });

    await renderConfig();

    expect(container.textContent).toContain('Max Mustermann');
    expect(container.textContent).toContain('+4311111');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/WhatsAppContactsConfig.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the component**

Create `apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.tsx`:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { MoreIcon, PhoneIcon, PlusIcon, WhatsAppPolicyIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import {
  useAddWhatsAppContact,
  useDeleteWhatsAppContact,
  useUpdateWhatsAppContact,
  useUpdateWhatsAppConfig,
  useWhatsAppConfig,
  useWhatsAppContacts,
  useWhatsAppOrgMembers,
} from './data/useWhatsApp';
import type { OsirisWhatsAppContact, WhatsAppPolicy, WhatsAppRole } from './data/whatsappClient';

const ROLE_VARIANT: Record<WhatsAppRole, 'destructive' | 'secondary' | 'outline'> = {
  owner: 'destructive',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
};

const ROLES: WhatsAppRole[] = ['owner', 'admin', 'member', 'viewer'];

export function WhatsAppContactsConfig() {
  const { t } = useTranslation();
  const { data: configData, isLoading: configLoading } = useWhatsAppConfig();
  const { data: contactsData, isLoading: contactsLoading } = useWhatsAppContacts();
  const { data: orgMembers } = useWhatsAppOrgMembers();
  const updateConfig = useUpdateWhatsAppConfig();
  const addContact = useAddWhatsAppContact();
  const updateContact = useUpdateWhatsAppContact();
  const deleteContact = useDeleteWhatsAppContact();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<OsirisWhatsAppContact | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OsirisWhatsAppContact | null>(null);

  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newUserId, setNewUserId] = useState('none');
  const [newRole, setNewRole] = useState<WhatsAppRole>('viewer');

  const [editUserId, setEditUserId] = useState('none');
  const [editRole, setEditRole] = useState<WhatsAppRole>('viewer');
  const [editAutoReply, setEditAutoReply] = useState(true);

  const contacts = contactsData?.contacts ?? [];
  const members = orgMembers ?? [];

  const roleLabel = (role: WhatsAppRole) =>
    t(`settings.role${role.charAt(0).toUpperCase()}${role.slice(1)}`, undefined, role);

  const resetAddForm = () => {
    setNewPhone('');
    setNewName('');
    setNewUserId('none');
    setNewRole('viewer');
  };

  const handleConfigChange = async (input: {
    autoReply?: boolean;
    dmPolicy?: WhatsAppPolicy;
    groupPolicy?: WhatsAppPolicy;
  }) => {
    try {
      await updateConfig.mutateAsync(input);
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateSettingsFailed', undefined, 'Settings could not be saved.'),
      );
    }
  };

  const handleAdd = async () => {
    const phoneNumber = newPhone.replace(/\s+/g, '');
    if (!phoneNumber) {
      appToast.error(t('settings.whatsappPhoneRequired', undefined, 'Enter a phone number.'));
      return;
    }
    try {
      await addContact.mutateAsync({
        phoneNumber,
        displayName: newName.trim() || undefined,
        autoReply: true,
        userId: newUserId === 'none' ? null : newUserId,
        waRole: newRole,
      });
      resetAddForm();
      setAddOpen(false);
      appToast.success(t('settings.whatsappContactAdded', undefined, 'Contact added.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappAddContactFailed', undefined, 'Contact could not be added.'),
      );
    }
  };

  const openEdit = (contact: OsirisWhatsAppContact) => {
    setEditUserId(contact.userId ?? 'none');
    setEditRole(contact.waRole);
    setEditAutoReply(contact.autoReply);
    setEditing(contact);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      await updateContact.mutateAsync({
        id: editing.id,
        userId: editUserId === 'none' ? null : editUserId,
        waRole: editRole,
        autoReply: editAutoReply,
      });
      setEditing(null);
      appToast.success(t('settings.whatsappContactUpdated', undefined, 'Contact updated.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateContactFailed', undefined, 'Contact could not be updated.'),
      );
    }
  };

  const handleToggleAutoReply = async (contact: OsirisWhatsAppContact) => {
    try {
      await updateContact.mutateAsync({ id: contact.id, autoReply: !contact.autoReply });
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateContactFailed', undefined, 'Contact could not be updated.'),
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteContact.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
      appToast.success(t('settings.whatsappContactRemoved', undefined, 'Contact removed.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappRemoveContactFailed', undefined, 'Contact could not be removed.'),
      );
    }
  };

  const memberOptions = (
    <>
      <SelectItem value="none">
        {t('settings.whatsappNoLinkedUser', undefined, 'No linked user')}
      </SelectItem>
      {members.map((member) => (
        <SelectItem key={member.userId} value={member.userId}>
          {member.fullName || member.email || member.userId}
        </SelectItem>
      ))}
    </>
  );

  const roleOptions = (
    <>
      {ROLES.map((role) => (
        <SelectItem key={role} value={role}>
          {roleLabel(role)}
        </SelectItem>
      ))}
    </>
  );

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <WhatsAppPolicyIcon size={14} className="text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.whatsappMessagingPolicies', undefined, 'Messaging policies')}
          </h2>
        </div>

        {configLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.loading', undefined, 'Loading…')}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">
                  {t('settings.whatsappAutoReply', undefined, 'Auto-reply')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'settings.whatsappAutoReplyDescription',
                    undefined,
                    'Let the bot reply automatically to allowed contacts.',
                  )}
                </p>
              </div>
              <Switch
                checked={configData?.autoReply ?? true}
                onCheckedChange={(checked) => void handleConfigChange({ autoReply: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">
                  {t('settings.whatsappDmPolicy', undefined, 'Direct messages')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'settings.whatsappDmPolicyDescription',
                    undefined,
                    'Who the bot responds to in direct chats.',
                  )}
                </p>
              </div>
              <Select
                value={configData?.dmPolicy ?? 'allowlist'}
                onValueChange={(value) =>
                  void handleConfigChange({ dmPolicy: value as WhatsAppPolicy })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowlist">
                    {t('settings.whatsappPolicyAllowlist', undefined, 'Allowlist')}
                  </SelectItem>
                  <SelectItem value="disabled">
                    {t('settings.whatsappPolicyDisabled', undefined, 'Disabled')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">
                  {t('settings.whatsappGroupPolicy', undefined, 'Group messages')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'settings.whatsappGroupPolicyDescription',
                    undefined,
                    'Who the bot responds to in group chats.',
                  )}
                </p>
              </div>
              <Select
                value={configData?.groupPolicy ?? 'disabled'}
                onValueChange={(value) =>
                  void handleConfigChange({ groupPolicy: value as WhatsAppPolicy })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowlist">
                    {t('settings.whatsappPolicyAllowlist', undefined, 'Allowlist')}
                  </SelectItem>
                  <SelectItem value="disabled">
                    {t('settings.whatsappPolicyDisabled', undefined, 'Disabled')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} className="text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('settings.whatsappAllowedContacts', undefined, 'Allowed contacts')}
            </h2>
            {!contactsLoading && contacts.length > 0 ? (
              <span className="text-xs text-muted-foreground">({contacts.length})</span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetAddForm();
              setAddOpen(true);
            }}
          >
            <PlusIcon size={14} aria-hidden="true" />
            {t('settings.whatsappAddContact', undefined, 'Add contact')}
          </Button>
        </div>

        {contactsLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.loading', undefined, 'Loading…')}
          </p>
        ) : contacts.length === 0 ? (
          <p data-testid="wa-contacts-empty" className="text-sm text-muted-foreground">
            {t('settings.whatsappNoContacts', undefined, 'No contacts yet.')}
          </p>
        ) : (
          <div className="divide-y divide-border rounded-control border border-border">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <PhoneIcon size={14} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {contact.displayName || contact.phoneNumber}
                    </p>
                    {contact.displayName ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        {contact.phoneNumber}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={ROLE_VARIANT[contact.waRole]} className="text-xs">
                    {roleLabel(contact.waRole)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
                        <MoreIcon size={14} aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onSelect={() => openEdit(contact)}>
                        {t('settings.whatsappEditContact', undefined, 'Edit contact')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void handleToggleAutoReply(contact)}>
                        {contact.autoReply
                          ? t('settings.whatsappDisableAutoReply', undefined, 'Disable auto-reply')
                          : t('settings.whatsappEnableAutoReply', undefined, 'Enable auto-reply')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setPendingDelete(contact)}
                      >
                        {t('common.delete', undefined, 'Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.whatsappAddContact', undefined, 'Add contact')}</DialogTitle>
            <DialogDescription>
              {t(
                'settings.whatsappAllowedContactsDescription',
                undefined,
                'Only contacts on this list can interact with the bot.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone" className="text-xs text-muted-foreground">
                {t('settings.whatsappPhoneNumber', undefined, 'Phone number')}
              </Label>
              <PhoneInput id="wa-phone" value={newPhone} onChange={setNewPhone} />
              <p className="text-xs text-muted-foreground">
                {t(
                  'settings.whatsappPhoneHint',
                  undefined,
                  'Select the country and enter the number; it is normalized to international format.',
                )}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-name" className="text-xs text-muted-foreground">
                {t('settings.whatsappDisplayNameOptional', undefined, 'Display name (optional)')}
              </Label>
              <Input
                id="wa-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t('settings.whatsappLinkUser', undefined, 'Linked user')}
                </Label>
                <Select value={newUserId} onValueChange={setNewUserId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{memberOptions}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t('settings.whatsappRoleOverride', undefined, 'Role override')}
                </Label>
                <Select
                  value={newRole}
                  onValueChange={(value) => setNewRole(value as WhatsAppRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{roleOptions}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button size="sm" onClick={() => void handleAdd()} disabled={addContact.isPending}>
              {t('settings.whatsappAddContact', undefined, 'Add contact')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('settings.whatsappEditContact', undefined, 'Edit contact')}
            </DialogTitle>
            <DialogDescription>{editing?.displayName || editing?.phoneNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('settings.whatsappLinkUser', undefined, 'Linked user')}
              </Label>
              <Select value={editUserId} onValueChange={setEditUserId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{memberOptions}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('settings.whatsappRoleOverride', undefined, 'Role override')}
              </Label>
              <Select
                value={editRole}
                onValueChange={(value) => setEditRole(value as WhatsAppRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{roleOptions}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm">
                {t('settings.whatsappAutoReply', undefined, 'Auto-reply')}
              </Label>
              <Switch checked={editAutoReply} onCheckedChange={setEditAutoReply} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleEditSave()}
              disabled={updateContact.isPending}
            >
              {t('common.save', undefined, 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.whatsappDeleteContactTitle', undefined, 'Remove contact?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'settings.whatsappDeleteContactDescription',
                undefined,
                'This contact will no longer be able to interact with the bot.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              {t('common.delete', undefined, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp/WhatsAppContactsConfig.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.tsx apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.test.tsx
git commit -m "feat(settings): add WhatsApp policies and contacts allowlist"
```

---

## Task 7: Section composer

**Files:**

- Create: `apps/web/src/modules/settings/whatsapp/WhatsAppSettingsSection.tsx`

This thin wrapper composes the two panels with the active-org guard (mirroring the osiris route shell). It has no branching logic worth a dedicated test; it is covered indirectly by the SettingsPage test in Task 8.

- [ ] **Step 1: Write the component**

Create `apps/web/src/modules/settings/whatsapp/WhatsAppSettingsSection.tsx`:

```tsx
import { useTranslation } from '@/core/i18n';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { WhatsAppConnection } from './WhatsAppConnection';
import { WhatsAppContactsConfig } from './WhatsAppContactsConfig';

export function WhatsAppSettingsSection() {
  const { t } = useTranslation();
  const activeOrgId = useOptionalOsirisRuntime()?.activeOrgId ?? null;

  if (!activeOrgId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('common.selectOrgRequired', undefined, 'Select an organization first.')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <WhatsAppConnection />
      <div className="border-t border-border" />
      <WhatsAppContactsConfig />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS (no errors referencing `whatsapp`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/settings/whatsapp/WhatsAppSettingsSection.tsx
git commit -m "feat(settings): add WhatsApp settings section composer"
```

---

## Task 8: Icons + register the tab

**Files:**

- Modify: `apps/web/src/lib/icons.ts`
- Modify: `apps/web/src/modules/settings/SettingsPage.tsx`
- Test: `apps/web/src/modules/settings/SettingsPage.test.tsx`

- [ ] **Step 1: Add icon aliases**

In `apps/web/src/lib/icons.ts`, add a new export block (place it after an existing `export { … } from '@phosphor-icons/react'` block — the file already uses aliased re-exports such as `Plus as PlusIcon`, `ChatCircle as MessageSquareIcon`):

```ts
export {
  WhatsappLogo as WhatsAppIcon,
  WifiHigh as WhatsAppConnectionIcon,
  ShieldCheck as WhatsAppPolicyIcon,
} from '@phosphor-icons/react';
```

(`WhatsappLogo`, `WifiHigh`, and `ShieldCheck` are confirmed present in `@phosphor-icons/react@2.1.10`.)

- [ ] **Step 2: Write the failing test**

The existing `SettingsPage.test.tsx` already provides a `renderSettingsPage()` helper, a `runtime` mock whose `permissionSubject.permissions` includes `'org.manage'`, and a `roots` array for cleanup. The default-active section is `general`, so this assertion checks only the tab nav label — the WhatsApp panel's react-query content is not mounted, so no `QueryClientProvider` is needed.

Add this test inside the existing `describe('SettingsPage', …)` block:

```tsx
it('shows the WhatsApp settings tab for org managers', async () => {
  const rendered = await renderSettingsPage();
  roots.push(rendered.root);

  expect(rendered.container.textContent).toContain('WhatsApp');
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/SettingsPage.test.tsx`
Expected: FAIL — "WhatsApp" not found (tab not registered yet).

- [ ] **Step 4: Register the tab in SettingsPage**

In `apps/web/src/modules/settings/SettingsPage.tsx`:

Add to the icon import from `@/lib/icons` (the existing block imports `BrainIcon`, `DocumentIcon`, etc.):

```ts
  WhatsAppIcon,
```

Add the section import near the other settings component imports:

```ts
import { WhatsAppSettingsSection } from '@/modules/settings/whatsapp/WhatsAppSettingsSection';
```

Add a new entry to the `settingsSections` array (place it after the `notifications` section, before `catalogs`):

```tsx
    {
      id: 'whatsapp',
      label: t('settings.whatsappTab', undefined, 'WhatsApp'),
      icon: <WhatsAppIcon size={16} weight="duotone" />,
      title: t('settings.whatsappSettingsTitle', undefined, 'WhatsApp'),
      sectionDescription: t(
        'settings.whatsappSettingsDescription',
        undefined,
        'Connect the WhatsApp bot, set messaging policies, and manage the contact allowlist.',
      ),
      permission: 'org.manage',
      render: () => <WhatsAppSettingsSection />,
    },
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/SettingsPage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/icons.ts apps/web/src/modules/settings/SettingsPage.tsx apps/web/src/modules/settings/SettingsPage.test.tsx
git commit -m "feat(settings): register WhatsApp settings tab"
```

---

## Task 9: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole WhatsApp test suite**

Run: `pnpm --filter @oktavius/web vitest run src/modules/settings/whatsapp src/modules/settings/SettingsPage.test.tsx`
Expected: PASS — all client, key, connection, contacts, and SettingsPage tests green.

- [ ] **Step 2: Typecheck the web app**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS (no new errors).

- [ ] **Step 3: Lint the new files**

Run: `pnpm --filter @oktavius/web exec eslint src/modules/settings/whatsapp src/modules/settings/SettingsPage.tsx src/lib/icons.ts`
Expected: PASS (no errors). Fix any import-order / unused-import findings.

- [ ] **Step 4: Validate translations once more**

Run: `pnpm --filter @oktavius/i18n validate`
Expected: PASS.

- [ ] **Step 5: Manual smoke test (optional but recommended)**

Start the web app, sign in as an org manager, open `/settings`, and confirm: the WhatsApp tab appears; the connection panel renders a status badge; the policy toggles/selects persist (network PATCH `/whatsapp/config`); adding, editing, and deleting a contact works and the list refetches. Confirm a non-`org.manage` user does not see the tab.

---

## Notes for the implementer

- **Phone format handshake:** `PhoneInput` emits a spaced, dial-code-prefixed string (e.g. `"+43 1 234 5678"`). Task 6 strips whitespace and sends it as `phoneNumber` with no `countryCode` (the backend `addContactSchema` defaults `countryCode` and re-normalizes to E.164). If the backend rejects the value, surface the message via `appToast.fromApiError` (already wired) and verify `normalizePhoneNumber` accepts a `+`-prefixed input during the Step 5 smoke test.
- **No native dialogs:** contact deletion uses `AlertDialog` — never `window.confirm`/`alert`/`prompt` (project rule).
- **camelCase API:** normalizers read camelCase first with snake_case fallback, matching `storageClient.ts`. Do not assume snake_case.
- **`AlertDialogAction` variant:** base-ui supports `'cta' | 'destructive' | 'default'`; the delete action uses `'destructive'`.
- **Concurrent branch:** branch `FE` has simultaneous agent streams — stage only the files listed per task and commit promptly to avoid lint-staged stash clobbering uncommitted work.

```

```
