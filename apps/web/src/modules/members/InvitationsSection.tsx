// apps/web/src/modules/members/InvitationsSection.tsx
import { Button, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { DeleteIcon } from '@/lib/icons';
import type { OsirisInvitation } from '@/runtime/osiris/invitationsAdminClient';

import { formatInviteExpiry, INVITE_STATUS_VARIANT, inviteStatus, ROLE_VARIANT } from './shared';

type InvitationsSectionProps = {
  invitations: OsirisInvitation[];
  onRevoke: (invitationId: string) => Promise<void>;
};

export function InvitationsSection({ invitations, onRevoke }: InvitationsSectionProps) {
  const [revokeTarget, setRevokeTarget] = useState<OsirisInvitation | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const columns: SettingsTableColumn<OsirisInvitation>[] = [
    { key: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => <StatusBadge status={row.role} variantMap={ROLE_VARIANT} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={inviteStatus(row)} variantMap={INVITE_STATUS_VARIANT} />,
    },
    { key: 'expires', header: 'Expires', cell: (row) => formatInviteExpiry(row.expiresAt) },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Revoke invitation"
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
      <SettingsTable<OsirisInvitation>
        columns={columns}
        rows={invitations}
        getRowId={(row) => row.id}
        emptyMessage="No pending invitations."
      />
      <ConfirmActionDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke invitation?"
        description={`The invite to ${revokeTarget?.email ?? 'this address'} will stop working.`}
        confirmLabel="Revoke"
        confirmVariant="destructive"
        confirmDisabled={isRevoking}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
