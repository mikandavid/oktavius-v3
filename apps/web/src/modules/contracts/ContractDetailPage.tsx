import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import {
  AlertBanner,
  Badge,
  CollapsibleSection,
  MoneyText,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';

import { CONTRACT_STATUS_MAP, contractsPageIcon } from './shared';

export function ContractDetailPage() {
  const { contractId } = useParams();
  const { contracts } = useDemoData();
  const [tab, setTab] = useState('terms');
  const [docId, setDocId] = useState('f2');

  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return <Navigate to="/contracts" replace />;

  return (
    <>
      {contract.status === 'Expiring' ? (
        <AlertBanner tone="warning" flush>
          Contract expires on {formatDisplayDate(contract.endDate)} — renewal notice in{' '}
          {contract.renewalNoticeDays} days.
        </AlertBanner>
      ) : null}
      <ModulePage
        title={contract.contractNumber}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{contract.title}</span>
            <StatusBadge status={contract.status} variantMap={CONTRACT_STATUS_MAP} />
          </span>
        }
        icon={contractsPageIcon()}
        backTo="/contracts"
      >
        <DetailView
          title="Agreement summary"
          fields={[
            { key: 'client', label: 'Client', value: contract.clientName, section: 'Terms' },
            { key: 'value', label: 'Contract value', value: <MoneyText value={contract.value} />, section: 'Terms' },
            { key: 'owner', label: 'Owner', value: contract.owner, section: 'Terms' },
            { key: 'start', label: 'Start', value: formatDisplayDate(contract.startDate), section: 'Dates' },
            { key: 'end', label: 'End', value: formatDisplayDate(contract.endDate), section: 'Dates' },
          ]}
        />

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="terms">Clauses</TabsTrigger>
            <TabsTrigger value="document">Signed document</TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-3 pt-4">
            <CollapsibleSection title="1. Scope of services" defaultOpen badge={<Badge variant="secondary">Core</Badge>}>
              <p className="text-sm text-muted-foreground">
                Provider delivers the subscribed modules, support tiers, and SLA commitments as defined in
                Annex A. Change requests require written approval.
              </p>
            </CollapsibleSection>
            <CollapsibleSection title="2. Fees & payment" badge={<Badge variant="outline">Billing</Badge>}>
              <p className="text-sm text-muted-foreground">
                Annual fees invoiced quarterly in advance. Late payment interest applies after 14 days.
                Price adjustments capped at 5% YoY with 60-day notice.
              </p>
            </CollapsibleSection>
            <CollapsibleSection title="3. Liability & indemnity" badge={<Badge variant="warning">Legal</Badge>}>
              <p className="text-sm text-muted-foreground">
                Liability capped at 12 months of fees except for gross negligence, data breaches, or IP
                infringement. Mutual indemnification for third-party claims arising from misuse.
              </p>
            </CollapsibleSection>
            <CollapsibleSection title="4. Termination & renewal">
              <p className="text-sm text-muted-foreground">
                {contract.renewalNoticeDays}-day notice prior to end date. Auto-renewal unless either party
                opts out. Data export window of 30 days post-termination.
              </p>
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="document" className="pt-4">
            <DocumentPreviewPanel selectedId={docId} onSelect={setDocId} />
          </TabsContent>
        </Tabs>
      </ModulePage>
    </>
  );
}
