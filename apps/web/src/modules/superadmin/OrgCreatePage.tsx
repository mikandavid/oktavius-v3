import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { toast } from '@/lib/toast';

import { organizationPageIcon } from './shared';

const orgFormFields: FormField[] = [
  {
    name: 'name',
    label: 'Organization name',
    type: 'text',
    required: true,
    section: 'Identity',
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    required: true,
    section: 'Identity',
    description: 'URL-safe identifier, e.g. acme-corp',
  },
  {
    name: 'billingEmail',
    label: 'Billing email',
    type: 'email',
    required: true,
    section: 'Billing',
  },
  {
    name: 'ownerName',
    label: 'Primary owner',
    type: 'text',
    required: true,
    section: 'Billing',
  },
  {
    name: 'plan',
    label: 'Plan',
    type: 'select',
    options: ['Starter', 'Professional', 'Enterprise'],
    required: true,
    section: 'Plan',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Trial', 'Suspended', 'Churned'],
    required: true,
    section: 'Plan',
  },
  {
    name: 'environment',
    label: 'Environment',
    type: 'select',
    options: ['Production', 'Sandbox', 'Trial'],
    required: true,
    section: 'Plan',
  },
  {
    name: 'region',
    label: 'Region',
    type: 'text',
    required: true,
    section: 'Plan',
    placeholder: 'EU · Vienna',
  },
];

const defaultValues = {
  name: '',
  slug: '',
  billingEmail: '',
  ownerName: '',
  plan: 'Professional',
  status: 'Trial',
  environment: 'Trial',
  region: 'EU',
};

export function OrgCreatePage() {
  const navigate = useNavigate();
  const { createOrganization } = useDemoData();

  return (
    <ModulePage
      title="New organization"
      subtitle="Provision a tenant workspace for a customer or internal team."
      icon={organizationPageIcon()}
      backTo="/superadmin"
    >
      <EntityForm
        title="Organization details"
        subtitle="Provision a new tenant workspace. Memberships can be assigned after creation."
        fields={orgFormFields}
        defaultValues={defaultValues}
        submitLabel="Create organization"
        onSubmit={(values) => {
          const org = createOrganization({
            name: String(values.name),
            slug: String(values.slug),
            billingEmail: String(values.billingEmail),
            ownerName: String(values.ownerName),
            plan: values.plan as 'Starter' | 'Professional' | 'Enterprise',
            status: values.status as 'Active' | 'Trial' | 'Suspended' | 'Churned',
            environment: values.environment as 'Production' | 'Sandbox' | 'Trial',
            region: String(values.region),
          });
          toast.success(`Organization “${org.name}” created.`);
          navigate(`/superadmin/orgs/${org.id}`);
        }}
      />
    </ModulePage>
  );
}
