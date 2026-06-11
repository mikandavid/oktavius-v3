import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisDateFormat = 'DD.MM.YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
export type OsirisTimeFormat = '24h' | '12h';

export type OsirisWorkspaceSettings = {
  company: {
    legalName: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      postalCode: string;
      country: string;
    };
    taxId: string;
    vatId: string;
    registrationNumber: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
  };
  banking: {
    bankName: string;
    iban: string;
    bic: string;
    accountHolder: string;
  };
  invoicing: {
    defaultPaymentTermsDays: number;
    footerText: string;
    dunningEnabled: boolean;
    dunningLevels: { days: number; feePercent: number }[];
  };
  dateTime: {
    dateFormat: OsirisDateFormat;
    timeFormat: OsirisTimeFormat;
    timezone: string;
  };
  locations: {
    enforcementEnabled: boolean;
    sharedModules: string[];
    migrationReviewedAt?: string;
  };
  calendarV2: {
    maxTagsPerEvent: number | null;
    linkedCaseModuleKey: string | null;
    linkedFuneralCaseTitleMode: 'auto' | 'name_only' | 'full';
  };
  agent: {
    customInstructions: { id: string; content: string; enabled: boolean }[];
  };
  aiUsage: {
    warningThresholdPercent: number;
    hardLimitPercent: number;
    overageAllowed: boolean;
  };
  funeralCaseV2?: unknown;
};

export type OsirisWorkspaceSettingsInput = Partial<{
  company: Partial<OsirisWorkspaceSettings['company']>;
  banking: Partial<OsirisWorkspaceSettings['banking']>;
  invoicing: Partial<OsirisWorkspaceSettings['invoicing']>;
  dateTime: Partial<OsirisWorkspaceSettings['dateTime']>;
  locations: Partial<OsirisWorkspaceSettings['locations']>;
  calendarV2: Partial<OsirisWorkspaceSettings['calendarV2']>;
  agent: Partial<OsirisWorkspaceSettings['agent']>;
  aiUsage: Partial<OsirisWorkspaceSettings['aiUsage']>;
  funeralCaseV2: unknown;
}>;

export type OsirisWorkspaceSettingsClientOptions = {
  baseUrl?: string;
};

