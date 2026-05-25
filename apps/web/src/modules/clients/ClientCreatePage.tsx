import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { useDemoData } from '@/app/demo-data';
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

  const handleSubmit = async (values: ClientFormValues) => {
    const created = createClient(values);
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
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
