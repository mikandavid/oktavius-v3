import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { type DetailFieldProps, DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { useTranslation } from '@/core/i18n';
import { UserCircleIcon } from '@/lib/icons';
import { modulePageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';

import { useContact, useContactCategories, useContactMutations } from './data/useContactsData';

export function ContactDetailView({ contactId }: { contactId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: contact, isLoading, isError } = useContact(contactId);
  const { data: categories } = useContactCategories();
  const { deleteContacts } = useContactMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <ModulePage
        title={t('contacts.detailLoading', undefined, 'Contact')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo="/contacts"
      >
        <div className="h-40 animate-pulse rounded-card bg-muted/60" />
      </ModulePage>
    );
  }

  if (isError || !contact) {
    return (
      <ModulePage
        title={t('contacts.notFoundTitle', undefined, 'Contact not found')}
        icon={modulePageIcon(UserCircleIcon)}
        backTo="/contacts"
      >
        <p className="text-sm text-muted-foreground">
          {t('contacts.notFoundDescription', undefined, 'This contact may have been deleted.')}
        </p>
      </ModulePage>
    );
  }

  const categoryNames = contact.categoryIds
    .map((id) => (categories ?? []).find((category) => category.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const general = t('contacts.sectionGeneral', undefined, 'General');
  const address = t('contacts.sectionAddress', undefined, 'Address');
  const web = t('contacts.sectionWeb', undefined, 'Web');
  const classification = t('contacts.sectionClassification', undefined, 'Classification');
  const notesSection = t('contacts.sectionNotes', undefined, 'Notes');
  const dash = '—';

  const fields: DetailFieldProps[] = [
    {
      label: t('contacts.fieldEmail', undefined, 'Email'),
      value: contact.email || dash,
      section: general,
    },
    {
      label: t('contacts.fieldPhone', undefined, 'Phone'),
      value: contact.phone || dash,
      section: general,
    },
    {
      label: t('contacts.fieldMobile', undefined, 'Mobile'),
      value: contact.mobile || dash,
      section: general,
    },
    {
      label: t('contacts.fieldFax', undefined, 'Fax'),
      value: contact.fax || dash,
      section: general,
    },
    {
      label: t('contacts.fieldClientCode', undefined, 'Client code'),
      value: contact.clientCode || dash,
      section: general,
    },
    {
      label: t('contacts.fieldAddressLine1', undefined, 'Street'),
      value: [contact.addressLine1, contact.addressLine2].filter(Boolean).join(', ') || dash,
      section: address,
    },
    {
      label: t('contacts.fieldCity', undefined, 'City'),
      value: [contact.postalCode, contact.city].filter(Boolean).join(' ') || dash,
      section: address,
    },
    {
      label: t('contacts.fieldState', undefined, 'State'),
      value: contact.state || dash,
      section: address,
    },
    {
      label: t('contacts.fieldCountry', undefined, 'Country'),
      value: contact.country || dash,
      section: address,
    },
    {
      label: t('contacts.fieldLinkedin', undefined, 'LinkedIn'),
      value: contact.linkedin || dash,
      section: web,
    },
    {
      label: t('contacts.fieldCategories', undefined, 'Categories'),
      value: categoryNames.join(', ') || dash,
      section: classification,
    },
    {
      label: t('contacts.fieldTags', undefined, 'Tags'),
      value: contact.tags.join(', ') || dash,
      section: classification,
    },
    {
      label: t('contacts.fieldNotes', undefined, 'Notes'),
      value: contact.notes || dash,
      section: notesSection,
    },
  ];

  const typeLabel = contact.isBusiness
    ? t('contacts.typeBusiness', undefined, 'Business')
    : t('contacts.typePerson', undefined, 'Person');

  return (
    <ModulePage
      title={contact.name}
      subtitle={[typeLabel, ...categoryNames].join(' · ')}
      icon={modulePageIcon(UserCircleIcon)}
      backTo="/contacts"
      actions={
        <div className="flex items-center gap-2">
          <IconEditButton
            to={`/contacts?id=${contactId}&mode=edit`}
            label={t('common.edit', undefined, 'Edit')}
          />
          <IconDeleteButton
            onClick={() => setConfirmOpen(true)}
            label={t('common.delete', undefined, 'Delete')}
          />
        </div>
      }
    >
      <DetailView title={t('contacts.detailsSection', undefined, 'Details')} fields={fields} />

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('contacts.deleteTitle', undefined, 'Delete this contact?')}
        description={t('contacts.deleteDescription', undefined, 'This action cannot be undone.')}
        confirmLabel={t('common.delete', undefined, 'Delete')}
        confirmVariant="destructive"
        onConfirm={async () => {
          try {
            await deleteContacts.mutateAsync([contactId]);
            appToast.success(t('contacts.toastDeleted', undefined, 'Contact deleted.'));
            navigate('/contacts');
          } catch (error) {
            appToast.fromApiError(
              error,
              t('contacts.deleteError', undefined, 'Contact could not be deleted.'),
            );
          }
        }}
      />
    </ModulePage>
  );
}
