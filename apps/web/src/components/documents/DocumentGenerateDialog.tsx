import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { DiscardChangesDialog } from '@/components/common/DiscardChangesDialog';
import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { useDirtyDialogClose } from '@/lib/useDirtyDialogClose';

import { type TemplateOption, TemplatePicker } from './TemplatePicker';

type GenerateFormValues = {
  format: string;
};

export interface DocumentGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TemplateOption[];
  formatOptions?: Array<{ value: string; label: string }>;
  title?: string;
  description?: string;
  onGenerate: (payload: {
    templateId: string;
    format: string;
  }) => boolean | void | Promise<boolean | void>;
}

/** Generate a document from a template — PDF, DOCX, etc. */
export function DocumentGenerateDialog({
  open,
  onOpenChange,
  templates,
  formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word (DOCX)' },
  ],
  title = 'Generate document',
  description = 'Pick a template and output format.',
  onGenerate,
}: DocumentGenerateDialogProps) {
  const [templateId, setTemplateId] = useState<string | undefined>(templates[0]?.id);
  const [formKey, setFormKey] = useState(0);
  const {
    handleOpenChange,
    requestClose,
    onDirtyChange,
    pendingClose,
    confirmDiscard,
    cancelDiscard,
    discardMessage,
  } = useDirtyDialogClose(onOpenChange);

  useEffect(() => {
    if (open) {
      setTemplateId(templates[0]?.id);
      setFormKey((current) => current + 1);
    }
  }, [open, templates]);

  const generateFormFields: FormField[] = [
    {
      name: 'format',
      label: 'Output format',
      type: 'combobox',
      options: formatOptions,
      required: true,
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <TemplatePicker
            embedded
            templates={templates}
            value={templateId}
            onChange={setTemplateId}
          />

          <EntityForm<GenerateFormValues>
            key={formKey}
            surface="dialog"
            showHeader={false}
            title={title}
            fields={generateFormFields}
            defaultValues={{ format: formatOptions[0]?.value ?? 'pdf' }}
            submitLabel="Generate"
            warnOnDirty
            onDirtyChange={onDirtyChange}
            onSubmit={async (values) => {
              if (!templateId) return;
              const result = await onGenerate({ templateId, format: values.format });
              if (result !== false) {
                onOpenChange(false);
              }
            }}
            footerActions={
              <Button type="button" variant="ghost" onClick={requestClose}>
                Cancel
              </Button>
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
