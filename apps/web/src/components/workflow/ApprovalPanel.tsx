import { useState } from 'react';

import { Button, InlineEmptyState, ListRow, MoneyText, SectionCard } from '@oktavius/base-ui';

import { StatusBadge } from '@/components/feedback/StatusBadge';
import { CheckIcon, CloseIcon } from '@/lib/icons';

import { ApproveRejectDialog } from './ApproveRejectDialog';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  title: string;
  requester: string;
  submittedAt: string;
  status: ApprovalStatus;
  amount?: number;
  currency?: string;
  note?: string;
}

const APPROVAL_STATUS_MAP = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
} as const;

export interface ApprovalPanelProps {
  items: ApprovalItem[];
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
  onItemClick?: (id: string) => void;
  title?: string;
  meta?: string;
  emptyMessage?: string;
  className?: string;
}

/** Pending approvals queue with inline approve/reject actions. */
export function ApprovalPanel({
  items,
  onApprove,
  onReject,
  onItemClick,
  title = 'Pending approvals',
  meta,
  emptyMessage = 'No approvals waiting for you.',
  className,
}: ApprovalPanelProps) {
  const [dialogItem, setDialogItem] = useState<ApprovalItem | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve');

  const pending = items.filter((item) => item.status === 'pending');

  const openDialog = (item: ApprovalItem, action: 'approve' | 'reject') => {
    setDialogItem(item);
    setDialogAction(action);
  };

  return (
    <>
      <SectionCard title={title} meta={meta ?? `${pending.length} pending`} className={className}>
        {pending.length ? (
          <div className="space-y-2">
            {pending.map((item) => (
              <ListRow
                key={item.id}
                variant="queue"
                title={item.title}
                subtitle={
                  <>
                    <span className="block">{item.requester}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.submittedAt}
                    </span>
                    {item.note ? (
                      <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                        {item.note}
                      </span>
                    ) : null}
                  </>
                }
                trailing={
                  <div className="flex flex-col items-end gap-2">
                    {item.amount != null ? (
                      <MoneyText
                        value={item.amount}
                        currency={item.currency ?? 'EUR'}
                        className="text-sm font-medium"
                      />
                    ) : (
                      <StatusBadge status={item.status} variantMap={APPROVAL_STATUS_MAP} />
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Reject ${item.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openDialog(item, 'reject');
                        }}
                      >
                        <CloseIcon size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="cta"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Approve ${item.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openDialog(item, 'approve');
                        }}
                      >
                        <CheckIcon size={14} />
                      </Button>
                    </div>
                  </div>
                }
                onClick={onItemClick ? () => onItemClick(item.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <InlineEmptyState text={emptyMessage} centered />
        )}
      </SectionCard>

      {dialogItem ? (
        <ApproveRejectDialog
          open
          action={dialogAction}
          title={dialogItem.title}
          description={`Requested by ${dialogItem.requester}`}
          onOpenChange={(open) => {
            if (!open) setDialogItem(null);
          }}
          onConfirm={(comment) => {
            if (dialogAction === 'approve') onApprove(dialogItem.id, comment);
            else onReject(dialogItem.id, comment);
            setDialogItem(null);
          }}
        />
      ) : null}
    </>
  );
}
