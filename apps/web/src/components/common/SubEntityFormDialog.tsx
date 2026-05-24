import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';

import { EntityForm, type FormField, type FormFieldValue } from '@/components/forms/EntityForm';

type SubEntityFormDialogProps<T extends Record<string, FormFieldValue>> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  defaultValues: T;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: T) => void;
};

/** Standard add/edit dialog — Dialog shell + EntityForm (dialog surface) + Cancel outline + cta Save. */
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

  useEffect(() => {
    if (open) {
      setFormKey((current) => current + 1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          onSubmit={(values) => {
            onSubmit(values);
            onOpenChange(false);
          }}
          footerActions={
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
