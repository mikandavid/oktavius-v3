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

import { EntityForm, type FormField, type FormFieldValue } from '@/components/forms/EntityForm';
import type { FormSubmissionResult } from '@/lib/formValidation';
import { useDirtyDialogClose } from '@/lib/useDirtyDialogClose';

type RecordEditDialogProps<T extends Record<string, FormFieldValue>> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  defaultValues: T;
  submitLabel?: string;
  isSubmitting?: boolean;
  errors?: Partial<Record<keyof T & string, string>>;
  onSubmit: (values: T) => FormSubmissionResult | Promise<FormSubmissionResult>;
};

/** Full-record edit dialog — wider than SubEntityFormDialog for entity forms. */
export function RecordEditDialog<T extends Record<string, FormFieldValue>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  defaultValues,
  submitLabel = 'Save changes',
  isSubmitting = false,
  errors,
  onSubmit,
}: RecordEditDialogProps<T>) {
  const [formKey, setFormKey] = useState(0);
  const { handleOpenChange, onDirtyChange } = useDirtyDialogClose(onOpenChange);

  useEffect(() => {
    if (open) {
      setFormKey((current) => current + 1);
    }
  }, [open, defaultValues]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 sm:max-w-2xl">
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
          errors={errors}
          warnOnDirty
          onDirtyChange={onDirtyChange}
          onSubmit={async (values) => {
            const result = await onSubmit(values);
            if (result && 'ok' in result && result.ok === false) {
              return result;
            }
            onOpenChange(false);
            return result;
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
  );
}
