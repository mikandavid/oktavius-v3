// apps/web/src/components/settings/members/InviteLinksSection.tsx
import { Button, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { CopyIcon, DeleteIcon, PlusIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import type { OsirisInviteLink } from '@/runtime/osiris/invitationsAdminClient';

import { formatInviteExpiry, inviteLinkUsage, ROLE_VARIANT } from './shared';

type InviteLinksSectionProps = {
  links: OsirisInviteLink[];
  onCreate: () => void;
  onRevoke: (linkId: string) => Promise<void>;
};

function inviteUrlFor(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

export function InviteLinksSection({ links, onCreate, onRevoke }: InviteLinksSectionProps) {
  const [revokeTarget, setRevokeTarget] = useState<OsirisInviteLink | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrlFor(token));
      appToast.success('Invite link copied.');
    } catch (error) {
      appToast.fromApiError(error, 'Could not copy the link.');
    }
  };

  const columns: SettingsTableColumn<OsirisInviteLink>[] = [
    {
      key: 'role',
      header: 'Role',
      cell: (row) => <StatusBadge status={row.role} variantMap={ROLE_VARIANT} />,
    },
    { key: 'uses', header: 'Uses', cell: (row) => inviteLinkUsage(row) },
    { key: 'expires', header: 'Expires', cell: (row) => formatInviteExpiry(row.expiresAt) },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy invite link"
            onClick={() => void handleCopy(row.token)}
          >
            <CopyIcon size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Revoke invite link"
            onClick={() => setRevokeTarget(row)}
          >
            <DeleteIcon size={16} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await onRevoke(revokeTarget.id);
      setRevokeTarget(null);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCreate}>
          {}
          <PlusIcon size={14} className="mr-1.5" aria-hidden="true" />
          Create link
        </Button>
      </div>
      <SettingsTable<OsirisInviteLink>
        columns={columns}
        rows={links}
        getRowId={(row) => row.id}
        emptyMessage="No active invite links."
      />
      <ConfirmActionDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke invite link?"
        description="Anyone who still has this link will no longer be able to join."
        confirmLabel="Revoke"
        confirmVariant="destructive"
        confirmDisabled={isRevoking}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
