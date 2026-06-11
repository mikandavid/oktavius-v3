import {
  normalizeOsirisWorkspaceSettings,
  type OsirisWorkspaceSettings,
} from './workspaceSettingsClient';

export type OsirisRuntimeConfig = {
  org: {
    id: string;
    name: string;
    slug: string;
    industryKey: string;
    industryName: string;
    enabledModules: readonly string[];
    theme: Record<string, unknown>;
    settings: OsirisWorkspaceSettings;
    logoUrl: string | null;
  };
  terminology: Record<string, string>;
  permissions: readonly string[];
  preferences: Record<string, unknown>;
  agentAccess: boolean;
  roleName?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export function normalizeOsirisRuntimeConfig(value: unknown): OsirisRuntimeConfig | null {
  if (!isRecord(value) || !isRecord(value.org)) return null;

  return {
    org: {
      id: readString(value.org.id),
      name: readString(value.org.name),
      slug: readString(value.org.slug),
      industryKey: readString(value.org.industryKey, 'general'),
      industryName: readString(value.org.industryName, 'General'),
      enabledModules: readStringArray(value.org.enabledModules),
      theme: isRecord(value.org.theme) ? value.org.theme : {},
      settings: normalizeOsirisWorkspaceSettings(value.org.settings),
      logoUrl: typeof value.org.logoUrl === 'string' ? value.org.logoUrl : null,
    },
    terminology: readStringRecord(value.terminology),
    permissions: readStringArray(value.permissions),
    preferences: isRecord(value.preferences) ? value.preferences : {},
    agentAccess: value.agentAccess === true,
    ...(typeof value.roleName === 'string' ? { roleName: value.roleName } : {}),
  };
}
