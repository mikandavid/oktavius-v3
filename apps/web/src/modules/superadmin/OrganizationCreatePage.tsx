import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

import {
  organizationFormDefaults,
  organizationFormFields,
  organizationPageIcon,
  type OrganizationFormValues,
} from './shared';

export function OrganizationCreatePage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      return await submitApiForm({
        action: () => api.organizations.create(values),
        onSuccess: (created) => {
          appToast.success('Organization created.');
          navigate(`/superadmin/orgs/${created.id}`);
        },
        onError: (error) => appToast.fromApiError(error, 'Organization could not be created.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModulePage title="New organization" icon={organizationPageIcon()} backTo="/superadmin">
      <EntityForm
        title="Organization"
        fields={organizationFormFields}
        defaultValues={organizationFormDefaults}
        submitLabel="Create organization"
        isSubmitting={isSubmitting}
        warnOnDirty
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
