import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { CustomFieldsFormSection } from '@/components/custom-fields';
import { EntityForm } from '@/components/forms/EntityForm';
import { useDemoData } from '@/app/demo-data';
import {
  buildCustomFieldDefaults,
  getCustomFieldDefinitions,
  type CustomFieldValues,
} from '@/lib/custom-fields';
import { toast } from '@/lib/toast';

import {
  clientFormDefaults,
  clientFormFields,
  clientsPageIcon,
  type ClientFormValues,
} from './shared';

export function ClientCreatePage() {
  const navigate = useNavigate();
  const { createClient } = useDemoData();
  const customFieldDefinitions = useMemo(() => getCustomFieldDefinitions('client'), []);
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(() =>
    buildCustomFieldDefaults(customFieldDefinitions),
  );

  const handleSubmit = async (values: ClientFormValues) => {
    const created = createClient({
      ...values,
      customFields: customFieldValues,
    });
    toast.success('Client created.');
    navigate(`/clients/${created.id}`);
  };

  return (
    <ModulePage title="New client" icon={clientsPageIcon()} backTo="/clients">
      <EntityForm
        title="Client details"
        fields={clientFormFields}
        defaultValues={clientFormDefaults}
        submitLabel="Create client"
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
