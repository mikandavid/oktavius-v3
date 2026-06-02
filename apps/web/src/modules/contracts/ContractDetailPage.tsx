import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { RecordEditDialog } from '@/components/common/RecordEditDialog';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { EntityDetailWorkspaceTabs } from '@/components/detail/EntityDetailWorkspaceTabs';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { useDemoData } from '@/app/demo-data';
import { contractsPageIcon } from '@/lib/modulePageIcons';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

const CONTRACT_DETAIL_TABS = ['overview', 'activity', 'files', 'assistant'] as const;

import { contractFormFields, contractStatusBadge, type ContractFormValues } from './shared';
import { buildContractDetailFields } from './contractDetailFields';

export function ContractDetailPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { clients, contracts, users } = useDemoData();
  const [activeTab, setActiveTab] = useUrlTabState('overview', CONTRACT_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contract = useMemo(
    () => contracts.find((entry) => entry.id === contractId),
    [contracts, contractId],
  );
  const updateContractInline = useCallback(
    async (input: Parameters<typeof api.contracts.update>[1]) => {
      if (!contract) return;

      try {
        await api.contracts.update(contract.id, input);
        appToast.success('Contract updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Contract could not be updated.');
        throw error;
      }
    },
    [api, contract],
  );
  const clientRelationOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.name,
        label: client.name,
        description: [client.city, client.industry].filter(Boolean).join(' · '),
      })),
    [clients],
  );
  const ownerRelationOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.name,
        label: user.name,
        description: [user.team, user.role].filter(Boolean).join(' · '),
      })),
    [users],
  );

  useEntityAgentRegistration(
    contract
      ? {
          entityType: 'contract',
          entityId: contract.id,
          displayLabel: contract.title,
        }
      : null,
    { moduleId: 'contracts', moduleLabel: 'Contracts' },
  );

  if (!contract) {
    return (
      <ModulePage title="Contract not found" icon={contractsPageIcon()} backTo="/contracts">
        <p className="text-sm text-muted-foreground">This contract may have been removed.</p>
      </ModulePage>
    );
  }

  const editDefaults: ContractFormValues = {
    contractNumber: contract.contractNumber,
    title: contract.title,
    clientName: contract.clientName,
    status: contract.status,
    value: contract.value,
    startDate: contract.startDate,
    endDate: contract.endDate,
    owner: contract.owner,
  };

  return (
    <>
      <ModulePage
        title={contract.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{contract.contractNumber}</span>
            {contractStatusBadge(contract.status)}
          </span>
        }
        icon={contractsPageIcon()}
        backTo="/contracts"
        actions={
          <DetailPageHeaderActions
            onEdit={() => setEditOpen(true)}
            editLabel="Edit contract"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete contract"
          />
        }
      >
        <EntityDetailWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          entityType="contract"
          entityId={contract.id}
          overview={
            <DetailView
              title="Contract details"
              fields={buildContractDetailFields({
                contract,
                onInlineUpdate: updateContractInline,
                clientOptions: clientRelationOptions,
                ownerOptions: ownerRelationOptions,
              })}
            />
          }
        />
      </ModulePage>

      <RecordEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit contract"
        fields={contractFormFields}
        defaultValues={editDefaults}
        isSubmitting={isSubmitting}
        onSubmit={async (values) => {
          setIsSubmitting(true);
          try {
            return await submitApiForm({
              action: () => api.contracts.update(contract.id, values),
              onSuccess: () => {
                appToast.success('Contract updated.');
              },
              onError: (error) => appToast.fromApiError(error, 'Contract could not be updated.'),
            });
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this contract?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.contracts.delete(contract.id),
            navigate,
            redirectTo: '/contracts',
            successMessage: 'Contract deleted.',
            errorMessage: 'Contract could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
