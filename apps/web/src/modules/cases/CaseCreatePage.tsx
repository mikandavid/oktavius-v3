import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { useDemoData } from '@/app/demo-data';
import { toast } from '@/lib/toast';

import { caseFormDefaults, caseFormFields, casesPageIcon, type CaseFormValues } from './shared';

export function CaseCreatePage() {
  const navigate = useNavigate();
  const { clients, createCase } = useDemoData();

  const handleSubmit = async (values: CaseFormValues) => {
    const client = clients.find((entry) => entry.name === values.clientName);
    const created = createCase({
      title: values.title,
      type: values.type,
      stage: values.stage,
      priority: values.priority,
      clientId: client?.id ?? '',
      clientName: values.clientName,
      assignee: values.assignee,
      dueAt: values.dueAt,
      summary: values.summary,
    });
    toast.success('Case created.');
    navigate(`/cases/${created.id}`);
  };

  return (
    <ModulePage title="New case" icon={casesPageIcon()} backTo="/cases">
      <EntityForm
        title="Case details"
        fields={caseFormFields}
        defaultValues={caseFormDefaults}
        submitLabel="Create case"
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