const DATE_FORMATS = new Set<OsirisDateFormat>([
  'DD.MM.YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'MM/DD/YYYY',
]);
const TIME_FORMATS = new Set<OsirisTimeFormat>(['24h', '12h']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function readDateFormat(value: unknown, fallback: OsirisDateFormat): OsirisDateFormat {
  return typeof value === 'string' && DATE_FORMATS.has(value as OsirisDateFormat)
    ? (value as OsirisDateFormat)
    : fallback;
}

function readTimeFormat(value: unknown, fallback: OsirisTimeFormat): OsirisTimeFormat {
  return typeof value === 'string' && TIME_FORMATS.has(value as OsirisTimeFormat)
    ? (value as OsirisTimeFormat)
    : fallback;
}

export function createDefaultOsirisWorkspaceSettings(
  overrides: OsirisWorkspaceSettingsInput = {},
): OsirisWorkspaceSettings {
  const company = readRecord(overrides.company);
  const address = readRecord(company.address);
  const banking = readRecord(overrides.banking);
  const invoicing = readRecord(overrides.invoicing);
  const dateTime = readRecord(overrides.dateTime);
  const locations = readRecord(overrides.locations);
  const calendarV2 = readRecord(overrides.calendarV2);
  const agent = readRecord(overrides.agent);
  const aiUsage = readRecord(overrides.aiUsage);

  const settings: OsirisWorkspaceSettings = {
    company: {
      legalName: readString(company.legalName),
      address: {
        line1: readString(address.line1),
        line2: readString(address.line2),
        city: readString(address.city),
        postalCode: readString(address.postalCode),
        country: readString(address.country, 'AT'),
      },
      taxId: readString(company.taxId),
      vatId: readString(company.vatId),
      registrationNumber: readString(company.registrationNumber),
      phone: readString(company.phone),
      email: readString(company.email),
      website: readString(company.website),
      logoUrl: readString(company.logoUrl),
    },
    banking: {
      bankName: readString(banking.bankName),
      iban: readString(banking.iban),
      bic: readString(banking.bic),
      accountHolder: readString(banking.accountHolder),
    },
    invoicing: {
      defaultPaymentTermsDays: readNumber(invoicing.defaultPaymentTermsDays, 30),
      footerText: readString(invoicing.footerText),
      dunningEnabled: readBoolean(invoicing.dunningEnabled),
      dunningLevels: Array.isArray(invoicing.dunningLevels)
        ? invoicing.dunningLevels.filter(isRecord).map((level) => ({
            days: readNumber(level.days, 7),
            feePercent: readNumber(level.feePercent, 0),
          }))
        : [
            { days: 7, feePercent: 0 },
            { days: 14, feePercent: 0 },
            { days: 30, feePercent: 0 },
          ],
    },
    dateTime: {
      dateFormat: readDateFormat(dateTime.dateFormat, 'DD.MM.YYYY'),
      timeFormat: readTimeFormat(dateTime.timeFormat, '24h'),
      timezone: readString(dateTime.timezone, 'Europe/Vienna'),
    },
    locations: {
      enforcementEnabled: readBoolean(locations.enforcementEnabled),
      sharedModules: readStringArray(locations.sharedModules),
      ...(typeof locations.migrationReviewedAt === 'string'
        ? { migrationReviewedAt: locations.migrationReviewedAt }
        : {}),
    },
    calendarV2: {
      maxTagsPerEvent:
        typeof calendarV2.maxTagsPerEvent === 'number' ? calendarV2.maxTagsPerEvent : null,
      linkedCaseModuleKey:
        typeof calendarV2.linkedCaseModuleKey === 'string' ? calendarV2.linkedCaseModuleKey : null,
      linkedFuneralCaseTitleMode:
        calendarV2.linkedFuneralCaseTitleMode === 'auto' ||
        calendarV2.linkedFuneralCaseTitleMode === 'name_only'
          ? calendarV2.linkedFuneralCaseTitleMode
          : 'full',
    },
    agent: {
      customInstructions: Array.isArray(agent.customInstructions)
        ? agent.customInstructions.filter(isRecord).map((instruction) => ({
            id: readString(instruction.id),
            content: readString(instruction.content),
            enabled: readBoolean(instruction.enabled, true),
          }))
        : [],
    },
    aiUsage: {
      warningThresholdPercent: readNumber(aiUsage.warningThresholdPercent, 30),
      hardLimitPercent: readNumber(aiUsage.hardLimitPercent, 100),
      overageAllowed: readBoolean(aiUsage.overageAllowed, true),
    },
  };

  if ('funeralCaseV2' in overrides) {
    settings.funeralCaseV2 = overrides.funeralCaseV2;
  }

  return settings;
}

export function normalizeOsirisWorkspaceSettings(raw: unknown): OsirisWorkspaceSettings {
  return createDefaultOsirisWorkspaceSettings(readRecord(raw) as OsirisWorkspaceSettingsInput);
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

export function createOsirisWorkspaceSettingsClient(
  options: OsirisWorkspaceSettingsClientOptions = {},
) {
  return {
    async loadWorkspaceSettings(orgId: string): Promise<OsirisWorkspaceSettings> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/orgs/${encodeURIComponent(orgId)}/settings`),
        { credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, 'Workspace settings could not be loaded.'),
        );
      }
      const payload: unknown = await response.json();
      return normalizeOsirisWorkspaceSettings(readRecord(payload).settings);
    },

    async updateWorkspaceSettings(
      orgId: string,
      settings: OsirisWorkspaceSettings,
    ): Promise<OsirisWorkspaceSettings> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/orgs/${encodeURIComponent(orgId)}/settings`),
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Workspace settings could not be saved.'));
      }
      const payload: unknown = await response.json();
      return normalizeOsirisWorkspaceSettings(readRecord(payload).settings);
    },
  };
}
