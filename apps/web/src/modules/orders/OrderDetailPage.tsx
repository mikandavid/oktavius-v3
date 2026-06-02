import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@oktavius/base-ui';

import { ModuleScopedAssistantPanel } from '@/components/agent/ModuleScopedAssistantPanel';
import { AuditTrailPanel } from '@/components/audit/AuditTrailPanel';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { runDetailDeleteAction } from '@/components/detail/detailDeleteAction';
import { DetailPageHeaderActions } from '@/components/detail/DetailPageHeaderActions';
import { GeneratedRelatedRecordsPanel } from '@/components/detail/relatedRecordsConfig';
import { useEntityAgentRegistration } from '@/components/detail/useEntityAgentRegistration';
import { EntityStoragePanel } from '@/components/storage/EntityStoragePanel';
import { useDemoData } from '@/app/demo-data';
import { useEnsureDemoOrgForRecord } from '@/lib/demo/useEnsureDemoOrg';
import { useOrgNavPaths } from '@/lib/org-profiles/useOrgProfile';
import { ordersPageIcon } from '@/lib/modulePageIcons';
import { useUrlTabState } from '@/lib/routing/useUrlTabState';
import { appToast } from '@/lib/toast';
import { useApiRegistry } from '@/api/ApiProvider';

const ORDER_DETAIL_TABS = ['overview', 'lines', 'tasks', 'activity', 'files', 'assistant'] as const;

import { orderStatusBadge } from './shared';
import { buildOrderDetailFields } from './orderDetailFields';
import { createOrderLinesRelationConfig, orderTasksRelationConfig } from './orderRelatedRecords';

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const api = useApiRegistry();
  const { clients, findOrderById, orderLines, tasks, users } = useDemoData();
  const nav = useOrgNavPaths();
  const [activeTab, setActiveTab] = useUrlTabState('overview', ORDER_DETAIL_TABS);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const order = useMemo(() => findOrderById(orderId), [findOrderById, orderId]);
  useEnsureDemoOrgForRecord(order);

  const updateOrderInline = useCallback(
    async (input: Parameters<typeof api.orders.update>[1]) => {
      if (!order) return;
      try {
        await api.orders.update(order.id, input);
        appToast.success('Order updated.');
      } catch (error) {
        appToast.fromApiError(error, 'Order could not be updated.');
        throw error;
      }
    },
    [api, order],
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

  const orderLinesRelationConfig = useMemo(
    () =>
      createOrderLinesRelationConfig({
        orderHref: order ? `${nav.orders}/${order.id}?tab=lines` : nav.orders,
      }),
    [nav.orders, order],
  );

  useEntityAgentRegistration(
    order
      ? {
          entityType: 'order',
          entityId: order.id,
          displayLabel: order.orderNumber,
        }
      : null,
    { moduleId: 'orders', moduleLabel: 'Orders' },
  );

  if (!order) {
    return (
      <ModulePage title="Order not found" icon={ordersPageIcon()} backTo={nav.orders}>
        <p className="text-sm text-muted-foreground">This order may have been removed.</p>
      </ModulePage>
    );
  }

  return (
    <>
      <ModulePage
        title={order.orderNumber}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{order.clientName}</span>
            {orderStatusBadge(order.status)}
          </span>
        }
        icon={ordersPageIcon()}
        backTo={nav.orders}
        actions={
          <DetailPageHeaderActions
            onDelete={() => setDeleteOpen(true)}
            deleteLabel="Delete order"
          />
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lines">Line items</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <DetailView
              title="Order summary"
              fields={buildOrderDetailFields({
                order,
                onInlineUpdate: updateOrderInline,
                clientOptions: clientRelationOptions,
                ownerOptions: ownerRelationOptions,
              })}
            />
          </TabsContent>

          <TabsContent value="lines" className="space-y-4 pt-4">
            <GeneratedRelatedRecordsPanel
              config={orderLinesRelationConfig}
              parent={order}
              rows={orderLines}
            />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 pt-4">
            <GeneratedRelatedRecordsPanel
              config={orderTasksRelationConfig}
              parent={order}
              rows={tasks}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
            <AuditTrailPanel entityType="order" entityId={order.id} />
          </TabsContent>

          <TabsContent value="files" className="space-y-4 pt-4">
            <EntityStoragePanel entityType="order" entityId={order.id} />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-4 pt-4">
            <ModuleScopedAssistantPanel />
          </TabsContent>
        </Tabs>
      </ModulePage>

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this order?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          void runDetailDeleteAction({
            deleteRecord: () => api.orders.delete(order.id),
            navigate,
            redirectTo: nav.orders,
            successMessage: 'Order deleted.',
            errorMessage: 'Order could not be deleted.',
            toast: appToast,
          });
        }}
      />
    </>
  );
}
