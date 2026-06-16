import { Avatar, type BadgeProps } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import type { FilterDef } from '@/components/data/FilterToolbar';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { FormField } from '@/components/forms/EntityForm';
import type { useTranslation } from '@/core/i18n';
import { OrganizationIcon, UserIcon } from '@/lib/icons';

import type { Contact, ContactCategory, ContactInput } from './data/types';

/** The translate function returned by useTranslation — `(key, params?, fallback?) => string`. */
type TFn = ReturnType<typeof useTranslation>['t'];

export const TYPE_VARIANT: Record<string, BadgeProps['variant']> = {
  business: 'info',
  person: 'secondary',
};

export type ContactRow = Contact & {
  typeValue: 'business' | 'person';
  typeLabel: string;
  categoryLabel: string;
};

export function toContactRow(
  contact: Contact,
  t: TFn,
  categoryNameById: Map<string, string>,
): ContactRow {
  const names = contact.categoryIds
    .map((id) => categoryNameById.get(id))
    .filter((name): name is string => Boolean(name));
  return {
    ...contact,
    typeValue: contact.isBusiness ? 'business' : 'person',
    typeLabel: contact.isBusiness
      ? t('contacts.typeBusiness', undefined, 'Business')
      : t('contacts.typePerson', undefined, 'Person'),
    categoryLabel: names.join(', '),
  };
}

export function contactColumns(t: TFn): CrudColumn<ContactRow>[] {
  return [
    {
      key: 'name',
      header: t('contacts.colName', undefined, 'Name'),
      sortable: true,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            label={row.name}
            size="sm"
            icon={row.isBusiness ? <OrganizationIcon /> : <UserIcon />}
          />
          <span className="truncate font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: t('contacts.colEmail', undefined, 'Email'),
      sortable: true,
      render: (row) => row.email || '—',
    },
    {
      key: 'phone',
      header: t('contacts.colPhone', undefined, 'Phone'),
      render: (row) => row.phone || row.mobile || '—',
    },
    {
      key: 'typeValue',
      header: t('contacts.colType', undefined, 'Type'),
      sortable: true,
      render: (row) => (
        <StatusBadge status={row.typeValue} label={row.typeLabel} variantMap={TYPE_VARIANT} />
      ),
    },
    {
      key: 'categoryLabel',
      header: t('contacts.colCategory', undefined, 'Category'),
      render: (row) => row.categoryLabel || '—',
    },
  ];
}

export function contactFilters(t: TFn, categories: ContactCategory[]): FilterDef[] {
  return [
    {
      key: 'type',
      label: t('contacts.colType', undefined, 'Type'),
      options: [
        { value: 'business', label: t('contacts.typeBusiness', undefined, 'Business') },
        { value: 'person', label: t('contacts.typePerson', undefined, 'Person') },
      ],
    },
    {
      key: 'category',
      label: t('contacts.colCategory', undefined, 'Category'),
      options: categories.map((category) => ({ value: category.id, label: category.name })),
    },
  ];
}

export function contactFormFields(t: TFn, categories: ContactCategory[]): FormField[] {
  const general = t('contacts.sectionGeneral', undefined, 'General');
  const address = t('contacts.sectionAddress', undefined, 'Address');
  const web = t('contacts.sectionWeb', undefined, 'Web');
  const classification = t('contacts.sectionClassification', undefined, 'Classification');
  const notesSection = t('contacts.sectionNotes', undefined, 'Notes');
  return [
    {
      name: 'name',
      label: t('contacts.fieldName', undefined, 'Name'),
      type: 'text',
      required: true,
      section: general,
      colSpan: 2,
    },
    {
      name: 'isBusiness',
      label: t('contacts.fieldIsBusiness', undefined, 'Business contact'),
      type: 'switch',
      section: general,
    },
    {
      name: 'email',
      label: t('contacts.fieldEmail', undefined, 'Email'),
      type: 'email',
      section: general,
    },
    {
      name: 'phone',
      label: t('contacts.fieldPhone', undefined, 'Phone'),
      type: 'phone',
      section: general,
    },
    {
      name: 'mobile',
      label: t('contacts.fieldMobile', undefined, 'Mobile'),
      type: 'phone',
      section: general,
    },
    {
      name: 'fax',
      label: t('contacts.fieldFax', undefined, 'Fax'),
      type: 'text',
      section: general,
    },
    {
      name: 'clientCode',
      label: t('contacts.fieldClientCode', undefined, 'Client code'),
      type: 'text',
      section: general,
    },
    {
      name: 'addressLine1',
      label: t('contacts.fieldAddressLine1', undefined, 'Street'),
      type: 'text',
      section: address,
      colSpan: 2,
    },
    {
      name: 'addressLine2',
      label: t('contacts.fieldAddressLine2', undefined, 'Address line 2'),
      type: 'text',
      section: address,
      colSpan: 2,
    },
    {
      name: 'city',
      label: t('contacts.fieldCity', undefined, 'City'),
      type: 'text',
      section: address,
    },
    {
      name: 'postalCode',
      label: t('contacts.fieldPostalCode', undefined, 'Postal code'),
      type: 'text',
      section: address,
    },
    {
      name: 'state',
      label: t('contacts.fieldState', undefined, 'State'),
      type: 'text',
      section: address,
    },
    {
      name: 'country',
      label: t('contacts.fieldCountry', undefined, 'Country'),
      type: 'text',
      section: address,
    },
    {
      name: 'linkedin',
      label: t('contacts.fieldLinkedin', undefined, 'LinkedIn'),
      type: 'url',
      section: web,
      colSpan: 2,
    },
    {
      name: 'categoryIds',
      label: t('contacts.fieldCategories', undefined, 'Categories'),
      type: 'multiselect',
      options: categories.map((category) => ({ value: category.id, label: category.name })),
      section: classification,
    },
    {
      name: 'tags',
      label: t('contacts.fieldTags', undefined, 'Tags'),
      type: 'tags',
      section: classification,
    },
    {
      name: 'notes',
      label: t('contacts.fieldNotes', undefined, 'Notes'),
      type: 'textarea',
      section: notesSection,
      colSpan: 2,
    },
  ];
}

export const EMPTY_CONTACT_INPUT: ContactInput = {
  name: '',
  isBusiness: false,
  email: '',
  phone: '',
  mobile: '',
  fax: '',
  linkedin: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  clientCode: '',
  categoryIds: [],
  tags: [],
  notes: '',
};

export function contactToInput(contact: Contact): ContactInput {
  return {
    name: contact.name,
    isBusiness: contact.isBusiness,
    email: contact.email,
    phone: contact.phone,
    mobile: contact.mobile,
    fax: contact.fax,
    linkedin: contact.linkedin,
    addressLine1: contact.addressLine1,
    addressLine2: contact.addressLine2,
    city: contact.city,
    state: contact.state,
    postalCode: contact.postalCode,
    country: contact.country,
    clientCode: contact.clientCode,
    categoryIds: contact.categoryIds,
    tags: contact.tags,
    notes: contact.notes,
  };
}
