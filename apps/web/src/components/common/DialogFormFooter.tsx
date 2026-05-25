import type { ReactNode } from 'react';

import { Button, DialogClose, DialogFooter } from '@oktavius/base-ui';

type DialogFormFooterProps = {
  cancelLabel?: string;
  onCancel?: () => void;
  confirmLabel: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  /** Shows spinner on confirm and blocks repeat submit. */
  confirmLoading?: boolean;
  /** When the confirm button submits a form, pass the form id. */
  confirmForm?: string;
  confirmType?: 'button' | 'submit';
  confirmVariant?: 'cta' | 'default';
  leading?: ReactNode;
};

/** Standard Dialog footer: ghost Cancel + purple primary (Save / Create). */
export function DialogFormFooter({
  cancelLabel = 'Cancel',
  onCancel,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmLoading = false,
  confirmForm,
  confirmType = 'button',
  confirmVariant = 'cta',
  leading,
}: DialogFormFooterProps) {
  return (
    <DialogFooter>
      {leading}
      {onCancel ? (
        <Button type="button" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : (
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {cancelLabel}
          </Button>
        </DialogClose>
      )}
      {onConfirm ? (
        <Button
          type={confirmType}
          variant={confirmVariant}
          form={confirmForm}
          disabled={confirmDisabled}
          loading={confirmLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      ) : (
        <DialogClose asChild>
          <Button
            type={confirmType}
            variant={confirmVariant}
            form={confirmForm}
            disabled={confirmDisabled}
            loading={confirmLoading}
          >
            {confirmLabel}
          </Button>
        </DialogClose>
      )}
    </DialogFooter>
  );
}
