import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import {
  Avatar,
  Badge,
  Button,
  InlineEmptyState,
  ListRow,
  MoneyText,
  SectionCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  type TimelineEvent,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { ModulePage } from '@/components/common/PageLayout';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';
import { PlusIcon, ProjectsIcon } from '@/lib/icons';
import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { toast } from '@/lib/toast';

import { useClientDetail, useDeleteClient } from './clients-api';

import {
  CLIENT_STATUS_MAP,
  clientsPageIcon,
  partyFormDefaults,
  partyFormFields,
  type PartyFormValues,
} from './shared';

function formatStatMoney(value: string) {
  if (!value) return '—';
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(
    Number(value),
  );
}

function DetailFields({
  fields,
}: {
  fields: Array<{ label: string; value: ReactNode; colSpan?: 1 | 2 }>;
}) {
  return (
    <dl className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.label}
          className={field.colSpan === 2 ? 'space-y-1 md:col-span-2' : 'space-y-1'}
        >
          <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
          <dd className="text-sm text-foreground">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ClientDetailPage() {
  const { clientId } = useParams();
  const { parties, tasks, orders, createParty } = useDemoData();
  const { data: client, isLoading } = useClientDetail(clientId);
  const deleteClient = useDeleteClient();
  const navigate = useNavigate();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [docId, setDocId] = useState('f1');

  if (isLoading) {
    return (
      <ModulePage title="Client" backTo="/clients" icon={clientsPageIcon()}>
        <p className="text-sm text-muted-foreground">Loading client…</p>
      </ModulePage>
    );
  }

  if (!client) return <Navigate to="/clients" replace />;

  const clientParties = parties.filter((p) => p.clientId === client.id);
  const clientTasks = tasks.filter((t) => t.parentId === client.id && t.parentType === 'client');
  const clientOrders = orders.filter((o) => o.clientId === client.id);

  const activity: TimelineEvent[] = [
    { id: '1', label: 'Contract renewed', timestamp: '2024-10-15T10:00:00Z', tone: 'success' },
    { id: '2', label: 'QBR completed', timestamp: '2024-09-20T14:00:00Z', tone: 'info' },
    {
      id: '3',
      label: 'Support ticket escalated',
      timestamp: '2024-08-02T09:30:00Z',
      tone: 'warning',
    },
  ];

  return (
    <ModulePage
      title={client.name}
      icon={clientsPageIcon()}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {client.type} · {client.industry}
          </span>
          <StatusBadge status={client.status} variantMap={CLIENT_STATUS_MAP} />
        </span>
      }
      backTo="/clients"
      actions={
        <div className="flex items-center gap-2">
          <IconEditButton to={`/clients/${client.id}/edit`} />
          <IconDeleteButton onClick={() => setConfirmDeleteOpen(true)} />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="tasks" attention={clientTasks.some((t) => t.status === 'Pending')}>
            Tasks
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Parties"
              value={String(clientParties.length)}
              icon={<ProjectsIcon size={16} />}
            />
            <StatCard label="Open orders" value={String(clientOrders.length)} />
            <StatCard label="Annual revenue" value={formatStatMoney(client.annualRevenue)} />
          </div>
          <SectionCard title="Recent activity">
            <Timeline events={activity} />
          </SectionCard>
          <SectionCard title="Parties" meta="Top contacts">
            {clientParties.slice(0, 3).map((party) => (
              <ListRow
                key={party.id}
                title={party.name}
                subtitle={`${party.role} · ${party.email}`}
                leading={<Avatar label={party.name} size="sm" tone="accent" />}
              />
            ))}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTab('parties')}>
              View all parties
            </Button>
          </SectionCard>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 pt-4">
          <SectionCard title="Identity">
            <DetailFields
              fields={[
                { label: 'Type', value: <Badge variant="outline">{client.type}</Badge> },
                { label: 'Industry', value: client.industry || '—' },
              ]}
            />
          </SectionCard>
          <SectionCard title="Contact">
            <DetailFields
              fields={[
                { label: 'Email', value: client.email || '—' },
                { label: 'Phone', value: client.phone || '—' },
              ]}
            />
          </SectionCard>
          <SectionCard title="Contract">
            <DetailFields
              fields={[
                {
                  label: 'Annual revenue',
                  value: client.annualRevenue ? <MoneyText value={client.annualRevenue} /> : '—',
                },
                { label: 'Account manager', value: client.accountManager || '—' },
                { label: 'Contract end', value: formatDisplayDate(client.contractEnd) },
              ]}
            />
          </SectionCard>
          <SectionCard title="Notes">
            <DetailFields fields={[{ label: 'Notes', value: client.notes || '—', colSpan: 2 }]} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="parties" className="pt-4">
          <SectionCard
            title="Parties"
            meta={`${clientParties.length} linked`}
            actions={
              <Button variant="outline" size="sm" onClick={() => setAddPartyOpen(true)}>
                <PlusIcon size={14} className="mr-1.5" />
                Add
              </Button>
            }
          >
            {clientParties.length ? (
              clientParties.map((party) => (
                <ListRow
                  key={party.id}
                  title={party.name}
                  subtitle={`${party.role} · ${party.email}`}
                  leading={<Avatar label={party.name} size="sm" tone="accent" />}
                />
              ))
            ) : (
              <InlineEmptyState text="No parties linked yet." centered />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <SectionCard
            title="Tasks"
            actions={
              <Button variant="outline" size="sm">
                <PlusIcon size={14} className="mr-1.5" />
                Add
              </Button>
            }
          >
            {clientTasks.length ? (
              clientTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={`Due ${formatDisplayDate(task.dueDate)} · ${task.assignee}`}
                  trailing={<StatusBadge status={task.status} />}
                />
              ))
            ) : (
              <InlineEmptyState text="No tasks for this client." centered />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <SectionCard title="Documents">
            <DocumentPreviewPanel selectedId={docId} onSelect={setDocId} />
          </SectionCard>
        </TabsContent>
      </Tabs>

      {clientOrders.length > 0 ? (
        <SectionCard title="Recent orders" className="mt-4">
          {clientOrders.slice(0, 3).map((order) => (
            <ListRow
              key={order.id}
              title={order.orderNumber}
              subtitle={formatDisplayDate(order.orderDate)}
              trailing={
                <Link
                  to={`/orders/${order.id}`}
                  className="text-xs font-medium text-cta hover:underline"
                >
                  Open
                </Link>
              }
              onClick={() => navigate(`/orders/${order.id}`)}
            />
          ))}
        </SectionCard>
      ) : null}

      <SubEntityFormDialog<PartyFormValues>
        open={addPartyOpen}
        onOpenChange={setAddPartyOpen}
        title="Add party"
        description="Link a contact to this client account."
        fields={partyFormFields}
        defaultValues={partyFormDefaults}
        submitLabel="Add party"
        onSubmit={(values) => {
          createParty({
            clientId: client.id,
            name: values.name,
            role: values.role,
            email: values.email,
          });
          toast.success('Party added.');
        }}
      />

      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete ${client.name}?`}
        description="This action cannot be undone. The client record will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          deleteClient.mutate(client.id, {
            onSuccess: () => navigate('/clients'),
          });
        }}
      />
    </ModulePage>
  );
}
