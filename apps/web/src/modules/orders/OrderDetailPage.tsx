import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import {
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
import { CrudTable, type CrudColumn } from '@/components/data/CrudTable';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';
import { OrderIcon } from '@/lib/icons';

import { ORDER_STATUS_MAP, ordersPageIcon } from './shared';
import type { OrderLineRecord } from '@/app/demo-data';

const lineColumns: CrudColumn<OrderLineRecord>[] = [
  { key: 'sku', header: 'SKU', render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
  { key: 'productName', header: 'Product', sortable: true },
  { key: 'quantity', header: 'Qty', align: 'right', sortable: true },
  {
    key: 'unitPrice',
    header: 'Unit price',
    align: 'right',
    type: 'currency',
    meta: { currencySymbol: '€' },
    render: (r) => r.unitPrice,
  },
];

export function OrderDetailPage() {
  const { orderId } = useParams();
  const { orders, orderLines, tasks } = useDemoData();
  const [tab, setTab] = useState('overview');

  const order = orders.find((o) => o.id === orderId);
  if (!order) return <Navigate to="/orders" replace />;

  const lines = orderLines.filter((l) => l.orderId === order.id);
  const orderTasks = tasks.filter((t) => t.parentId === order.id && t.parentType === 'order');

  const activity: TimelineEvent[] = [
    {
      id: '1',
      label: 'Order confirmed',
      timestamp: `${order.orderDate}T10:00:00Z`,
      tone: 'success',
    },
    {
      id: '2',
      label: 'Invoice generated',
      timestamp: `${order.orderDate}T14:30:00Z`,
      tone: 'info',
    },
    { id: '3', label: 'Fulfillment started', timestamp: '2024-11-12T09:00:00Z', tone: 'info' },
  ];

  return (
    <ModulePage
      title={order.orderNumber}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <Link
            to={`/clients/${order.clientId}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {order.clientName}
          </Link>
          <span className="text-muted-foreground">· {order.owner}</span>
          <StatusBadge status={order.status} variantMap={ORDER_STATUS_MAP} />
        </span>
      }
      icon={ordersPageIcon()}
      backTo="/orders"
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lines">Line items</TabsTrigger>
          <TabsTrigger value="tasks" attention={orderTasks.some((t) => t.status === 'Pending')}>
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Order total"
              value={<MoneyText value={order.total} />}
              icon={<OrderIcon size={16} />}
            />
            <StatCard label="Line items" value={String(order.lineCount)} />
            <StatCard label="Due date" value={formatDisplayDate(order.dueDate)} />
          </div>
          <SectionCard title="Recent activity">
            <Timeline events={activity} />
          </SectionCard>
          <SectionCard title="Open tasks" meta={`${orderTasks.length} total`}>
            {orderTasks.length ? (
              orderTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={`Due ${formatDisplayDate(task.dueDate)} · ${task.assignee}`}
                  trailing={<StatusBadge status={task.status} />}
                />
              ))
            ) : (
              <InlineEmptyState text="No tasks on this order." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="lines" className="pt-4">
          <SectionCard title="Line items" meta={<MoneyText value={order.total} />}>
            {lines.length ? (
              <CrudTable data={lines} columns={lineColumns} emptyTitle="No lines" compact />
            ) : (
              <InlineEmptyState text="No line items." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <SectionCard
            title="Tasks"
            actions={
              <Button variant="outline" size="sm">
                Add task
              </Button>
            }
          >
            {orderTasks.length ? (
              orderTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={`${task.assignee} · due ${formatDisplayDate(task.dueDate)}`}
                  trailing={<StatusBadge status={task.status} />}
                />
              ))
            ) : (
              <InlineEmptyState text="No tasks yet." centered />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}
