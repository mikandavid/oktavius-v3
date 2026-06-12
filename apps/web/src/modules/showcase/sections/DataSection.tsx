import { useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  CopyButton,
  ListRow,
  MoneyText,
  RelativeTime,
  STAT_CARD_GRID_CLASS,
  SettingsTable,
  StatCard,
} from '@oktavius/base-ui';

import { CrudListShell } from '@/components/data/CrudListShell';
import { SavedViewSelector } from '@/components/data/SavedViewSelector';
import { statusColumn } from '@/components/data/columns';
import {
  CrudTable,
  type BulkAction,
  type CrudColumn,
  type CrudRowAction,
} from '@/components/data/CrudTable';
import { useListPageState } from '@/lib/useListPageState';
import { appToast } from '@/lib/toast';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { ShowcaseBlock } from '../shared';

type ProductRecord = {
  id: string;
  sku: string;
  name: string;
  category: string;
  status: 'Active' | 'Discontinued' | 'Draft';
  price: string;
  stock: number;
};

const SHOWCASE_PRODUCTS: ProductRecord[] = [
  {
    id: 'prod_1',
    sku: 'CHR-100',
    name: 'Conference chair',
    category: 'Furniture',
    status: 'Active',
    price: '129.00',
    stock: 42,
  },
  {
    id: 'prod_2',
    sku: 'DSK-210',
    name: 'Standing desk',
    category: 'Furniture',
    status: 'Active',
    price: '549.00',
    stock: 8,
  },
  {
    id: 'prod_3',
    sku: 'LMP-031',
    name: 'Desk lamp',
    category: 'Lighting',
    status: 'Draft',
    price: '39.90',
    stock: 120,
  },
  {
    id: 'prod_4',
    sku: 'MON-275',
    name: '27" monitor',
    category: 'Electronics',
    status: 'Active',
    price: '289.00',
    stock: 17,
  },
  {
    id: 'prod_5',
    sku: 'CBL-905',
    name: 'HDMI cable 2m',
    category: 'Electronics',
    status: 'Discontinued',
    price: '9.90',
    stock: 0,
  },
];

const PRODUCT_STATUS_VARIANT = {
  Active: 'success',
  Draft: 'warning',
  Discontinued: 'secondary',
} as const;

const productColumns: CrudColumn<ProductRecord>[] = [
  { key: 'sku', header: 'SKU', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  statusColumn('status', 'Status', PRODUCT_STATUS_VARIANT),
  {
    key: 'price',
    header: 'Price',
    sortable: true,
    type: 'currency',
    meta: { currencySymbol: '€' },
  },
  { key: 'stock', header: 'Stock', sortable: true },
];

const productFilters = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Draft', label: 'Draft' },
      { value: 'Discontinued', label: 'Discontinued' },
    ],
  },
  {
    key: 'category',
    label: 'Category',
    options: [
      { value: 'Licenses', label: 'Licenses' },
      { value: 'Services', label: 'Services' },
      { value: 'Hardware', label: 'Hardware' },
    ],
  },
];

const SETTINGS_ROWS = [
  { id: '1', label: 'Net 30', code: 'NET30', active: true },
  { id: '2', label: 'Net 14', code: 'NET14', active: true },
  { id: '3', label: 'Due on receipt', code: 'DUE', active: false },
];

const permissionRows = [
  { id: 'perm_1', name: 'Northwind GmbH', owner: 'Mira Braun', internalMargin: '42%' },
];

const permissionColumns: CrudColumn<(typeof permissionRows)[number]>[] = [
  { key: 'name', header: 'Client' },
  { key: 'owner', header: 'Owner' },
  { key: 'internalMargin', header: 'Internal margin', permission: 'demo.locked' },
];

const permissionRowActions: CrudRowAction<(typeof permissionRows)[number]>[] = [
  {
    key: 'audit',
    label: 'Audit access',
    permission: 'demo.locked',
    onClick: () => {
      appToast.info('Guarded row action');
    },
  },
];

const permissionBulkActions: BulkAction[] = [
  {
    key: 'bulk-audit',
    label: 'Bulk audit',
    permission: 'demo.locked',
    onClick: () => {
      appToast.info('Guarded bulk action');
    },
  },
];

function permissionRuntime(allowed: boolean): OsirisRuntimeContextValue {
  return {
    currentUser: {
      id: 'showcase-user',
      email: 'showcase@example.com',
      fullName: 'Showcase User',
      isSuperadmin: false,
    },
    organizations: [],
    memberships: [],
    activeOrgId: 'showcase-org',
    activeSiteId: 'showcase-site',
    permissions: allowed ? ['demo.locked'] : [],
    permissionSubject: {
      isSuperadmin: false,
      role: 'member',
      permissions: allowed ? ['demo.locked'] : [],
    },
    locationAccess: null,
    config: null,
    isLoading: false,
    error: null,
    reload: async () => {},
  };
}

