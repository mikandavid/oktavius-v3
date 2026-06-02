import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Badge,
  MoneyText,
  STAT_CARD_GRID_CLASS,
  SectionCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  formatDisplayDate,
} from '@oktavius/base-ui';

import { useApiRegistry } from '@/api/ApiProvider';
import { AuditTrailPanel } from '@/components/audit/AuditTrailPanel';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { CustomFieldsDetailSection } from '@/components/custom-fields';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { GeneratedRelatedRecordsPanel } from '@/components/detail/relatedRecordsConfig';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { buildStructuredAddressMapsUrl } from '@/components/maps/AddressMapAction';
import { AddressMapSection } from '@/components/maps/AddressMapSection';
import { EntityStoragePanel } from '@/components/storage/EntityStoragePanel';
import { useDemoData } from '@/app/demo-data';
import { useEnsureDemoOrgForRecord } from '@/lib/demo/useEnsureDemoOrg';
import { useOrgNavPaths, useOrgProfile } from '@/lib/org-profiles/useOrgProfile';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { appToast } from '@/lib/toast';

const CLIENT_DETAIL_TABS = [
  'overview',
  'contacts',
  'commercial',
  'activity',
  'files',
  'assistant',
] as const;

import { clientStatusBadge, clientsPageIcon } from './shared';
import { buildClientDetailFields } from './clientDetailFields';
import {
  createClientPartiesRelationConfig,
  clientContractsRelationConfig,
  clientOrdersRelationConfig,
  clientTasksRelationConfig,
} from './clientRelatedRecords';

const partyFormFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'role', label: 'Role', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'email' as const },
];

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { findClientById, parties, tasks, orders, contracts, users } = useDemoData();
  const profile = useOrgProfile();
  const nav = useOrgNavPaths();
  const [activeTab, setActiveTab] = useUrlTabState('overview', CLIENT_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);

  const client = useMemo(() => findClientById(clientId), [clientId, findClientById]);
  useEnsureDemoOrgForRecord(client);

  const updateClientInline = useCallback(
    async (input: Parameters<typeof api.clients.update>[1]) => {
      if (!client) return;
      try {
        await api.clients.update(client.id, input);
        appToast.success('Client updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Client could not be updated.');
        throw error;
      }
    },
    [api, client],
  );

  useEntityAgentRegistration(
    client ? { entityType: 'client', entityId: client.id, displayLabel: client.name } : null,
    { moduleId: 'clients', moduleLabel: profile.terminology.clients },
  );

  const clientParties = useMemo(
    () => parties.filter((party) => party.clientId === clientId),
    [parties, clientId],
  );

  const clientOrders = useMemo(
    () => orders.filter((order) => order.clientId === clientId),
    [orders, clientId],
  );
  const accountManagerOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.name,
        label: user.name,
        description: [user.team, user.role].filter(Boolean).join(' · '),
      })),
    [users],
  );
  const clientContactHref = client ? `${nav.clients}/${client.id}?tab=contacts` : nav.clients;
  const keyContactsRelationConfig = useMemo(
    () =>
      createClientPartiesRelationConfig({
        title: 'Key contacts',
        clientHref: clientContactHref,
        viewAllHref: clientContactHref,
        emptyLabel: 'No contacts yet.',
        addLabel: 'Add',
        onAdd: () => setPartyDialogOpen(true),
      }),
    [clientContactHref],
  );
  const clientContactsRelationConfig = useMemo(
    () =>
      createClientPartiesRelationConfig({
        title: 'Contacts',
        clientHref: clientContactHref,
        addLabel: 'Add contact',
        onAdd: () => setPartyDialogOpen(true),
      }),
    [clientContactHref],
  );

  if (!client) {
    return (
      <ModulePage title="Client not found" icon={clientsPageIcon()} backTo={nav.clients}>
        <p className="text-sm text-muted-foreground">
          No client with id <code className="text-xs">{clientId}</code> exists in the demo data.
        </p>
      </ModulePage>
    );
  }

  const recentActivity = [
    {
      id: '1',
      label: 'Client record updated',
      description: 'Account details synced from CRM',
      timestamp: client.createdAt,
      tone: 'info' as const,
    },
    ...clientOrders.slice(0, 2).map((order) => ({
      id: order.id,
      label: `Order ${order.orderNumber}`,
      description: `${order.status} · ${order.owner}`,
      timestamp: order.orderDate,
      tone: 'default' as const,
    })),
  ];
  const clientLocationMapsUrl = buildStructuredAddressMapsUrl({
    city: client.city,
    country: client.country,
  });

  return (
    <>
      <ModulePage
        title={client.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              {client.city}, {client.country}
            </span>
            {clientStatusBadge(client.status)}
            <Badge variant="outline">{client.type}</Badge>
          </span>
        }
        icon={clientsPageIcon()}
        backTo={nav.clients}
        actions={
          <DetailPageHeaderActions
            editTo={`${nav.clients}/${client.id}/edit`}
            editLabel="Edit client"
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete client"
          />
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className={STAT_CARD_GRID_CLASS}>
              <StatCard label="Contacts" value={String(clientParties.length)} />
              <StatCard
                label="Open orders"
                value={String(
                  clientOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled')
                    .length,
                )}
              />
              <StatCard
                label="Contracts"
                value={String(
                  contracts.filter((contract) =>
                    clientContractsRelationConfig.match(client, contract),
                  ).length,
                )}
              />
              <StatCard
                label="Open tasks"
                value={String(
                  tasks.filter(
                    (task) =>
                      clientTasksRelationConfig.match(client, task) && task.status !== 'Completed',
                  ).length,
                )}
              />
            </div>

            <DetailView
              title="Account summary"
              fields={buildClientDetailFields({
                client,
                onInlineUpdate: updateClientInline,
                accountManagerOptions,
              })}
            />

            <AddressMapSection
              title={`Map preview for ${client.name}`}
              addressLines={[client.city, client.country]}
              url={clientLocationMapsUrl}
            />

            <CustomFieldsDetailSection entityType="client" customFields={client.customFields} />

            <GeneratedRelatedRecordsPanel
              config={keyContactsRelationConfig}
              parent={client}
              rows={parties}
            />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 pt-4">
            <GeneratedRelatedRecordsPanel
              config={clientContactsRelationConfig}
              parent={client}
              rows={parties}
            />
          </TabsContent>

          <TabsContent value="commercial" className="space-y-4 pt-4">
            <SectionCard title="Commercial terms">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Annual revenue</dt>
                  <dd className="text-sm">
                    {client.annualRevenue ? (
                      <MoneyText value={Number(client.annualRevenue)} currency="EUR" />
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Contract period</dt>
                  <dd className="text-sm">
                    {client.contractStart
                      ? `${formatDisplayDate(client.contractStart)} – ${client.contractEnd ? formatDisplayDate(client.contractEnd) : 'open'}`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </SectionCard>

            <GeneratedRelatedRecordsPanel
              config={clientContractsRelationConfig}
              parent={client}
              rows={contracts}
            />

            <GeneratedRelatedRecordsPanel
              config={clientOrdersRelationConfig}
              parent={client}
              rows={orders}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
            <AuditTrailPanel entityType="client" entityId={client.id} />

            <SectionCard title="Recent activity">
              <Timeline events={recentActivity} />
            </SectionCard>

            <GeneratedRelatedRecordsPanel
              config={clientTasksRelationConfig}
              parent={client}
              rows={tasks}
            />
          </TabsContent>

          <TabsContent value="files" className="space-y-4 pt-4">
            <EntityStoragePanel entityType="client" entityId={client.id} />
          </TabsContent>
        </Tabs>
      </ModulePage>

      <SubEntityFormDialog
        open={partyDialogOpen}
        onOpenChange={setPartyDialogOpen}
        title="Add contact"
        fields={partyFormFields}
        defaultValues={{ name: '', role: 'primary_contact', email: '' }}
        submitLabel="Add contact"
        onSubmit={async (values) => {
          await api.parties.create({
            clientId: client.id,
            name: String(values.name),
            role: String(values.role),
            email: String(values.email ?? ''),
          });
          appToast.success('Contact added.');
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this client?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.clients.delete(client.id),
            navigate,
            redirectTo: nav.clients,
            successMessage: 'Client deleted.',
            errorMessage: 'Client could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
