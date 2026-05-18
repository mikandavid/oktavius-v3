import { Button } from '@oktavius/base-ui';
import { Link } from 'react-router-dom';

import type { ClientRecord } from '@/app/demo-data';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField } from '@/components/forms/EntityForm';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { PlusIcon } from '@/lib/icons';

const CLIENT_STATUS_MAP = {
  Active: 'success',
  Prospect: 'info',
  Inactive: 'warning',
  Churned: 'destructive',
} as const;

export const clientColumns: CrudColumn<ClientRecord>[] = [
  {
    key: 'name',
    header: 'Client',
    sortable: true,
    render: (row) => (
      <span className="font-medium text-foreground">{row.name}</span>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true,
    type: 'badge',
    render: (row) => row.type,
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
    render: (row) => (
      <StatusBadge status={row.status} variantMap={CLIENT_STATUS_MAP} />
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
    render: (row) => row.contractEnd,
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

const ACCOUNT_MANAGERS = [
  'Anna Hofer',
  'Markus Leitner',
  'Nina Weiss',
];

const COUNTRIES = [
  'Austria',
  'Germany',
  'Switzerland',
  'Italy',
  'France',
  'Netherlands',
  'Other',
];

export const clientFormFields: FormField[] = [
  // Identity
  { name: 'name', label: 'Client Name', type: 'text', required: true, section: 'Identity' },
  { name: 'type', label: 'Type', type: 'select', options: ['Company', 'Individual'], required: true, section: 'Identity' },
  { name: 'industry', label: 'Industry', type: 'combobox', options: INDUSTRIES, required: true, section: 'Identity' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Inactive', 'Prospect', 'Churned'],
    required: true,
    section: 'Identity',
  },
  { name: 'tags', label: 'Tags', type: 'tags', section: 'Identity', colSpan: 2, placeholder: 'Add tag, press Enter…' },

  // Contact
  { name: 'email', label: 'Email', type: 'email', required: true, section: 'Contact' },
  { name: 'phone', label: 'Phone', type: 'phone', section: 'Contact' },
  { name: 'website', label: 'Website', type: 'url', section: 'Contact' },
  { name: 'country', label: 'Country', type: 'combobox', options: COUNTRIES, section: 'Contact' },
  { name: 'city', label: 'City', type: 'text', section: 'Contact' },

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
  type: string;
  industry: string;
  status: string;
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
  type: 'Company',
  industry: '',
  status: 'Prospect',
  email: '',
  phone: '',
  website: '',
  country: '',
  city: '',
  tags: [],
  notes: '',
  annualRevenue: '',
  contractStart: '',
  contractEnd: '',
  accountManager: '',
};

export function ClientsHeaderAction() {
  return (
    <Link to="/clients/new">
      <Button variant="cta">
        <PlusIcon size={16} />
        New client
      </Button>
    </Link>
  );
}
