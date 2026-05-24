import type { ClientStatus, ClientType } from '@oktavius/reference-data';

import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';

import type { ClientRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField, AddressValue } from '@/components/forms/EntityForm';
import { EMPTY_ADDRESS } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { VocabularyText } from '@/components/reference/VocabularyText';
import { PlusIcon } from '@/lib/icons';
import { CLIENT_STATUS_BADGE_LABEL } from '@/lib/reference-data';

export const CLIENT_STATUS_MAP = {
  active: 'success',
  prospect: 'info',
  inactive: 'warning',
  churned: 'destructive',
} as const;

export const clientColumns: CrudColumn<ClientRecord>[] = [
  {
    key: 'name',
    header: 'Client',
    sortable: true,
    render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    hideBelow: 'md',
    render: (row) => <VocabularyText vocabulary="clientType" code={row.type} />,
  },
  {
    key: 'industry',
    header: 'Industry',
    sortable: true,
    hideBelow: 'lg',
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    hideBelow: 'md',
    render: (row) => (
      <StatusBadge
        status={row.status}
        label={CLIENT_STATUS_BADGE_LABEL[row.status]}
        variantMap={CLIENT_STATUS_MAP}
      />
    ),
  },
  {
    key: 'accountManager',
    header: 'Account Manager',
    sortable: true,
    hideBelow: 'md',
  },
  {
    key: 'annualRevenue',
    header: 'Annual Revenue',
    sortable: true,
    type: 'currency',
    align: 'right',
    hideBelow: 'lg',
    meta: { currencySymbol: '€' },
    render: (row) => row.annualRevenue,
  },
  {
    key: 'contractEnd',
    header: 'Contract End',
    sortable: true,
    type: 'date',
    hideBelow: 'lg',
  },
];

const INDUSTRIES = [
  'Technology',
  'Consulting',
  'Logistics',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Freelance',
  'Other',
];

const ACCOUNT_MANAGERS = ['Anna Hofer', 'Markus Leitner', 'Nina Weiss'];

export const clientFormFields: FormField[] = [
  // Identity
  { name: 'name', label: 'Client Name', type: 'text', required: true, section: 'Identity' },
  {
    name: 'type',
    label: 'Type',
    type: 'vocabulary',
    vocabulary: 'clientType',
    vocabularyDisplay: 'radio',
    required: true,
    section: 'Identity',
    radioOrientation: 'horizontal',
  },
  {
    name: 'industry',
    label: 'Industry',
    type: 'combobox',
    options: INDUSTRIES,
    required: true,
    section: 'Identity',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'vocabulary',
    vocabulary: 'clientStatus',
    required: true,
    section: 'Identity',
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'tags',
    section: 'Identity',
    colSpan: 2,
    placeholder: 'Add tag, press Enter…',
  },

  // Contact
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'Contact' },
  { name: 'phone', label: 'Phone', type: 'phone', section: 'Contact', placeholder: 'Local number' },
  { name: 'website', label: 'Website', type: 'url', section: 'Contact' },
  {
    name: 'address',
    label: 'Address',
    type: 'address',
    section: 'Contact',
    colSpan: 2,
  },

  // Contract
  {
    name: 'annualRevenue',
    label: 'Annual Revenue',
    type: 'currency',
    currencySymbol: '€',
    section: 'Contract',
  },
  {
    name: 'accountManager',
    label: 'Account Manager',
    type: 'combobox',
    options: ACCOUNT_MANAGERS,
    required: true,
    section: 'Contract',
  },
  { name: 'contractStart', label: 'Contract Start', type: 'date', section: 'Contract' },
  { name: 'contractEnd', label: 'Contract End', type: 'date', section: 'Contract' },

  // Notes
  { name: 'notes', label: 'Notes', type: 'textarea', section: 'Notes', colSpan: 2 },
];

export type ClientFormValues = {
  name: string;
  type: ClientType;
  industry: string;
  status: ClientStatus;
  email: string;
  phone: string;
  website: string;
  address: AddressValue;
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
  address: { ...EMPTY_ADDRESS },
  tags: [],
  notes: '',
  annualRevenue: '',
  contractStart: '',
  contractEnd: '',
  accountManager: '',
};

export const partyFormFields: FormField[] = [
  {
    name: 'salutation',
    label: 'Salutation',
    type: 'vocabulary',
    vocabulary: 'salutation',
    section: 'Contact',
  },
  { name: 'name', label: 'Name', type: 'text', required: true, section: 'Contact' },
  {
    name: 'role',
    label: 'Role',
    type: 'vocabulary',
    vocabulary: 'partyRole',
    required: true,
    section: 'Contact',
  },
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'Contact' },
];

export type PartyFormValues = {
  salutation: string;
  name: string;
  role: string;
  email: string;
};

export const partyFormDefaults: PartyFormValues = {
  salutation: '',
  name: '',
  role: '',
  email: '',
};

export function ClientsHeaderAction() {
  return (
    <PageHeaderCtaLink to="/clients/new">
      <PlusIcon size={14} />
      New client
    </PageHeaderCtaLink>
  );
}

export { clientsPageIcon } from '@/lib/modulePageIcons';
