import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  StatusDot,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@oktavius/base-ui';
import { cn } from '@oktavius/base-ui';
import { type ReactNode, useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { useTranslation } from '@/core/i18n';
import {
  DeleteIcon,
  EditIcon,
  GlobeIcon,
  LockIcon,
  MoreIcon,
  RefreshIcon,
  Settings2Icon,
  UsersIcon,
} from '@/lib/icons';
// NOTE: Heartbeat icon is not available in v3 @/lib/icons.
// Using LifeBuoyIcon (Lifebuoy from @/lib/icons) as an approximation for the "check health" menu item.
import { LifeBuoyIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import {
  useCheckIntegrationConnectionHealth,
  useDisconnectIntegrationConnection,
  useFinalizeIntegrationConnection,
  useReconnectIntegrationConnection,
} from '@/modules/agent-admin/data/useAgentIntegrations';
import {
  type AgentIntegrationSummary,
  type IntegrationConnection,
} from '@/runtime/osiris/agentIntegrationsClient';

import {
  connectionNeedsAttention,
  connectionStatusTone,
  isSharedWithEveryone,
  NATIVE_PROVIDERS,
  prettifyAppKey,
} from './connectionPresentation';
import { EntityAvatar } from './EntityAvatar';
import { ManageConnectionDialog } from './ManageConnectionDialog';
import { NativeIntegrationForm } from './NativeIntegrationForm';
import { launchPipedreamConnect } from './pipedreamConnect';

// ---------------------------------------------------------------------------
// Inline DataRowActionsMenu (not available in v3 yet)
// ---------------------------------------------------------------------------

export interface DataRowActionItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect: () => void;
}

interface DataRowActionsMenuProps {
  items: Array<DataRowActionItem | null>;
}

function DataRowActionsMenu({ items }: DataRowActionsMenuProps) {
  const { t } = useTranslation();
  const visibleItems = items.filter((item): item is DataRowActionItem | null => item !== undefined);
  if (visibleItems.filter(Boolean).length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('common.actions', {}, 'Actions')}
          onClick={(event) => event.stopPropagation()}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <MoreIcon className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onClick={(event) => event.stopPropagation()}
      >
        {visibleItems.map((item, index) => {
          if (item === null) {
            return <DropdownMenuSeparator key={`sep-${index}`} />;
          }
          return (
            <DropdownMenuItem
              key={item.key}
              disabled={item.disabled}
              onSelect={(event) => {
                event.preventDefault();
                item.onSelect();
              }}
              className={cn(
                item.tone === 'destructive' &&
                  'text-destructive focus:text-destructive focus:bg-destructive/10',
              )}
            >
              {item.icon ? (
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center" aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// ConnectionRow
// ---------------------------------------------------------------------------

interface ConnectionRowProps {
  connection: IntegrationConnection;
  logoSrc?: string;
  /** Resolved owner display name; the caller substitutes "You" for own connections. */
  ownerLabel?: string;
  isAdmin: boolean;
  /** Org-level summary for direct integrations, used by the admin configure dialog. */
  nativeIntegration?: AgentIntegrationSummary;
}

// fallow-ignore-next-line complexity
export function ConnectionRow({
  connection,
  logoSrc,
  ownerLabel,
  isAdmin,
  nativeIntegration,
}: ConnectionRowProps) {
  const { t } = useTranslation();
  const disconnect = useDisconnectIntegrationConnection();
  const reconnect = useReconnectIntegrationConnection();
  const finalize = useFinalizeIntegrationConnection();
  const checkHealth = useCheckIntegrationConnectionHealth();
  const [manageOpen, setManageOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);

  const isNative = NATIVE_PROVIDERS.has(connection.provider);
  const isPipedream = connection.provider === 'pipedream';
  const needsAttention = connectionNeedsAttention(connection.status);
  const appName = prettifyAppKey(connection.appKey);
  const healthMessage =
    typeof connection.health?.message === 'string' ? connection.health.message : null;
  const statusLabel = t(`settings.integrationConnectionStatus.${connection.status}`);

  async function handleReconnect() {
    try {
      const attempt = await reconnect.mutateAsync(connection.id);
      await launchPipedreamConnect({
        attempt,
        appKey: attempt.appKey,
        accountId: attempt.providerAccountId,
        onSuccess: (accountId) => {
          void finalize
            .mutateAsync({ attemptToken: attempt.attemptToken, accountId })
            .then(() => appToast.success(t('settings.integrationConnected')))
            .catch((error: unknown) => {
              appToast.error(error instanceof Error ? error.message : t('common.genericError'));
            });
        },
        onError: (error) => appToast.error(error.message),
      });
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    }
  }

  async function handleCheckHealth() {
    try {
      const { connection: checked } = await checkHealth.mutateAsync(connection.id);
      if (checked.status === 'connected') {
        appToast.success(t('settings.integrationHealthOk'));
      } else {
        appToast.warning(
          t('settings.integrationHealthProblem', {
            status: t(`settings.integrationConnectionStatus.${checked.status}`),
          }),
        );
      }
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync(connection.id);
      appToast.success(t('settings.agentIntegrationsDisconnected'));
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    } finally {
      setConfirmDisconnectOpen(false);
    }
  }

  const AudienceIcon = (() => {
    if (connection.visibility !== 'shared') return LockIcon;
    if (isSharedWithEveryone(connection.grants)) return GlobeIcon;
    return UsersIcon;
  })();

  const audienceLabel = (() => {
    if (connection.visibility !== 'shared') return t('settings.integrationPrivate');
    if (isSharedWithEveryone(connection.grants)) return t('settings.integrationAudienceEveryone');
    return t('settings.integrationAudienceCount', { count: connection.grants.length });
  })();

  const rawMenuItems: Array<DataRowActionItem | null | undefined> = [
    connection.canManage && !isNative
      ? ({
          key: 'edit',
          label: t('settings.integrationManageAction'),
          icon: <EditIcon className="h-4 w-4" />,
          onSelect: () => setManageOpen(true),
        } satisfies DataRowActionItem)
      : null,
    isAdmin && isNative && nativeIntegration
      ? ({
          key: 'configure',
          label: t('settings.integrationConfigureAction'),
          // NOTE: Wrench not in v3 icons — using Settings2Icon (GearSix) as approximation
          icon: <Settings2Icon className="h-4 w-4" />,
          onSelect: () => setConfigureOpen(true),
        } satisfies DataRowActionItem)
      : null,
    connection.canManage && isPipedream
      ? ({
          key: 'health',
          label: t('settings.integrationCheckHealth'),
          // NOTE: Heartbeat not in v3 icons — using LifeBuoyIcon as approximation
          icon: <LifeBuoyIcon className="h-4 w-4" />,
          disabled: checkHealth.isPending,
          onSelect: () => void handleCheckHealth(),
        } satisfies DataRowActionItem)
      : null,
    connection.canManage && !isNative ? null : undefined,
    connection.canManage && !isNative
      ? ({
          key: 'disconnect',
          label: t('settings.agentIntegrationsDisconnect'),
          icon: <DeleteIcon className="h-4 w-4" />,
          tone: 'destructive' as const,
          disabled: disconnect.isPending,
          onSelect: () => setConfirmDisconnectOpen(true),
        } satisfies DataRowActionItem)
      : null,
  ];
  const menuItems = rawMenuItems.filter(
    (item): item is DataRowActionItem | null => item !== undefined,
  );

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <EntityAvatar
                label={appName}
                src={logoSrc}
                size="md"
                tone="muted"
                className="rounded-control border border-border/60 bg-background"
                overlay={
                  <StatusDot
                    tone={connectionStatusTone(connection.status)}
                    size="md"
                    className="ring-2 ring-background"
                  />
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {healthMessage ? `${statusLabel} — ${healthMessage}` : statusLabel}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{connection.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {appName}
          {ownerLabel ? <> · {ownerLabel}</> : null}
          {needsAttention ? (
            <>
              {' · '}
              <span className="text-destructive">{statusLabel}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
          <AudienceIcon className="h-3.5 w-3.5" aria-hidden />
          {audienceLabel}
        </span>
        {connection.permissionMode === 'full' ? (
          <Badge variant="warning" className="hidden sm:inline-flex">
            {t('settings.integrationAccessFull')}
          </Badge>
        ) : null}
        {connection.canManage && isPipedream && needsAttention ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={reconnect.isPending || finalize.isPending}
            onClick={() => void handleReconnect()}
          >
            <RefreshIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t('settings.integrationReconnect')}
          </Button>
        ) : null}
        <DataRowActionsMenu items={menuItems} />
      </div>
      {connection.canManage && !isNative ? (
        <ManageConnectionDialog
          connection={connection}
          open={manageOpen}
          onOpenChange={setManageOpen}
          isAdmin={isAdmin}
        />
      ) : null}
      {isAdmin && isNative && nativeIntegration ? (
        <Dialog open={configureOpen} onOpenChange={setConfigureOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{nativeIntegration.name}</DialogTitle>
            </DialogHeader>
            <NativeIntegrationForm
              integration={nativeIntegration}
              onDone={() => setConfigureOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      <ConfirmActionDialog
        open={confirmDisconnectOpen}
        onOpenChange={setConfirmDisconnectOpen}
        title={t('settings.integrationDisconnectTitle', { name: connection.displayName })}
        description={t('settings.integrationDisconnectDescription')}
        confirmLabel={t('settings.agentIntegrationsDisconnect')}
        confirmDisabled={disconnect.isPending}
        onConfirm={() => void handleDisconnect()}
      />
    </div>
  );
}
