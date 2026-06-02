import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@oktavius/base-ui';

import { DialogFormFooter } from '@/components/common/DialogFormFooter';

export interface ApproveRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'approve' | 'reject';
  title: string;
  description?: string;
  commentLabel?: string;
  commentPlaceholder?: string;
  commentRequired?: boolean;
  onConfirm: (comment?: string) => void;
}

/** Shared approve/reject dialog with optional comment field. */
export function ApproveRejectDialog({
  open,
  onOpenChange,
  action,
  title,
  description,
  commentLabel = 'Comment',
  commentPlaceholder = 'Add a note for the requester…',
  commentRequired = false,
  onConfirm,
}: ApproveRejectDialogProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) setComment('');
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setComment('');
    onOpenChange(next);
  };

  const confirmDisabled = commentRequired && !comment.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approve' : 'Reject'} — {title}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="approval-comment">{commentLabel}</Label>
          <Textarea
            id="approval-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={commentPlaceholder}
            rows={3}
          />
        </div>

        {action === 'approve' ? (
          <DialogFormFooter
            cancelLabel="Cancel"
            onCancel={() => handleOpenChange(false)}
            confirmLabel="Approve"
            confirmVariant="cta"
            confirmDisabled={confirmDisabled}
            onConfirm={() => {
              onConfirm(comment.trim() || undefined);
              setComment('');
            }}
          />
        ) : (
          <DialogFormFooter
            cancelLabel="Cancel"
            onCancel={() => handleOpenChange(false)}
            confirmLabel="Reject"
            confirmVariant="destructive"
            confirmDisabled={confirmDisabled}
            onConfirm={() => {
              onConfirm(comment.trim() || undefined);
              setComment('');
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
