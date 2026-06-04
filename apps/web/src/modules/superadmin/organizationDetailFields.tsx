import type { OrganizationRecord } from '@/app/demo-data';
import type { DetailFieldProps } from '@/components/common/DetailView';
import { StatusBadge } from '@/components/feedback/StatusBadge';

import { ORG_ENV_VARIANT, ORG_PLAN_VARIANT, ORG_STATUS_VARIANT } from './shared';

type OrganizationInlineUpdate = Partial<
  Pick<OrganizationRecord, 'billingEmail' | 'name' | 'ownerName' | 'region' | 'slug'>
>;

export function buildOrganizationDetailFields({
  organization,
  onInlineUpdate,
}: {
  organization: OrganizationRecord;
  onInlineUpdate: (input: OrganizationInlineUpdate) => void | Promise<void>;
}): DetailFieldProps[] {
  return [
    {
      label: 'Name',
      value: organization.name,
      importance: 'primary',
      inlineEdit: {
        value: organization.name,
        onSave: (name) => onInlineUpdate({ name }),
      },
    },
    {
      label: 'Slug',
      value: organization.slug,
      section: 'Profile',
      inlineEdit: {
        value: organization.slug,
        onSave: (slug) => onInlineUpdate({ slug }),
      },
    },
    {
      label: 'Region',
      value: organization.region,
      section: 'Operations',
      inlineEdit: {
        value: organization.region,
        onSave: (region) => onInlineUpdate({ region }),
      },
    },
    {
      label: 'Plan',
      value: <StatusBadge status={organization.plan} variantMap={ORG_PLAN_VARIANT} />,
      section: 'Subscription',
    },
    {
      label: 'Status',
      value: <StatusBadge status={organization.status} variantMap={ORG_STATUS_VARIANT} />,
      section: 'Subscription',
    },
    {
      label: 'Environment',
      value: <StatusBadge status={organization.environment} variantMap={ORG_ENV_VARIANT} />,
      section: 'Subscription',
    },
    {
      label: 'Billing email',
      value: organization.billingEmail,
      section: 'Billing',
      inlineEdit: {
        value: organization.billingEmail,
        type: 'email',
        onSave: (billingEmail) => onInlineUpdate({ billingEmail }),
      },
    },
    {
      label: 'Owner',
      value: organization.ownerName,
      section: 'Ownership',
      inlineEdit: {
        value: organization.ownerName,
        onSave: (ownerName) => onInlineUpdate({ ownerName }),
      },
    },
    {
      label: 'Members',
      value: String(organization.memberCount),
      section: 'Ownership',
      importance: 'meta',
    },
    {
      label: 'Created',
      value: organization.createdAt,
      importance: 'meta',
    },
  ];
}
