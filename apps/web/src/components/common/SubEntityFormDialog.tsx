import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { DiscardChangesDialog } from '@/components/common/DiscardChangesDialog';
import { EntityForm, type FormField, type FormFieldValue } from '@/components/forms/EntityForm';
import { useDirtyDialogClose } from '@/lib/useDirtyDialogClose';

type SubEntityFormDialogProps<T extends Record<string, FormFieldValue>> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  defaultValues: T;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: T) => void | Promise<void>;
};

/** Standard add/edit dialog — Dialog shell + EntityForm (dialog surface) + ghost Cancel + cta Save. */
export function SubEntityFormDialog<T extends Record<string, FormFieldValue>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  defaultValues,
  submitLabel = 'Save',
  isSubmitting = false,
  onSubmit,
}: SubEntityFormDialogProps<T>) {
  const [formKey, setFormKey] = useState(0);
  const {
    handleOpenChange,
    onDirtyChange,
    pendingClose,
    confirmDiscard,
    cancelDiscard,
    discardMessage,
  } = useDirtyDialogClose(onOpenChange);

  useEffect(() => {
    if (open) {
      setFormKey((current) => current + 1);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-5 sm:max-w-md">
          <DialogHeader className="space-y-1 pr-6">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <EntityForm<T>
            key={formKey}
            surface="dialog"
            showHeader={false}
            title={title}
            fields={fields}
            defaultValues={defaultValues}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            warnOnDirty
            onDirtyChange={onDirtyChange}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
            footerActions={
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
            }
          />
        </DialogContent>
      </Dialog>
      <DiscardChangesDialog
        open={pendingClose}
        description={discardMessage}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  );
}
