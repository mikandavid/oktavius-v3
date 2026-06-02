import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { CustomFieldsFormSection } from '@/components/custom-fields';
import { EntityForm } from '@/components/forms/EntityForm';
import { useApiRegistry } from '@/api/ApiProvider';
import {
  buildCustomFieldDefaults,
  getCustomFieldDefinitions,
  type CustomFieldValues,
} from '@/lib/custom-fields';
import { useOrgNavPaths } from '@/lib/org-profiles/useOrgProfile';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

import {
  clientFormDefaults,
  clientFormFields,
  clientsPageIcon,
  type ClientFormValues,
} from './shared';

export function ClientCreatePage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const nav = useOrgNavPaths();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customFieldDefinitions = useMemo(() => getCustomFieldDefinitions('client'), []);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(() =>
    buildCustomFieldDefaults(customFieldDefinitions),
  );

  const handleSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      return await submitApiForm({
        action: () =>
          api.clients.create({
            ...values,
            customFields: customFieldValues,
          }),
        onSuccess: (created) => {
          appToast.success('Client created.');
          navigate(`${nav.clients}/${created.id}`);
        },
        onError: (error) => appToast.fromApiError(error, 'Client could not be created.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModulePage title="New client" icon={clientsPageIcon()} backTo={nav.clients}>
      <EntityForm
        title="Client details"
        fields={clientFormFields}
        defaultValues={clientFormDefaults}
        submitLabel="Create client"
        isSubmitting={isSubmitting}
        warnOnDirty
        onSubmit={handleSubmit}
        renderAfterFields={() => (
          <CustomFieldsFormSection
            entityType="client"
            values={customFieldValues}
            surface="embedded"
            onChange={(fieldKey, value) =>
              setCustomFieldValues((current) => ({
                ...current,
                [fieldKey]: value as CustomFieldValues[string],
              }))
            }
          />
        )}
      />
    </ModulePage>
  );
}
