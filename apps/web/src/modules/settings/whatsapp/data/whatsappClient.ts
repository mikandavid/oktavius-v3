import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
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
