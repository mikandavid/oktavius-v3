import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';

import { EntityForm, type FormField } from '@/components/forms/EntityForm';

import { TemplatePicker, type TemplateOption } from './TemplatePicker';

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
  onGenerate: (payload: { templateId: string; format: string }) => void;
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

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  return (
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
          onSubmit={(values) => {
            if (!templateId) return;
            onGenerate({ templateId, format: values.format });
            handleOpenChange(false);
          }}
          footerActions={
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
