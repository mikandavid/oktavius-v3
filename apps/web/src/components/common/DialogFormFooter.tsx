import type { ReactNode } from 'react';

import { Button, DialogClose, DialogFooter } from '@oktavius/base-ui';

type DialogFormFooterProps = {
  cancelLabel?: string;
  onCancel?: () => void;
  confirmLabel: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  /** When the confirm button submits a form, pass the form id. */
  confirmForm?: string;
  confirmType?: 'button' | 'submit';
  confirmVariant?: 'cta' | 'default';
  leading?: ReactNode;
};

/** Standard Dialog footer: outline Cancel + purple primary (Save / Create). */
export function DialogFormFooter({
  cancelLabel = 'Cancel',
  onCancel,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmForm,
  confirmType = 'button',
  confirmVariant = 'cta',
  leading,
}: DialogFormFooterProps) {
  return (
    <DialogFooter>
      {leading}
      {onCancel ? (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : (
        <DialogClose asChild>
          <Button type="button" variant="outline">
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
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      ) : (
        <DialogClose asChild>
          <Button type={confirmType} variant={confirmVariant} form={confirmForm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </DialogClose>
      )}
    </DialogFooter>
  );
}
