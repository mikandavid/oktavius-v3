import { useState } from 'react';

import { RecordEditDialog } from '@/components/common/RecordEditDialog';
import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { SupportCategory, SupportTicket } from './data/types';
import { useSupportMutations } from './data/useSupportData';

type ReportValues = {
  subject: string;
  category: SupportCategory;
  message: string;
  attachments: File | null;
};

export function ReportProblemDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: SupportTicket) => void;
}) {
  const { t } = useTranslation();
  const { createTicket, uploadAttachments } = useSupportMutations();
  const [submitting, setSubmitting] = useState(false);

  const isSubmitting = submitting || createTicket.isPending || uploadAttachments.isPending;

  const fields: FormField[] = [
    {
      name: 'subject',
      label: t('support.subjectLabel'),
      type: 'text',
      required: true,
      placeholder: t('support.subjectPlaceholder'),
      validate: {
        required: true,
        minLength: 3,
        message: t('support.subjectMin'),
      },
    },
    {
      name: 'category',
      label: t('support.categoryLabel'),
      type: 'combobox',
      required: true,
      options: [
        { value: 'bug', label: t('support.categoryBug') },
        { value: 'feature_request', label: t('support.categoryFeatureRequest') },
        { value: 'other', label: t('support.categoryOther') },
      ],
    },
    {
      name: 'message',
      label: t('support.messageLabel'),
      type: 'textarea',
      required: true,
      placeholder: t('support.messagePlaceholder'),
      validate: {
        required: true,
        minLength: 10,
        message: t('support.messageMin'),
      },
    },
    {
      name: 'attachments',
      label: t('support.attachmentsLabel'),
      type: 'file',
      description: t('support.attachmentsHint'),
    },
  ];

  return (
    <RecordEditDialog<Record<string, FormFieldValue>>
      open={open}
      onOpenChange={onOpenChange}
      title={t('support.createTicket')}
      description={t('support.createDescription')}
      fields={fields}
      defaultValues={{
        subject: '',
        category: 'other',
        message: '',
        attachments: null,
      }}
      submitLabel={t('support.submitTicket')}
      isSubmitting={isSubmitting}
      onSubmit={async (values) => {
        setSubmitting(true);
        try {
          const v = values as ReportValues;
          const ticket = await createTicket.mutateAsync({
            subject: v.subject,
            message: v.message,
            category: v.category,
          });
          if (v.attachments instanceof File) {
            await uploadAttachments.mutateAsync({
              ticketId: ticket.id,
              files: [v.attachments],
            });
          }
          appToast.success(t('support.ticketCreated'));
          onCreated(ticket);
          return undefined;
        } catch {
          appToast.error(t('support.createFailed'));
          return { ok: false as const };
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
