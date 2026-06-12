import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { useDirtyDialogClose } from '@/lib/useDirtyDialogClose';

import { type EmailTemplateOption, EmailTemplatePicker } from './EmailTemplatePicker';

type SendFormValues = {
  recipient: string;
  subject: string;
  message: string;
};

const sendFormFields: FormField[] = [
  {
    name: 'recipient',
    label: 'Recipient',
    type: 'email',
    required: true,
    placeholder: 'name@company.com',
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'text',
    required: true,
  },
  {
    name: 'message',
    label: 'Message',
    type: 'textarea',
    placeholder: 'Optional message to include in the email body…',
  },
];

export interface DocumentSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailTemplates: EmailTemplateOption[];
  defaultRecipient?: string;
  documentName?: string;
  title?: string;
  description?: string;
  onSend: (payload: {
    templateId: string;
    recipient: string;
    subject: string;
    message: string;
  }) => boolean | void | Promise<boolean | void>;
}

/** Send a generated document via email with template and message body. */
export function DocumentSendDialog({
  open,
  onOpenChange,
  emailTemplates,
  defaultRecipient = '',
  documentName,
  title = 'Send document',
  description,
  onSend,
}: DocumentSendDialogProps) {
  const [templateId, setTemplateId] = useState<string | undefined>(emailTemplates[0]?.id);
  const [formKey, setFormKey] = useState(0);
  const { handleOpenChange, requestClose, onDirtyChange } = useDirtyDialogClose(onOpenChange);

  useEffect(() => {
    if (open) {
      setTemplateId(emailTemplates[0]?.id);
      setFormKey((current) => current + 1);
    }
  }, [open, emailTemplates]);

  const resolvedDescription =
    description ??
    (documentName
      ? `Email "${documentName}" to the recipient.`
      : 'Choose an email template and recipient.');

  const defaultSubject =
    emailTemplates.find((item) => item.id === templateId)?.subject ??
    emailTemplates[0]?.subject ??
    '';

  const handleTemplateChange = (nextId: string) => {
    setTemplateId(nextId);
    setFormKey((current) => current + 1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        <EmailTemplatePicker
          embedded
          templates={emailTemplates}
          value={templateId}
          onChange={handleTemplateChange}
        />

        <EntityForm<SendFormValues>
          key={`${formKey}-${templateId ?? 'none'}`}
          surface="dialog"
          showHeader={false}
          title={title}
          fields={sendFormFields}
          defaultValues={{
            recipient: defaultRecipient,
            subject: defaultSubject,
            message: '',
          }}
          submitLabel="Send"
          warnOnDirty
          onDirtyChange={onDirtyChange}
          onSubmit={async (values) => {
            if (!templateId || !values.recipient.trim() || !values.subject.trim()) return;
            const result = await onSend({
              templateId,
              recipient: values.recipient.trim(),
              subject: values.subject.trim(),
              message: values.message.trim(),
            });
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
  );
}
