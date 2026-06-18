import { Button, Skeleton } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { canUsePermissionRequirement, EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import {
  useIntegrationConnections,
  useNativeIntegrations,
} from '@/modules/agent-admin/data/useAgentIntegrations';
import type { IntegrationConnection } from '@/runtime/osiris/agentIntegrationsClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AddConnectionDialog } from './AddConnectionDialog';
import { buildIntegrationConnectionSections } from './connectionPresentation';
import { ConnectionRow } from './ConnectionRow';
import { useAppLogos } from './useAppLogos';

// TODO: Replace with real org user lookup when useOrgUsers is ported to v3.
// Owner display name falls back to undefined for non-owner connections.

export function OrgAgentIntegrationsPanel() {
  const { t } = useTranslation();
  const { ready } = usePreloadNamespaces(['settings']);
  const osirisRuntime = useOptionalOsirisRuntime();
  const isAdmin = canUsePermissionRequirement(
    osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    'org.manage',
  );

  const connectionsQuery = useIntegrationConnections();
  const nativeQuery = useNativeIntegrations(isAdmin);
  const [addOpen, setAddOpen] = useState(false);

  const connections = useMemo(
    () => connectionsQuery.data?.connections ?? [],
    [connectionsQuery.data],
  );
  const sections = useMemo(() => buildIntegrationConnectionSections(connections), [connections]);
  const logos = useAppLogos(connections.map((connection) => connection.appKey));
  const nativeByKey = useMemo(
    () =>
      new Map(
        (nativeQuery.data?.integrations ?? []).map((integration) => [
          integration.key as string,
          integration,
        ]),
      ),
    [nativeQuery.data],
  );

  function ownerLabel(connection: IntegrationConnection): string | undefined {
    if (connection.isOwner) return t('settings.integrationOwnerYou');
    // TODO: wire memberNames from useOrgUsers when ported to v3
    return undefined;
  }

  function renderSection(title: string, items: IntegrationConnection[], action?: React.ReactNode) {
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
          </div>
          {action}
        </div>
        {items.length > 0 ? (
          <div className="divide-y divide-border/60 rounded-card border border-border/70 bg-background">
            {items.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                logoSrc={logos[connection.appKey]}
                ownerLabel={ownerLabel(connection)}
                isAdmin={isAdmin}
                nativeIntegration={nativeByKey.get(connection.appKey)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border/60 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
            {t('settings.integrationNoConnections')}
          </div>
        )}
      </section>
    );
  }

  if (!ready || connectionsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-3 rounded-card border px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-control" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {connections.length === 0 ? (
        <EmptyState
          title={t('settings.integrationEmptyTitle')}
          description={t('settings.integrationEmptyDescription')}
          action={
            <Button type="button" onClick={() => setAddOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden />
              {t('settings.integrationAddConnection')}
            </Button>
          }
        />
      ) : (
        <>
          {renderSection(
            t('settings.integrationMyConnections'),
            sections.mine,
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="mr-1.5 h-4 w-4" aria-hidden />
              {t('settings.integrationAddConnection')}
            </Button>,
          )}
          {renderSection(t('settings.integrationSharedConnections'), sections.shared)}
        </>
      )}

      <AddConnectionDialog open={addOpen} onOpenChange={setAddOpen} isAdmin={isAdmin} />
    </div>
  );
}
