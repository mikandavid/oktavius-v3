import {
  Button,
  Combobox,
  type ComboboxOption,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { SpinnerIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import { useUpdateIntegrationConnection } from '@/modules/agent-admin/data/useAgentIntegrations';
import {
  type AgentIntegrationPermissionMode,
  type IntegrationConnection,
  type IntegrationGrant,
} from '@/runtime/osiris/agentIntegrationsClient';

import { ShareAudienceControl } from './ShareAudienceControl';

interface ManageConnectionDialogProps {
  connection: IntegrationConnection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Only org admins may change the audience (server-enforced). */
  isAdmin: boolean;
}

const PERMISSION_MODE_OPTIONS: ComboboxOption[] = [
  { value: 'read', label: 'Read only' },
  { value: 'full', label: 'Full access' },
];

/**
 * Edit a connection after creation: rename, change agent access, and manage the
 * shared audience with the same picker used during connect.
 */
export function ManageConnectionDialog({
  connection,
  open,
  onOpenChange,
  isAdmin,
}: ManageConnectionDialogProps) {
  const { t } = useTranslation();
  const update = useUpdateIntegrationConnection();
  const [displayName, setDisplayName] = useState(connection.displayName);
  const [permissionMode, setPermissionMode] = useState<AgentIntegrationPermissionMode>(
    connection.permissionMode,
  );
  const [grants, setGrants] = useState<IntegrationGrant[]>(connection.grants);

  useEffect(() => {
    if (open) {
      setDisplayName(connection.displayName);
      setPermissionMode(connection.permissionMode);
      setGrants(connection.grants);
    }
  }, [open, connection]);

  async function handleSave() {
    if (!displayName.trim()) {
      appToast.error(t('settings.integrationConnectionRequired'));
      return;
    }
    try {
      await update.mutateAsync({
        connectionId: connection.id,
        data: {
          displayName: displayName.trim(),
          permissionMode,
          ...(isAdmin ? { visibility: grants.length > 0 ? 'shared' : 'private', grants } : {}),
        },
      });
      appToast.success(t('settings.integrationUpdated'));
      onOpenChange(false);
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : t('common.genericError'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.integrationManageTitle')}</DialogTitle>
          <DialogDescription>{connection.displayName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="manage-connection-name">{t('settings.integrationAccountName')}</Label>
            <Input
              id="manage-connection-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.integrationAccessLevel')}</Label>
            <Combobox
              options={PERMISSION_MODE_OPTIONS.map((opt) => ({
                ...opt,
                label:
                  opt.value === 'read'
                    ? t('settings.integrationAccessRead')
                    : t('settings.integrationAccessFull'),
              }))}
              value={permissionMode}
              onChange={(v) => v && setPermissionMode(v as AgentIntegrationPermissionMode)}
              clearable={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.integrationShareLabel')}</Label>
            <ShareAudienceControl grants={grants} onChange={setGrants} disabled={!isAdmin} />
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? t('settings.integrationShareHint')
                : t('settings.integrationShareAdminOnly')}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={update.isPending} onClick={() => void handleSave()}>
            {update.isPending ? (
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
