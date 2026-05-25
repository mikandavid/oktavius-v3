import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Badge,
  InlineEmptyState,
  ListRow,
  MoneyText,
  SectionCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  formatDisplayDate,
} from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { useDemoData } from '@/app/demo-data';
import { ordersPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { orderStatusBadge } from './shared';

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, orderLines, tasks } = useDemoData();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const order = useMemo(() => orders.find((entry) => entry.id === orderId), [orders, orderId]);

  const lines = useMemo(
    () => orderLines.filter((line) => line.orderId === orderId),
    [orderLines, orderId],
  );

  const orderTasks = useMemo(
    () => tasks.filter((task) => task.parentId === orderId && task.parentType === 'order'),
    [tasks, orderId],
  );

  if (!order) {
    return (
      <ModulePage title="Order not found" icon={ordersPageIcon()} backTo="/orders">
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
        backTo="/orders"
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete order" />}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lines">Line items</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <SectionCard title="Order summary">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Client</dt>
                  <dd className="text-sm">{order.clientName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Owner</dt>
                  <dd className="text-sm">{order.owner}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                  <dd className="text-sm">{orderStatusBadge(order.status)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Total</dt>
                  <dd className="text-sm">
                    <MoneyText value={Number(order.total)} currency="EUR" />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Order date</dt>
                  <dd className="text-sm">{formatDisplayDate(order.orderDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Due date</dt>
                  <dd className="text-sm">{formatDisplayDate(order.dueDate)}</dd>
                </div>
              </dl>
            </SectionCard>
          </TabsContent>

          <TabsContent value="lines" className="space-y-4 pt-4">
            <SectionCard title="Line items" meta={`${lines.length} items`}>
              {lines.map((line) => (
                <ListRow
                  key={line.id}
                  title={line.productName}
                  subtitle={line.sku}
                  meta={`Qty ${line.quantity}`}
                  trailing={
                    <MoneyText value={Number(line.unitPrice) * line.quantity} currency="EUR" />
                  }
                />
              ))}
              {lines.length === 0 ? (
                <InlineEmptyState text="No line items on this order." centered />
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 pt-4">
            <SectionCard title="Tasks" meta={`${orderTasks.length} open items`}>
              {orderTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={task.assignee}
                  meta={formatDisplayDate(task.dueDate)}
                  trailing={<Badge variant="outline">{task.status}</Badge>}
                />
              ))}
              {orderTasks.length === 0 ? (
                <InlineEmptyState text="No tasks linked to this order." centered />
              ) : null}
            </SectionCard>
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
          toast.success('Order deleted.');
          navigate('/orders');
        }}
      />
    </>
  );
}
