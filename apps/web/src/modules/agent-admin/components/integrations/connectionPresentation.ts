import type { StatusDotTone } from '@oktavius/base-ui';

import type {
  IntegrationConnection,
  IntegrationConnectionStatus,
  IntegrationGrant,
} from '@/runtime/osiris/agentIntegrationsClient';

/** Providers configured through org-level credential forms instead of the Pipedream OAuth flow. */
export const NATIVE_PROVIDERS = new Set<IntegrationConnection['provider']>(['halo', 'onoffice']);

/** Local logo assets for integrations we built ourselves (Pipedream apps ship their own imgSrc). */
export const NATIVE_INTEGRATION_LOGOS: Record<string, string> = {
  halo: '/integrations/halo.png',
  onoffice: '/integrations/onoffice.png',
};

export function connectionStatusTone(status: IntegrationConnectionStatus): StatusDotTone {
  if (status === 'connected') return 'success';
  if (status === 'unhealthy' || status === 'reconnect_required') return 'destructive';
  if (status === 'connecting' || status === 'syncing' || status === 'disconnect_pending')
    return 'warning';
  return 'muted';
}

export function connectionNeedsAttention(status: IntegrationConnectionStatus): boolean {
  return status === 'unhealthy' || status === 'reconnect_required';
}

/** "google_sheets" → "Google Sheets" for rows where we only know the app key. */
export function prettifyAppKey(appKey: string): string {
  return appKey
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export interface IntegrationConnectionSections {
  /** Connections the current user owns — private and shared alike. */
  mine: IntegrationConnection[];
  /** Connections owned by someone else and shared with the user (or org, for admins). */
  shared: IntegrationConnection[];
}

export function buildIntegrationConnectionSections(
  connections: IntegrationConnection[],
): IntegrationConnectionSections {
  return {
    mine: connections.filter((connection) => connection.isOwner),
    shared: connections.filter(
      (connection) => !connection.isOwner && connection.visibility === 'shared',
    ),
  };
}

export function isSharedWithEveryone(grants: IntegrationGrant[]): boolean {
  return grants.some((grant) => grant.subjectType === 'all_members');
}

/**
 * Toggle a grant in a selection. "Everyone" supersedes targeted grants, so selecting it
 * clears the rest, and adding a targeted grant drops "everyone". Selecting an already
 * granted subject removes it again (picker toggle semantics).
 */
export function toggleGrant(
  grants: IntegrationGrant[],
  grant: IntegrationGrant,
): IntegrationGrant[] {
  if (grant.subjectType === 'all_members') {
    return isSharedWithEveryone(grants) ? [] : [{ subjectType: 'all_members', subjectKey: '*' }];
  }
  const withoutEveryone = grants.filter((item) => item.subjectType !== 'all_members');
  const exists = withoutEveryone.some(
    (item) => item.subjectType === grant.subjectType && item.subjectKey === grant.subjectKey,
  );
  return exists ? removeGrant(withoutEveryone, grant) : [...withoutEveryone, grant];
}

export function removeGrant(
  grants: IntegrationGrant[],
  grant: IntegrationGrant,
): IntegrationGrant[] {
  return grants.filter(
    (item) => !(item.subjectType === grant.subjectType && item.subjectKey === grant.subjectKey),
  );
}
