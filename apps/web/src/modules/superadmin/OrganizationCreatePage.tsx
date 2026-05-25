import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { useDemoData } from '@/app/demo-data';
import { toast } from '@/lib/toast';

import {
  organizationFormDefaults,
  organizationFormFields,
  organizationPageIcon,
  type OrganizationFormValues,
} from './shared';

export function OrganizationCreatePage() {
  const navigate = useNavigate();
  const { createOrganization } = useDemoData();

  const handleSubmit = async (values: OrganizationFormValues) => {
    const created = createOrganization(values);
    toast.success('Organization created.');
    navigate(`/superadmin/orgs/${created.id}`);
  };

  return (
    <ModulePage title="New organization" icon={organizationPageIcon()} backTo="/superadmin">
      <EntityForm
        title="Organization"
        fields={organizationFormFields}
        defaultValues={organizationFormDefaults}
        submitLabel="Create organization"
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