export function DataSection() {
  const [rows, setRows] = useState(SHOWCASE_PRODUCTS);
  const [savedView, setSavedView] = useState('all');
  const [permissionAllowed, setPermissionAllowed] = useState(false);

  const list = useListPageState({
    rows,
    defaultSort: 'name',
    filterKeys: ['status', 'category'],
    searchKeys: ['name', 'sku', 'category'],
  });

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="StatCard grid" meta="STAT_CARD_GRID_CLASS · max 6 per row">
        <div className={STAT_CARD_GRID_CLASS}>
          <StatCard
            label="Revenue"
            value={<MoneyText value={51340} currency="EUR" compact />}
            delta="+8%"
            trend="up"
          />
          <StatCard label="Open orders" value="3" description="2 confirmed" />
          <StatCard label="Active cases" value="4" delta="1 critical" trend="down" />
          <StatCard label="Overdue invoices" value="1" trend="down" delta="+€15.8K" />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="ListRow variants" meta="default · muted · warning · dashed · queue">
        <ListRow
          title="Apex Technologies GmbH"
          subtitle="Vienna, AT · Enterprise"
          meta="Anna Hofer"
          leading={<Avatar label="Anna Hofer" size="sm" />}
          trailing={<Badge variant="success">Active</Badge>}
        />
        <ListRow variant="muted" title="Muted row" subtitle="De-emphasized context" />
        <ListRow variant="warning" title="Warning row" subtitle="Needs attention" />
        <ListRow variant="dashed" title="Dashed row" subtitle="Placeholder slot" />
        <ListRow
          variant="queue"
          title="Invoice INV-2024-9012"
          subtitle="Donau Logistics AG"
          trailing={<Badge variant="destructive">Overdue</Badge>}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="Display atoms" meta="MoneyText · RelativeTime · CopyButton">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <MoneyText value={28450} currency="EUR" />
          <RelativeTime date="2024-12-05T10:30:00Z" />
          <CopyButton value="INV-2024-8821" label="Copy invoice number" />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="SettingsTable" meta="Catalog config — lighter than CrudTable">
        <SettingsTable
          columns={[
            { key: 'label', header: 'Label', cell: (row) => row.label },
            { key: 'code', header: 'Code', cell: (row) => row.code },
            {
              key: 'active',
              header: 'Status',
              cell: (row) => (
                <Badge variant={row.active ? 'success' : 'secondary'}>
                  {row.active ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
          ]}
          rows={SETTINGS_ROWS}
          getRowId={(row) => row.id}
          emptyMessage="No rows"
        />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Permission-aware table"
        meta="Column, row action, and bulk action use the same PermissionSubject"
        actions={
          <Button
            size="sm"
            variant={permissionAllowed ? 'default' : 'outline'}
            onClick={() => setPermissionAllowed((current) => !current)}
          >
            {permissionAllowed ? 'Locked fields visible' : 'Locked fields hidden'}
          </Button>
        }
      >
        <OsirisRuntimeContext.Provider value={permissionRuntime(permissionAllowed)}>
          <CrudTable
            data={permissionRows}
            columns={permissionColumns}
            rowActions={permissionRowActions}
            bulkActions={permissionBulkActions}
            selectedIds={['perm_1']}
            selectable
            emptyTitle="No permission rows"
            columnStateStorageKey="showcase-permission-table"
          />
        </OsirisRuntimeContext.Provider>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="CrudListShell"
        meta="Live sort · filter · select · bulk delete · pagination"
        actions={
          <SavedViewSelector
            views={[
              { id: 'all', label: 'All products' },
              { id: 'active', label: 'Active only' },
              { id: 'low-stock', label: 'Low stock' },
            ]}
            value={savedView}
            onChange={(id) => {
              setSavedView(id);
              appToast.info(`View: ${id}`);
            }}
          />
        }
      >
        <CrudListShell
          search={list.search}
          onSearchChange={list.onSearchChange}
          searchPlaceholder="Search products"
          filters={productFilters}
          values={list.values}
          onFilterChange={list.onFilterChange}
          onReset={list.onReset}
          rows={list.paged}
          columns={productColumns}
          sort={list.sort}
          onSortChange={list.onSortChange}
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          totalPages={list.totalPages}
          onPageChange={list.onPageChange}
          entityLabel="product"
          getRowHref={() => '/showcase'}
          onDeleteRows={(ids) =>
            setRows((current) => current.filter((row) => !ids.includes(row.id)))
          }
          emptyTitle="No products found"
          emptyDescription="Adjust filters or add a product."
        />
      </ShowcaseBlock>
    </div>
  );
}
