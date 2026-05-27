import type { BadgeProps } from '@oktavius/base-ui';
import { CLIENT_STATUS_BADGE_LABEL, CLIENT_STATUSES } from '@oktavius/reference-data';

import { PageHeaderCtaLink, PageHeaderOutlineLink } from '@/components/common/PageHeaderButtons';
import { BulkImportTrigger } from '@/components/data/BulkImportWizard';
import type { SavedViewPreset } from '@/components/data/useListSavedViews';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { ClientRecord } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { clientsPageIcon } from '@/lib/modulePageIcons';

export { clientsPageIcon };

export const CLIENT_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  active: 'success',
  inactive: 'secondary',
  prospect: 'info',
  churned: 'destructive',
};

export const clientColumns: CrudColumn<ClientRecord>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'type', header: 'Type', sortable: true, type: 'badge', hideBelow: 'md' },
  { key: 'industry', header: 'Industry', sortable: true, hideBelow: 'lg' },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <StatusBadge
        status={row.status}
        label={CLIENT_STATUS_BADGE_LABEL[row.status]}
        variantMap={CLIENT_STATUS_VARIANT}
      />
    ),
  },
  { key: 'city', header: 'City', sortable: true, hideBelow: 'md' },
  { key: 'accountManager', header: 'Account manager', sortable: true, hideBelow: 'lg' },
  { key: 'contractEnd', header: 'Contract end', sortable: true, type: 'date', hideBelow: 'lg' },
];

export const clientFilters: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    options: CLIENT_STATUSES.map((code) => ({
      value: code,
      label: CLIENT_STATUS_BADGE_LABEL[code],
    })),
  },
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'company', label: 'Company' },
      { value: 'individual', label: 'Individual' },
    ],
  },
];

export type ClientFormValues = {
  name: string;
  type: ClientRecord['type'];
  industry: string;
  status: ClientRecord['status'];
  email: string;
  phone: string;
  website: string;
  country: string;
  city: string;
  tags: string[];
  notes: string;
  annualRevenue: string;
  contractStart: string;
  contractEnd: string;
  accountManager: string;
};

export const clientFormDefaults: ClientFormValues = {
  name: '',
  type: 'company',
  industry: '',
  status: 'prospect',
  email: '',
  phone: '',
  website: '',
  country: 'AT',
  city: '',
  tags: [],
  notes: '',
  annualRevenue: '',
  contractStart: '',
  contractEnd: '',
  accountManager: '',
};

export const clientFormFields: FormField[] = [
  { name: 'name', label: 'Company / name', type: 'text', required: true, section: 'Profile' },
  {
    name: 'type',
    label: 'Type',
    type: 'vocabulary',
    vocabulary: 'clientType',
    section: 'Profile',
  },
  { name: 'industry', label: 'Industry', type: 'text', section: 'Profile' },
  {
    name: 'status',
    label: 'Status',
    type: 'vocabulary',
    vocabulary: 'clientStatus',
    section: 'Profile',
  },
  { name: 'email', label: 'Email', type: 'email', section: 'Contact' },
  { name: 'phone', label: 'Phone', type: 'phone', section: 'Contact' },
  { name: 'website', label: 'Website', type: 'url', section: 'Contact' },
  { name: 'country', label: 'Country', type: 'country', section: 'Address' },
  { name: 'city', label: 'City', type: 'text', section: 'Address' },
  { name: 'accountManager', label: 'Account manager', type: 'text', section: 'Commercial' },
  {
    name: 'annualRevenue',
    label: 'Annual revenue',
    type: 'currency',
    currencySymbol: '€',
    section: 'Commercial',
  },
  { name: 'contractStart', label: 'Contract start', type: 'date', section: 'Commercial' },
  { name: 'contractEnd', label: 'Contract end', type: 'date', section: 'Commercial' },
  { name: 'tags', label: 'Tags', type: 'tags', section: 'Notes' },
  { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2, section: 'Notes' },
];

export const CLIENT_SAVED_VIEWS: SavedViewPreset[] = [
  { id: 'all', label: 'All clients', isDefault: true, filters: { status: '', type: '' } },
  { id: 'active', label: 'Active accounts', filters: { status: 'active', type: '' } },
  { id: 'prospects', label: 'Prospects', filters: { status: 'prospect', type: '' } },
  { id: 'companies', label: 'Companies only', filters: { status: '', type: 'company' } },
];

export function ClientsHeaderAction() {
  return (
    <PageHeaderCtaLink to="/clients/new">
      <PlusIcon size={14} />
      New client
    </PageHeaderCtaLink>
  );
}

/** List page header: Import → Onboarding → New client (export is auto on CrudMainView). */
export function ClientsListHeaderActions() {
  return (
    <>
      <BulkImportTrigger entityLabel="clients" />
      <PageHeaderOutlineLink to="/clients/onboarding">Onboarding</PageHeaderOutlineLink>
      <ClientsHeaderAction />
    </>
  );
}

export function clientStatusBadge(status: ClientRecord['status']) {
  return (
    <StatusBadge
      status={status}
      label={CLIENT_STATUS_BADGE_LABEL[status]}
      variantMap={CLIENT_STATUS_VARIANT}
    />
  );
}
