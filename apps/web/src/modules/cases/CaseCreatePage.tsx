import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

import { casesPageIcon, type CaseFormValues } from './shared';
import { useCasesModuleConfig } from './useCasesModuleConfig';

export function CaseCreatePage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const moduleConfig = useCasesModuleConfig();
  const defaultValues: CaseFormValues = {
    title: '',
    type: moduleConfig.caseTypes[0] ?? 'Support',
    stage: moduleConfig.caseStages[0] ?? 'Intake',
    priority: 'Normal',
    clientName: '',
    assignee: '',
    dueAt: '',
    summary: '',
  };

  const handleSubmit = async (values: CaseFormValues) => {
    setIsSubmitting(true);
    try {
      return await submitApiForm({
        action: () =>
          api.cases.create({
            title: values.title,
            type: values.type,
            stage: values.stage,
            priority: values.priority,
            clientId: '',
            clientName: values.clientName,
            assignee: values.assignee,
            dueAt: values.dueAt,
            summary: values.summary,
          }),
        onSuccess: (created) => {
          appToast.success(moduleConfig.isFuneral ? 'Sterbefall angelegt.' : 'Case created.');
          navigate(`${moduleConfig.basePath}/${created.id}`);
        },
        onError: (error) =>
          appToast.fromApiError(
            error,
            moduleConfig.isFuneral
              ? 'Sterbefall konnte nicht angelegt werden.'
              : 'Case could not be created.',
          ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModulePage title={moduleConfig.newLabel} icon={casesPageIcon()} backTo={moduleConfig.basePath}>
      <EntityForm
        title={moduleConfig.isFuneral ? 'Sterbefall' : 'Case details'}
        fields={moduleConfig.formFields}
        defaultValues={defaultValues}
        submitLabel={moduleConfig.isFuneral ? 'Sterbefall anlegen' : 'Create case'}
        isSubmitting={isSubmitting}
        warnOnDirty
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
