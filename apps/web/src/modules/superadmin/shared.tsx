import type { BadgeProps } from '@oktavius/base-ui';

import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import type { CrudColumn } from '@/components/data/CrudTable';
import { statusColumn } from '@/components/data/columns';
import type { FilterDef } from '@/components/data/FilterToolbar';
import type { FormField } from '@/components/forms/EntityForm';
import type { OrganizationRecord } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { organizationPageIcon, superadminPageIcon } from '@/lib/modulePageIcons';

export { superadminPageIcon, organizationPageIcon };

export const ORG_PLAN_VARIANT: Record<string, BadgeProps['variant']> = {
  Starter: 'secondary',
  Professional: 'info',
  Enterprise: 'success',
};

export const ORG_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Active: 'success',
  Trial: 'info',
  Suspended: 'warning',
  Churned: 'destructive',
};

export const ORG_ENV_VARIANT: Record<string, BadgeProps['variant']> = {
  Production: 'success',
  Sandbox: 'info',
  Trial: 'warning',
};

export const orgColumns: CrudColumn<OrganizationRecord>[] = [
  { key: 'name', header: 'Organization', sortable: true },
  { key: 'slug', header: 'Slug', sortable: true, hideBelow: 'md' },
  statusColumn('plan', 'Plan', ORG_PLAN_VARIANT),
  statusColumn('status', 'Status', ORG_STATUS_VARIANT),
  statusColumn('environment', 'Environment', ORG_ENV_VARIANT, { hideBelow: 'lg' }),
  { key: 'region', header: 'Region', sortable: true, hideBelow: 'lg' },
  { key: 'memberCount', header: 'Members', sortable: true, hideBelow: 'md' },
  { key: 'createdAt', header: 'Created', sortable: true, type: 'date', hideBelow: 'lg' },
];

export const orgFilters: FilterDef[] = [
  {
    key: 'plan',
    label: 'Plan',
    options: [
      { value: 'Starter', label: 'Starter' },
      { value: 'Professional', label: 'Professional' },
      { value: 'Enterprise', label: 'Enterprise' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Trial', label: 'Trial' },
      { value: 'Suspended', label: 'Suspended' },
      { value: 'Churned', label: 'Churned' },
    ],
  },
  {
    key: 'environment',
    label: 'Environment',
    options: [
      { value: 'Production', label: 'Production' },
      { value: 'Sandbox', label: 'Sandbox' },
      { value: 'Trial', label: 'Trial' },
    ],
  },
];

export type OrganizationFormValues = {
  name: string;
  slug: string;
  plan: OrganizationRecord['plan'];
  status: OrganizationRecord['status'];
  environment: OrganizationRecord['environment'];
  region: string;
  billingEmail: string;
  ownerName: string;
};

export const organizationFormDefaults: OrganizationFormValues = {
  name: '',
  slug: '',
  plan: 'Professional',
  status: 'Trial',
  environment: 'Sandbox',
  region: 'EU · Vienna',
  billingEmail: '',
  ownerName: '',
};

export const organizationFormFields: FormField[] = [
  { name: 'name', label: 'Organization name', type: 'text', required: true, section: 'Profile' },
  { name: 'slug', label: 'Slug', type: 'text', required: true, section: 'Profile' },
  {
    name: 'plan',
    label: 'Plan',
    type: 'combobox',
    options: ['Starter', 'Professional', 'Enterprise'],
    section: 'Subscription',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'combobox',
    options: ['Active', 'Trial', 'Suspended', 'Churned'],
    section: 'Subscription',
  },
  {
    name: 'environment',
    label: 'Environment',
    type: 'combobox',
    options: ['Production', 'Sandbox', 'Trial'],
    section: 'Subscription',
  },
  { name: 'region', label: 'Region', type: 'text', section: 'Operations' },
  { name: 'billingEmail', label: 'Billing email', type: 'email', section: 'Billing' },
  { name: 'ownerName', label: 'Owner', type: 'text', section: 'Ownership' },
];

export function OrganizationsHeaderAction() {
  return (
    <PageHeaderCtaLink to="/superadmin/orgs/new">
      <PlusIcon size={14} />
      New organization
    </PageHeaderCtaLink>
  );
}
