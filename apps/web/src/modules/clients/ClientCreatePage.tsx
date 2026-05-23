import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';

import { clientFormDefaults, clientFormFields, clientsPageIcon, type ClientFormValues } from './shared';

export function ClientCreatePage() {
  const navigate = useNavigate();
  const { createClient } = useDemoData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <ModulePage title="New Client" backTo="/clients" icon={clientsPageIcon()}>
      <EntityForm<ClientFormValues>
        title="Client details"
        fields={clientFormFields}
        defaultValues={clientFormDefaults}
        submitLabel="Create client"
        isSubmitting={isSubmitting}
        onSubmit={(values) => {
          setIsSubmitting(true);
          const next = createClient({
            name: values.name,
            type: values.type as 'Company' | 'Individual',
            industry: values.industry,
            status: values.status as 'Active' | 'Inactive' | 'Prospect' | 'Churned',
            email: values.email,
            phone: values.phone,
            website: values.website,
            country: values.country,
            city: values.city,
            tags: Array.isArray(values.tags) ? values.tags : [],
            notes: values.notes,
            annualRevenue: values.annualRevenue,
            contractStart: values.contractStart,
            contractEnd: values.contractEnd,
            accountManager: values.accountManager,
          });
          setIsSubmitting(false);
          navigate(`/clients/${next.id}`);
        }}
      />
    </ModulePage>
  );
}
