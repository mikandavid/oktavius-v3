import { Button } from '@oktavius/base-ui';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { useTranslation } from '@/core/i18n';
import type { FormSubmissionResult } from '@/lib/formValidation';
import { UserCircleIcon } from '@/lib/icons';
import { modulePageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

import type { ContactInput } from './data/types';
import { useContact, useContactCategories, useContactMutations } from './data/useContactsData';
import { contactFormFields, contactToInput, EMPTY_CONTACT_INPUT } from './shared';

type ContactFormViewProps = {
  mode: 'create' | 'edit';
  contactId?: string;
};

export function ContactFormView({ mode, contactId }: ContactFormViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: categories } = useContactCategories();
  const existing = useContact(mode === 'edit' ? (contactId ?? null) : null);
  const { createContact, updateContact } = useContactMutations();

  const fields = useMemo(() => contactFormFields(t, categories ?? []), [t, categories]);
  const cancelHref = mode === 'edit' && contactId ? `/contacts?id=${contactId}` : '/contacts';

  if (mode === 'edit' && existing.isError) {
    return (
      <ModulePage
        title={t('contacts.notFoundTitle', undefined, 'Contact not found')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo={cancelHref}
      >
        <p className="text-sm text-muted-foreground">
          {t('contacts.notFoundDescription', undefined, 'This contact may have been deleted.')}
        </p>
      </ModulePage>
    );
  }

  if (mode === 'edit' && !existing.data) {
    return (
      <ModulePage
        title={t('contacts.editTitle', undefined, 'Edit contact')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo={cancelHref}
      >
        <div className="h-40 animate-pulse rounded-card bg-muted/60" />
      </ModulePage>
    );
  }

  const defaultValues: ContactInput =
    mode === 'edit' && existing.data ? contactToInput(existing.data) : EMPTY_CONTACT_INPUT;

  const onSubmit = async (values: ContactInput): Promise<FormSubmissionResult> => {
    try {
      if (mode === 'create') {
        const created = await createContact.mutateAsync(values);
        appToast.success(t('contacts.toastCreated', undefined, 'Contact created.'));
        navigate(`/contacts?id=${created.id}`);
      } else {
        await updateContact.mutateAsync({ id: contactId as string, input: values });
        appToast.success(t('contacts.toastUpdated', undefined, 'Contact updated.'));
        navigate(`/contacts?id=${contactId}`);
      }
      return undefined;
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : t('contacts.saveError', undefined, 'Save failed.'),
      };
    }
  };

  return (
    <ModulePage
      title={
        mode === 'create'
          ? t('contacts.newContact', undefined, 'New contact')
          : t('contacts.editTitle', undefined, 'Edit contact')
      }
      icon={modulePageIcon(UserCircleIcon)}
      backTo={cancelHref}
    >
      <EntityForm<ContactInput>
        title=""
        showHeader={false}
        surface="page"
        fields={fields}
        defaultValues={defaultValues}
        submitLabel={t('common.save', undefined, 'Save')}
        submitVariant="default"
        onSubmit={onSubmit}
        footerActions={
          <Button type="button" variant="ghost" onClick={() => navigate(cancelHref)}>
            {t('common.cancel', undefined, 'Cancel')}
          </Button>
        }
      />
    </ModulePage>
  );
}
