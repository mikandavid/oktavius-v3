import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  Avatar,
  Badge,
  Button,
  InlineEmptyState,
  ListRow,
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

import { useRegisterAgentPageContext } from '@/components/agent/page-context';
import { AuditTrailPanel } from '@/components/audit/AuditTrailPanel';
import { CustomFieldsDetailSection } from '@/components/custom-fields';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { RelatedRecordsPanel } from '@/components/detail/RelatedRecordsPanel';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { EntityStoragePanel } from '@/components/storage/EntityStoragePanel';
import { useDemoData } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import { clientStatusBadge, clientsPageIcon } from './shared';

const partyFormFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true },
  { name: 'role', label: 'Role', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'email' as const },
];

export function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, parties, tasks, orders, contracts, createParty } = useDemoData();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);

  const client = useMemo(() => clients.find((entry) => entry.id === clientId), [clients, clientId]);

  const agentPageRegistration = useMemo(
    () =>
      client
        ? {
            moduleId: 'clients',
            moduleLabel: 'Clients',
            routeLabel: client.name,
            primaryEntity: {
              entityType: 'client',
              entityId: client.id,
              displayLabel: client.name,
            },
          }
        : null,
    [client],
  );

  useRegisterAgentPageContext(agentPageRegistration);

  const clientParties = useMemo(
    () => parties.filter((party) => party.clientId === clientId),
    [parties, clientId],
  );

  const clientTasks = useMemo(
    () => tasks.filter((task) => task.parentId === clientId && task.parentType === 'client'),
    [tasks, clientId],
  );

  const clientOrders = useMemo(
    () => orders.filter((order) => order.clientId === clientId),
    [orders, clientId],
  );

  const clientContracts = useMemo(
    () => contracts.filter((contract) => contract.clientName === client?.name),
    [contracts, client],
  );

  if (!client) {
    return (
      <ModulePage title="Client not found" icon={clientsPageIcon()} backTo="/clients">
        <p className="text-sm text-muted-foreground">This client may have been removed.</p>
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
        backTo="/clients"
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete client" />}
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
              <StatCard label="Contracts" value={String(clientContracts.length)} />
              <StatCard
                label="Open tasks"
                value={String(clientTasks.filter((t) => t.status !== 'Completed').length)}
              />
            </div>

            <SectionCard title="Account summary">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Industry</dt>
                  <dd className="text-sm">{client.industry || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Account manager</dt>
                  <dd className="text-sm">{client.accountManager || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                  <dd className="text-sm">{client.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Phone</dt>
                  <dd className="text-sm">{client.phone || '—'}</dd>
                </div>
              </dl>
            </SectionCard>

            <CustomFieldsDetailSection entityType="client" customFields={client.customFields} />

            <SectionCard
              title="Key contacts"
              actions={
                <Button size="sm" variant="outline" onClick={() => setPartyDialogOpen(true)}>
                  <PlusIcon size={14} />
                  Add
                </Button>
              }
            >
              {clientParties.slice(0, 3).map((party) => (
                <ListRow
                  key={party.id}
                  leading={<Avatar label={party.name} size="sm" />}
                  title={party.name}
                  subtitle={party.role.replace(/_/g, ' ')}
                  meta={party.email}
                />
              ))}
              {clientParties.length === 0 ? (
                <InlineEmptyState text="No contacts yet." centered />
              ) : clientParties.length > 3 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setActiveTab('contacts')}
                >
                  View all contacts
                </Button>
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 pt-4">
            <SectionCard
              title="Contacts"
              meta={`${clientParties.length} people`}
              actions={
                <Button size="sm" variant="outline" onClick={() => setPartyDialogOpen(true)}>
                  <PlusIcon size={14} />
                  Add contact
                </Button>
              }
            >
              {clientParties.map((party) => (
                <ListRow
                  key={party.id}
                  leading={<Avatar label={party.name} size="sm" />}
                  title={party.name}
                  subtitle={party.role.replace(/_/g, ' ')}
                  meta={party.email}
                />
              ))}
              {clientParties.length === 0 ? (
                <InlineEmptyState text="No contacts linked to this client." centered />
              ) : null}
            </SectionCard>
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

            <SectionCard title="Contracts" meta={`${clientContracts.length} records`}>
              {clientContracts.map((contract) => (
                <ListRow
                  key={contract.id}
                  title={contract.title}
                  subtitle={contract.contractNumber}
                  meta={formatDisplayDate(contract.endDate)}
                  trailing={
                    <Link to={`/contracts/${contract.id}`} className="text-xs text-primary">
                      View
                    </Link>
                  }
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                />
              ))}
              {clientContracts.length === 0 ? (
                <InlineEmptyState text="No contracts for this client." centered />
              ) : null}
            </SectionCard>

            <RelatedRecordsPanel
              title="Orders"
              records={clientOrders.map((order) => ({
                id: order.id,
                title: order.orderNumber,
                subtitle: order.status,
                href: `/orders/${order.id}`,
                trailing: <Badge variant="outline">{formatDisplayDate(order.orderDate)}</Badge>,
              }))}
              viewAllHref="/orders"
              emptyLabel="No orders yet."
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
            <AuditTrailPanel entityType="client" entityId={client.id} />

            <SectionCard title="Recent activity">
              <Timeline events={recentActivity} />
            </SectionCard>

            <SectionCard title="Tasks">
              {clientTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={task.assignee}
                  meta={formatDisplayDate(task.dueDate)}
                  trailing={<Badge variant="outline">{task.status}</Badge>}
                />
              ))}
              {clientTasks.length === 0 ? (
                <InlineEmptyState text="No tasks assigned." centered />
              ) : null}
            </SectionCard>
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
        onSubmit={(values) => {
          createParty({
            clientId: client.id,
            name: String(values.name),
            role: String(values.role),
            email: String(values.email ?? ''),
          });
          toast.success('Contact added.');
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this client?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Client deleted.');
          navigate('/clients');
        }}
      />
    </>
  );
}
