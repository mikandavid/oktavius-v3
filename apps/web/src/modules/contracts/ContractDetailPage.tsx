import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { MoneyText, formatDisplayDate } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { useDemoData } from '@/app/demo-data';
import { contractsPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { contractStatusBadge } from './shared';

export function ContractDetailPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { contracts } = useDemoData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const contract = useMemo(
    () => contracts.find((entry) => entry.id === contractId),
    [contracts, contractId],
  );

  if (!contract) {
    return (
      <ModulePage title="Contract not found" icon={contractsPageIcon()} backTo="/contracts">
        <p className="text-sm text-muted-foreground">This contract may have been removed.</p>
      </ModulePage>
    );
  }

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
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete contract" />}
      >
        <DetailView
          title="Contract details"
          fields={[
            { label: 'Title', value: contract.title, importance: 'primary' },
            { label: 'Contract number', value: contract.contractNumber, section: 'Identification' },
            { label: 'Client', value: contract.clientName, section: 'Parties' },
            { label: 'Owner', value: contract.owner, section: 'Parties' },
            {
              label: 'Status',
              value: contractStatusBadge(contract.status),
              section: 'Terms',
            },
            {
              label: 'Contract value',
              value: <MoneyText value={Number(contract.value)} currency="EUR" />,
              section: 'Terms',
            },
            {
              label: 'Start date',
              value: formatDisplayDate(contract.startDate),
              section: 'Timeline',
            },
            {
              label: 'End date',
              value: formatDisplayDate(contract.endDate),
              section: 'Timeline',
            },
            {
              label: 'Renewal notice',
              value: `${contract.renewalNoticeDays} days`,
              section: 'Terms',
              importance: 'meta',
            },
          ]}
        />
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this contract?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Contract deleted.');
          navigate('/contracts');
        }}
      />
    </>
  );
}
