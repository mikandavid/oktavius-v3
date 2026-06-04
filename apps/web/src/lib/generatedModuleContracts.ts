import type { GeneratedModuleContract } from './generatedModuleContract';

type GeneratedModuleTemplateListDescriptor = {
  defaultSort: string;
  searchKeys: string[];
  filterKeys?: string[];
  filters?: GeneratedModuleTemplateFilterDescriptor[];
  savedViews?: GeneratedModuleTemplateSavedViewDescriptor[];
  rowActions?: GeneratedModuleTemplateListActionDescriptor[];
  bulkActions?: GeneratedModuleTemplateListActionDescriptor[];
  columns?: GeneratedModuleTemplateColumnDescriptor[];
  title?: string;
  searchPlaceholder?: string;
  entityLabel?: string;
  exportFileName?: string;
  emptyTitle?: string;
};

type GeneratedModuleTemplateFilterDescriptor = {
  key: string;
  label: string;
  options: string[];
};

type GeneratedModuleTemplateSavedViewDescriptor = {
  id: string;
  label: string;
  filters: Record<string, string>;
  isDefault?: boolean;
};

type GeneratedModuleTemplateListActionDescriptor = {
  key: string;
  label: string;
  destructive?: boolean;
  confirmTitle?: string;
  actionLabel?: string;
};

type GeneratedModuleTemplateColumnDescriptor = {
  key: string;
  header: string;
  sortable?: boolean;
  type?: 'badge' | 'currency' | 'date' | 'datetime' | 'text';
  align?: 'left' | 'right' | 'center';
  hideBelow?: 'sm' | 'md' | 'lg';
};

type GeneratedModuleTemplateFieldDescriptor = {
  name: string;
  label: string;
  type:
    | 'checkbox'
    | 'combobox'
    | 'country'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'decimal'
    | 'email'
    | 'number'
    | 'phone'
    | 'relation'
    | 'select'
    | 'tags'
    | 'text'
    | 'textarea'
    | 'url'
    | 'vocabulary';
  required?: boolean;
  section?: string;
  options?: string[];
  vocabulary?: string;
  currencySymbol?: string;
  importance?: 'primary' | 'meta';
  inlineEditable?: boolean;
};

type GeneratedModuleTemplateDetailDescriptor = {
  tabKeys?: string[];
  relatedRecordKeys?: string[];
  fields?: GeneratedModuleTemplateFieldDescriptor[];
};

type GeneratedModuleTemplateApiResource =
  | 'cases'
  | 'clients'
  | 'contracts'
  | 'incidents'
  | 'invoices'
  | 'orders'
  | 'organizations'
  | 'products'
  | 'projects'
  | 'users';

export type GeneratedModuleTemplateDescriptor = {
  moduleId: GeneratedModuleContract['moduleId'];
  basePath: string;
  apiResource: GeneratedModuleTemplateApiResource;
  list?: GeneratedModuleTemplateListDescriptor;
  forms?: Array<'create' | 'edit'>;
  formFields?: GeneratedModuleTemplateFieldDescriptor[];
  detail?: GeneratedModuleTemplateDetailDescriptor;
};

export const GENERATED_CRUD_MODULE_IDS = [
  'clients',
  'products',
  'cases',
  'users',
  'orders',
  'invoices',
  'contracts',
  'incidents',
  'projects',
  'superadmin',
] as const satisfies readonly GeneratedModuleContract['moduleId'][];

export function emitGeneratedModuleContract(
  descriptor: GeneratedModuleTemplateDescriptor,
): GeneratedModuleContract {
  const filterKeys =
    descriptor.list?.filters?.map((filter) => filter.key) ?? descriptor.list?.filterKeys ?? [];

  return {
    moduleId: descriptor.moduleId,
    basePath: descriptor.basePath,
    ...(descriptor.list
      ? {
          list: {
            usesStandardCrudListPage: true,
            loadRows: true,
            defaultSort: descriptor.list.defaultSort,
            searchKeys: descriptor.list.searchKeys,
            filters: filterKeys.map((key) => ({ key })),
            filterKeys,
          },
        }
      : {}),
    ...(descriptor.forms
      ? {
          forms: Object.fromEntries(
            descriptor.forms.map((form) => [
              form,
              { usesEntityForm: true, usesSubmitApiForm: true },
            ]),
          ) as GeneratedModuleContract['forms'],
        }
      : {}),
    ...(descriptor.detail
      ? {
          detail: {
            usesPermissionedHeaderActions: true,
            tabKeys: descriptor.detail.tabKeys,
            relatedRecords: descriptor.detail.relatedRecordKeys?.map((key) => ({
              key,
              usesGeneratedConfig: true,
            })),
          },
        }
      : {}),
  };
}

export function emitGeneratedModuleContracts(
  descriptors: readonly GeneratedModuleTemplateDescriptor[],
): GeneratedModuleContract[] {
  return descriptors.map((descriptor) => emitGeneratedModuleContract(descriptor));
}

export const GENERATED_MODULE_TEMPLATE_DESCRIPTORS: GeneratedModuleTemplateDescriptor[] = [
  {
    moduleId: 'clients',
    basePath: '/clients',
    apiResource: 'clients',
    list: {
      title: 'Clients',
      defaultSort: 'name',
      searchKeys: ['name', 'email', 'company', 'phone', 'city'],
      filterKeys: ['status', 'city'],
      filters: [
        { key: 'status', label: 'Status', options: ['active', 'inactive', 'prospect', 'churned'] },
        { key: 'type', label: 'Type', options: ['company', 'individual'] },
      ],
      savedViews: [
        { id: 'all', label: 'All clients', isDefault: true, filters: { status: '', type: '' } },
        { id: 'active', label: 'Active accounts', filters: { status: 'active', type: '' } },
        { id: 'prospects', label: 'Prospects', filters: { status: 'prospect', type: '' } },
        { id: 'companies', label: 'Companies only', filters: { status: '', type: 'company' } },
      ],
      columns: [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'type', header: 'Type', sortable: true, type: 'badge', hideBelow: 'md' },
        { key: 'industry', header: 'Industry', sortable: true, hideBelow: 'lg' },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'city', header: 'City', sortable: true, hideBelow: 'md' },
        { key: 'accountManager', header: 'Account manager', sortable: true, hideBelow: 'lg' },
        {
          key: 'contractEnd',
          header: 'Contract end',
          sortable: true,
          type: 'date',
          hideBelow: 'lg',
        },
      ],
      searchPlaceholder: 'Search clients',
      entityLabel: 'client',
      exportFileName: 'clients',
      emptyTitle: 'No clients found',
    },
    forms: ['create', 'edit'],
    formFields: [
      { name: 'name', label: 'Company / name', type: 'text', required: true, section: 'Profile' },
      {
        name: 'type',
        label: 'Type',
        type: 'vocabulary',
        vocabulary: 'clientType',
        section: 'Profile',
      },
      { name: 'industry', label: 'Industry', type: 'text', section: 'Profile' },
      {
        name: 'status',
        label: 'Status',
        type: 'vocabulary',
        vocabulary: 'clientStatus',
        section: 'Profile',
      },
      { name: 'email', label: 'Email', type: 'email', section: 'Contact' },
      { name: 'phone', label: 'Phone', type: 'phone', section: 'Contact' },
      { name: 'website', label: 'Website', type: 'url', section: 'Contact' },
      { name: 'country', label: 'Country', type: 'country', section: 'Address' },
      { name: 'city', label: 'City', type: 'text', section: 'Address' },
      { name: 'accountManager', label: 'Account manager', type: 'text', section: 'Commercial' },
      {
        name: 'annualRevenue',
        label: 'Annual revenue',
        type: 'currency',
        currencySymbol: '€',
        section: 'Commercial',
      },
      { name: 'contractStart', label: 'Contract start', type: 'date', section: 'Commercial' },
      { name: 'contractEnd', label: 'Contract end', type: 'date', section: 'Commercial' },
      { name: 'tags', label: 'Tags', type: 'tags', section: 'Notes' },
      { name: 'notes', label: 'Notes', type: 'textarea', section: 'Notes' },
    ],
    detail: {
      tabKeys: ['overview', 'contacts', 'commercial', 'activity', 'files', 'assistant'],
      relatedRecordKeys: ['contacts', 'orders', 'contracts', 'tasks'],
      fields: [
        { name: 'name', label: 'Name', type: 'text', importance: 'primary', inlineEditable: true },
        { name: 'type', label: 'Type', type: 'text', section: 'Profile' },
        { name: 'status', label: 'Status', type: 'select', section: 'Profile' },
        {
          name: 'industry',
          label: 'Industry',
          type: 'text',
          section: 'Profile',
          inlineEditable: true,
        },
        {
          name: 'accountManager',
          label: 'Account manager',
          type: 'relation',
          section: 'Commercial',
          inlineEditable: true,
        },
        { name: 'email', label: 'Email', type: 'email', section: 'Contact', inlineEditable: true },
        { name: 'phone', label: 'Phone', type: 'phone', section: 'Contact', inlineEditable: true },
        {
          name: 'website',
          label: 'Website',
          type: 'url',
          section: 'Contact',
          inlineEditable: true,
        },
        { name: 'city', label: 'City', type: 'text', section: 'Location', inlineEditable: true },
        {
          name: 'country',
          label: 'Country',
          type: 'country',
          section: 'Location',
          inlineEditable: true,
        },
      ],
    },
  },
  {
    moduleId: 'products',
    basePath: '/products',
    apiResource: 'products',
    list: {
      title: 'Products',
      defaultSort: 'name',
      searchKeys: ['name', 'category', 'sku'],
      filterKeys: ['category', 'status'],
      filters: [
        { key: 'status', label: 'Status', options: ['Active', 'Discontinued', 'Draft'] },
        { key: 'category', label: 'Category', options: ['Licenses', 'Services', 'Hardware'] },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All products',
          isDefault: true,
          filters: { status: '', category: '' },
        },
        { id: 'active', label: 'Active', filters: { status: 'Active', category: '' } },
        { id: 'licenses', label: 'Licenses', filters: { status: '', category: 'Licenses' } },
        { id: 'services', label: 'Services', filters: { status: '', category: 'Services' } },
      ],
      rowActions: [{ key: 'duplicate', label: 'Duplicate' }],
      bulkActions: [
        {
          key: 'archive',
          label: 'Archive selected',
          destructive: true,
          confirmTitle: 'Archive selected products?',
        },
      ],
      columns: [
        { key: 'sku', header: 'SKU', sortable: true, hideBelow: 'md' },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'category', header: 'Category', sortable: true, type: 'badge', hideBelow: 'md' },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'price', header: 'Price', sortable: true, type: 'currency', align: 'right' },
        { key: 'stock', header: 'Stock', sortable: true, align: 'right', hideBelow: 'lg' },
        { key: 'unit', header: 'Unit', sortable: true, hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search products',
      entityLabel: 'product',
      exportFileName: 'products',
      emptyTitle: 'No products found',
    },
    forms: ['create', 'edit'],
    formFields: [
      { name: 'sku', label: 'SKU', type: 'text', required: true, section: 'Product' },
      { name: 'name', label: 'Name', type: 'text', required: true, section: 'Product' },
      {
        name: 'category',
        label: 'Category',
        type: 'combobox',
        options: ['Licenses', 'Services', 'Hardware'],
        section: 'Product',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'combobox',
        options: ['Active', 'Discontinued', 'Draft'],
        section: 'Product',
      },
      { name: 'unit', label: 'Unit', type: 'text', section: 'Inventory' },
      { name: 'stock', label: 'Stock', type: 'number', section: 'Inventory' },
      { name: 'price', label: 'Price', type: 'currency', currencySymbol: '€', section: 'Pricing' },
      { name: 'currency', label: 'Currency', type: 'text', section: 'Pricing' },
    ],
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        { name: 'name', label: 'Name', type: 'text', importance: 'primary', inlineEditable: true },
        { name: 'sku', label: 'SKU', type: 'text', section: 'Product', inlineEditable: true },
        {
          name: 'category',
          label: 'Category',
          type: 'text',
          section: 'Product',
          inlineEditable: true,
        },
        { name: 'status', label: 'Status', type: 'select', section: 'Product' },
        {
          name: 'price',
          label: 'Price',
          type: 'currency',
          section: 'Pricing',
          inlineEditable: true,
        },
        {
          name: 'currency',
          label: 'Currency',
          type: 'text',
          section: 'Pricing',
          inlineEditable: true,
        },
        {
          name: 'stock',
          label: 'Stock',
          type: 'number',
          section: 'Inventory',
          inlineEditable: true,
        },
        { name: 'unit', label: 'Unit', type: 'text', section: 'Inventory', inlineEditable: true },
      ],
    },
  },
  {
    moduleId: 'cases',
    basePath: '/cases',
    apiResource: 'cases',
    list: {
      title: 'Cases',
      defaultSort: 'openedAt',
      searchKeys: ['title', 'clientName', 'caseNumber'],
      filterKeys: ['stage', 'type', 'owner'],
      filters: [
        { key: 'type', label: 'Type', options: ['Support', 'Legal', 'Billing', 'Onboarding'] },
        {
          key: 'stage',
          label: 'Stage',
          options: ['Intake', 'Investigation', 'Resolution', 'Closed'],
        },
        { key: 'priority', label: 'Priority', options: ['Low', 'Normal', 'High', 'Critical'] },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All cases',
          isDefault: true,
          filters: { type: '', stage: '', priority: '' },
        },
        { id: 'open', label: 'Open', filters: { type: '', stage: 'Intake', priority: '' } },
        {
          id: 'critical',
          label: 'Critical',
          filters: { type: '', stage: '', priority: 'Critical' },
        },
        { id: 'billing', label: 'Billing', filters: { type: 'Billing', stage: '', priority: '' } },
      ],
      columns: [
        { key: 'caseNumber', header: 'Case #', sortable: true },
        { key: 'title', header: 'Title', sortable: true },
        { key: 'type', header: 'Type', sortable: true, type: 'badge', hideBelow: 'lg' },
        { key: 'stage', header: 'Stage', sortable: true, type: 'badge' },
        { key: 'clientName', header: 'Client', sortable: true, hideBelow: 'md' },
        { key: 'assignee', header: 'Assignee', sortable: true, hideBelow: 'lg' },
        { key: 'dueAt', header: 'Due', sortable: true, type: 'date', hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search cases',
      entityLabel: 'case',
      exportFileName: 'cases',
      emptyTitle: 'No cases found',
    },
    forms: ['create', 'edit'],
    formFields: [
      { name: 'title', label: 'Title', type: 'text', required: true, section: 'Case' },
      { name: 'type', label: 'Type', type: 'select', section: 'Case' },
      { name: 'stage', label: 'Stage', type: 'select', section: 'Status' },
      { name: 'priority', label: 'Priority', type: 'select', section: 'Status' },
      { name: 'clientName', label: 'Client', type: 'relation', section: 'Parties' },
      { name: 'assignee', label: 'Assignee', type: 'relation', section: 'Assignment' },
      { name: 'dueAt', label: 'Due', type: 'date', section: 'Timeline' },
      { name: 'summary', label: 'Summary', type: 'textarea', section: 'Summary' },
    ],
    detail: {
      tabKeys: ['overview', 'workflow', 'comments', 'activity', 'files', 'assistant'],
      relatedRecordKeys: ['parties'],
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        { name: 'caseNumber', label: 'Case number', type: 'text', section: 'Identification' },
        {
          name: 'clientName',
          label: 'Client',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        {
          name: 'assignee',
          label: 'Assignee',
          type: 'relation',
          section: 'Assignment',
          inlineEditable: true,
        },
        { name: 'type', label: 'Type', type: 'select', section: 'Status' },
        { name: 'stage', label: 'Stage', type: 'select', section: 'Status' },
        { name: 'priority', label: 'Priority', type: 'select', section: 'Status' },
        { name: 'slaStatus', label: 'SLA', type: 'select', section: 'Status' },
        { name: 'openedAt', label: 'Opened', type: 'date', section: 'Timeline' },
        { name: 'dueAt', label: 'Due', type: 'date', section: 'Timeline' },
        {
          name: 'summary',
          label: 'Summary',
          type: 'textarea',
          section: 'Summary',
          importance: 'meta',
          inlineEditable: true,
        },
      ],
    },
  },
  {
    moduleId: 'users',
    basePath: '/users',
    apiResource: 'users',
    list: {
      title: 'Users',
      defaultSort: 'name',
      searchKeys: ['name', 'email', 'role'],
      filterKeys: ['role', 'status'],
      filters: [
        { key: 'role', label: 'Role', options: ['Admin', 'Manager', 'Member'] },
        { key: 'status', label: 'Status', options: ['Active', 'Pending', 'Suspended'] },
      ],
      savedViews: [
        { id: 'all', label: 'All users', isDefault: true, filters: { role: '', status: '' } },
        { id: 'active', label: 'Active', filters: { role: '', status: 'Active' } },
        { id: 'admins', label: 'Admins', filters: { role: 'Admin', status: '' } },
        { id: 'pending', label: 'Pending', filters: { role: '', status: 'Pending' } },
      ],
      columns: [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true, hideBelow: 'md' },
        { key: 'role', header: 'Role', sortable: true, type: 'badge', hideBelow: 'lg' },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'team', header: 'Team', sortable: true, hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search users',
      entityLabel: 'user',
      exportFileName: 'users',
      emptyTitle: 'No users found',
    },
    forms: ['create', 'edit'],
    formFields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, section: 'Profile' },
      { name: 'email', label: 'Email', type: 'email', required: true, section: 'Profile' },
      {
        name: 'role',
        label: 'Role',
        type: 'combobox',
        options: ['Admin', 'Manager', 'Member'],
        section: 'Access',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'combobox',
        options: ['Active', 'Pending', 'Suspended'],
        section: 'Access',
      },
      { name: 'team', label: 'Team', type: 'text', section: 'Organization' },
    ],
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        {
          name: 'name',
          label: 'Full name',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        { name: 'email', label: 'Email', type: 'email', section: 'Contact', inlineEditable: true },
        {
          name: 'team',
          label: 'Team',
          type: 'text',
          section: 'Organization',
          inlineEditable: true,
        },
        { name: 'role', label: 'Role', type: 'select', section: 'Access' },
        { name: 'status', label: 'Status', type: 'select', section: 'Access' },
        {
          name: 'isSuperadmin',
          label: 'Platform admin',
          type: 'checkbox',
          section: 'Access',
          importance: 'meta',
        },
      ],
    },
  },
  {
    moduleId: 'orders',
    basePath: '/orders',
    apiResource: 'orders',
    list: {
      title: 'Orders',
      defaultSort: 'createdAt',
      searchKeys: ['orderNumber', 'clientName', 'status'],
      filterKeys: ['status'],
      filters: [
        {
          key: 'status',
          label: 'Status',
          options: ['Draft', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
        },
        { key: 'owner', label: 'Owner', options: ['Anna Hofer', 'Markus Leitner', 'Nina Weiss'] },
        {
          key: 'clientName',
          label: 'Client',
          options: [
            'Apex Technologies GmbH',
            'Bruckner Consulting',
            'Donau Logistics AG',
            'Clara Sonnenschein',
          ],
        },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All orders',
          isDefault: true,
          filters: { status: '', owner: '', clientName: '' },
        },
        {
          id: 'open',
          label: 'Confirmed',
          filters: { status: 'Confirmed', owner: '', clientName: '' },
        },
        {
          id: 'shipped',
          label: 'Shipped',
          filters: { status: 'Shipped', owner: '', clientName: '' },
        },
      ],
      columns: [
        { key: 'orderNumber', header: 'Order', sortable: true },
        { key: 'clientName', header: 'Client', sortable: true },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'total', header: 'Total', sortable: true, type: 'currency', align: 'right' },
        { key: 'orderDate', header: 'Order date', sortable: true, type: 'date', hideBelow: 'md' },
        { key: 'dueDate', header: 'Due date', sortable: true, type: 'date', hideBelow: 'lg' },
        { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'lg' },
        { key: 'lineCount', header: 'Lines', sortable: true, hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search orders',
      entityLabel: 'order',
      exportFileName: 'orders',
      emptyTitle: 'No orders found',
    },
    detail: {
      tabKeys: ['overview', 'lines', 'tasks', 'activity', 'files', 'assistant'],
      relatedRecordKeys: ['lines', 'tasks'],
      fields: [
        {
          name: 'orderNumber',
          label: 'Order number',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        {
          name: 'clientName',
          label: 'Client',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        {
          name: 'owner',
          label: 'Owner',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        { name: 'status', label: 'Status', type: 'select', section: 'Order' },
        {
          name: 'total',
          label: 'Total',
          type: 'currency',
          section: 'Commercial',
          inlineEditable: true,
        },
        {
          name: 'lineCount',
          label: 'Line items',
          type: 'number',
          section: 'Commercial',
          importance: 'meta',
        },
        { name: 'orderDate', label: 'Order date', type: 'date', section: 'Timeline' },
        { name: 'dueDate', label: 'Due date', type: 'date', section: 'Timeline' },
      ],
    },
  },
  {
    moduleId: 'invoices',
    basePath: '/invoices',
    apiResource: 'invoices',
    list: {
      title: 'Invoices',
      defaultSort: 'issuedAt',
      searchKeys: ['invoiceNumber', 'clientName', 'status'],
      filterKeys: ['status'],
      filters: [
        {
          key: 'status',
          label: 'Status',
          options: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
        },
        {
          key: 'clientName',
          label: 'Client',
          options: [
            'Apex Technologies GmbH',
            'Bruckner Consulting',
            'Donau Logistics AG',
            'Clara Sonnenschein',
          ],
        },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All invoices',
          isDefault: true,
          filters: { status: '', clientName: '' },
        },
        { id: 'overdue', label: 'Overdue', filters: { status: 'Overdue', clientName: '' } },
        { id: 'unpaid', label: 'Sent', filters: { status: 'Sent', clientName: '' } },
        { id: 'paid', label: 'Paid', filters: { status: 'Paid', clientName: '' } },
      ],
      columns: [
        { key: 'invoiceNumber', header: 'Invoice', sortable: true },
        { key: 'clientName', header: 'Client', sortable: true },
        { key: 'orderNumber', header: 'Order', sortable: true, hideBelow: 'md' },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'amount', header: 'Amount', sortable: true, type: 'currency', align: 'right' },
        { key: 'issuedAt', header: 'Issued', sortable: true, type: 'date', hideBelow: 'md' },
        { key: 'dueAt', header: 'Due', sortable: true, type: 'date', hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search invoices',
      entityLabel: 'invoice',
      exportFileName: 'invoices',
      emptyTitle: 'No invoices found',
    },
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        {
          name: 'invoiceNumber',
          label: 'Invoice number',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        {
          name: 'clientName',
          label: 'Client',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        {
          name: 'orderNumber',
          label: 'Order',
          type: 'relation',
          section: 'References',
          inlineEditable: true,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          section: 'Payment',
          inlineEditable: true,
        },
        {
          name: 'amount',
          label: 'Amount',
          type: 'currency',
          section: 'Payment',
          inlineEditable: true,
        },
        {
          name: 'issuedAt',
          label: 'Issued',
          type: 'date',
          section: 'Timeline',
          inlineEditable: true,
        },
        { name: 'dueAt', label: 'Due', type: 'date', section: 'Timeline', inlineEditable: true },
      ],
    },
  },
  {
    moduleId: 'contracts',
    basePath: '/contracts',
    apiResource: 'contracts',
    list: {
      title: 'Contracts',
      defaultSort: 'signedAt',
      searchKeys: ['contractNumber', 'clientName', 'status'],
      filterKeys: ['status'],
      filters: [
        { key: 'status', label: 'Status', options: ['Draft', 'Active', 'Expiring', 'Terminated'] },
        {
          key: 'clientName',
          label: 'Client',
          options: ['Apex Technologies GmbH', 'Bruckner Consulting', 'Donau Logistics AG'],
        },
        { key: 'owner', label: 'Owner', options: ['Anna Hofer', 'Markus Leitner', 'Nina Weiss'] },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All contracts',
          isDefault: true,
          filters: { status: '', clientName: '', owner: '' },
        },
        { id: 'active', label: 'Active', filters: { status: 'Active', clientName: '', owner: '' } },
        {
          id: 'expiring',
          label: 'Expiring',
          filters: { status: 'Expiring', clientName: '', owner: '' },
        },
      ],
      columns: [
        { key: 'contractNumber', header: 'Number', sortable: true },
        { key: 'title', header: 'Title', sortable: true },
        { key: 'clientName', header: 'Client', sortable: true },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'value', header: 'Value', sortable: true, type: 'currency', align: 'right' },
        { key: 'startDate', header: 'Start', sortable: true, type: 'date', hideBelow: 'md' },
        { key: 'endDate', header: 'End', sortable: true, type: 'date', hideBelow: 'lg' },
        { key: 'owner', header: 'Owner', sortable: true, hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search contracts',
      entityLabel: 'contract',
      exportFileName: 'contracts',
      emptyTitle: 'No contracts found',
    },
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        {
          name: 'contractNumber',
          label: 'Contract number',
          type: 'text',
          section: 'Identification',
          inlineEditable: true,
        },
        {
          name: 'clientName',
          label: 'Client',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        {
          name: 'owner',
          label: 'Owner',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        { name: 'status', label: 'Status', type: 'select', section: 'Terms' },
        {
          name: 'value',
          label: 'Contract value',
          type: 'currency',
          section: 'Terms',
          inlineEditable: true,
        },
        { name: 'startDate', label: 'Start date', type: 'date', section: 'Timeline' },
        { name: 'endDate', label: 'End date', type: 'date', section: 'Timeline' },
        {
          name: 'renewalNoticeDays',
          label: 'Renewal notice',
          type: 'number',
          section: 'Terms',
          importance: 'meta',
        },
      ],
    },
  },
  {
    moduleId: 'incidents',
    basePath: '/incidents',
    apiResource: 'incidents',
    list: {
      title: 'Incidents',
      defaultSort: 'reportedAt',
      searchKeys: ['title', 'reporterName', 'status'],
      filterKeys: ['status', 'severity'],
      filters: [
        { key: 'severity', label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'] },
        {
          key: 'status',
          label: 'Status',
          options: ['Open', 'Investigating', 'Mitigated', 'Resolved'],
        },
        { key: 'service', label: 'Service', options: ['Public API', 'Notifications', 'Reporting'] },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All incidents',
          isDefault: true,
          filters: { severity: '', status: '', service: '' },
        },
        { id: 'open', label: 'Open', filters: { severity: '', status: 'Open', service: '' } },
        {
          id: 'critical',
          label: 'Critical',
          filters: { severity: 'Critical', status: '', service: '' },
        },
      ],
      columns: [
        { key: 'incidentNumber', header: 'Number', sortable: true },
        { key: 'title', header: 'Title', sortable: true },
        { key: 'severity', header: 'Severity', sortable: true, type: 'badge' },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'service', header: 'Service', sortable: true, hideBelow: 'md' },
        { key: 'assignee', header: 'Assignee', sortable: true, hideBelow: 'md' },
        { key: 'reportedAt', header: 'Reported', sortable: true, type: 'date', hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search incidents',
      entityLabel: 'incident',
      exportFileName: 'incidents',
      emptyTitle: 'No incidents found',
    },
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        {
          name: 'incidentNumber',
          label: 'Incident number',
          type: 'text',
          section: 'Identification',
          inlineEditable: true,
        },
        {
          name: 'severity',
          label: 'Severity',
          type: 'select',
          section: 'Status',
          inlineEditable: true,
        },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          section: 'Status',
          inlineEditable: true,
        },
        {
          name: 'service',
          label: 'Service',
          type: 'text',
          section: 'Assignment',
          inlineEditable: true,
        },
        {
          name: 'assignee',
          label: 'Assignee',
          type: 'relation',
          section: 'Assignment',
          inlineEditable: true,
        },
        {
          name: 'reportedAt',
          label: 'Reported at',
          type: 'datetime',
          section: 'Timeline',
          inlineEditable: true,
        },
        {
          name: 'impact',
          label: 'Impact',
          type: 'textarea',
          section: 'Impact',
          importance: 'meta',
          inlineEditable: true,
        },
      ],
    },
  },
  {
    moduleId: 'projects',
    basePath: '/projects',
    apiResource: 'projects',
    list: {
      title: 'Projects',
      defaultSort: 'updatedAt',
      searchKeys: ['name', 'clientName', 'status'],
      filterKeys: ['status'],
      filters: [
        { key: 'status', label: 'Status', options: ['Planning', 'Active', 'On hold', 'Completed'] },
        {
          key: 'manager',
          label: 'Manager',
          options: ['Anna Hofer', 'Markus Leitner', 'Nina Weiss'],
        },
        {
          key: 'clientName',
          label: 'Client',
          options: ['Apex Technologies GmbH', 'Bruckner Consulting', 'Donau Logistics AG'],
        },
      ],
      savedViews: [
        {
          id: 'all',
          label: 'All projects',
          isDefault: true,
          filters: { status: '', manager: '', clientName: '' },
        },
        {
          id: 'active',
          label: 'Active',
          filters: { status: 'Active', manager: '', clientName: '' },
        },
        {
          id: 'planning',
          label: 'Planning',
          filters: { status: 'Planning', manager: '', clientName: '' },
        },
      ],
      columns: [
        { key: 'name', header: 'Project', sortable: true },
        { key: 'clientName', header: 'Client', sortable: true },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        { key: 'manager', header: 'Manager', sortable: true, hideBelow: 'md' },
        {
          key: 'budget',
          header: 'Budget',
          sortable: true,
          type: 'currency',
          align: 'right',
          hideBelow: 'md',
        },
        { key: 'completion', header: 'Completion', sortable: true, hideBelow: 'lg' },
        { key: 'startDate', header: 'Start', sortable: true, type: 'date', hideBelow: 'lg' },
        { key: 'endDate', header: 'End', sortable: true, type: 'date', hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search projects',
      entityLabel: 'project',
      exportFileName: 'projects',
      emptyTitle: 'No projects found',
    },
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        {
          name: 'name',
          label: 'Project name',
          type: 'text',
          importance: 'primary',
          inlineEditable: true,
        },
        {
          name: 'clientName',
          label: 'Client',
          type: 'relation',
          section: 'Parties',
          inlineEditable: true,
        },
        {
          name: 'manager',
          label: 'Manager',
          type: 'text',
          section: 'Assignment',
          inlineEditable: true,
        },
        { name: 'status', label: 'Status', type: 'select', section: 'Project' },
        {
          name: 'budget',
          label: 'Budget',
          type: 'currency',
          section: 'Commercial',
          inlineEditable: true,
        },
        {
          name: 'completion',
          label: 'Completion',
          type: 'number',
          section: 'Progress',
          importance: 'meta',
        },
        { name: 'timeline', label: 'Timeline', type: 'date', section: 'Timeline' },
      ],
    },
  },
  {
    moduleId: 'superadmin',
    basePath: '/superadmin',
    apiResource: 'organizations',
    list: {
      title: 'Organizations',
      defaultSort: 'name',
      searchKeys: ['name', 'slug', 'billingEmail'],
      filterKeys: ['status'],
      filters: [
        { key: 'plan', label: 'Plan', options: ['Starter', 'Professional', 'Enterprise'] },
        { key: 'status', label: 'Status', options: ['Active', 'Trial', 'Suspended', 'Churned'] },
        { key: 'environment', label: 'Environment', options: ['Production', 'Sandbox', 'Trial'] },
      ],
      columns: [
        { key: 'name', header: 'Organization', sortable: true },
        { key: 'slug', header: 'Slug', sortable: true, hideBelow: 'md' },
        { key: 'plan', header: 'Plan', sortable: true, type: 'badge' },
        { key: 'status', header: 'Status', sortable: true, type: 'badge' },
        {
          key: 'environment',
          header: 'Environment',
          sortable: true,
          type: 'badge',
          hideBelow: 'lg',
        },
        { key: 'region', header: 'Region', sortable: true, hideBelow: 'lg' },
        { key: 'memberCount', header: 'Members', sortable: true, hideBelow: 'md' },
        { key: 'createdAt', header: 'Created', sortable: true, type: 'date', hideBelow: 'lg' },
      ],
      searchPlaceholder: 'Search organizations',
      entityLabel: 'organization',
      exportFileName: 'organizations',
      emptyTitle: 'No organizations found',
    },
    forms: ['create'],
    formFields: [
      {
        name: 'name',
        label: 'Organization name',
        type: 'text',
        required: true,
        section: 'Profile',
      },
      { name: 'slug', label: 'Slug', type: 'text', required: true, section: 'Profile' },
      {
        name: 'plan',
        label: 'Plan',
        type: 'combobox',
        options: ['Starter', 'Professional', 'Enterprise'],
        section: 'Subscription',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'combobox',
        options: ['Active', 'Trial', 'Suspended', 'Churned'],
        section: 'Subscription',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'combobox',
        options: ['Production', 'Sandbox', 'Trial'],
        section: 'Subscription',
      },
      { name: 'region', label: 'Region', type: 'text', section: 'Operations' },
      { name: 'billingEmail', label: 'Billing email', type: 'email', section: 'Billing' },
      { name: 'ownerName', label: 'Owner', type: 'text', section: 'Ownership' },
    ],
    detail: {
      tabKeys: ['overview', 'activity', 'files', 'assistant'],
      fields: [
        { name: 'name', label: 'Name', type: 'text', importance: 'primary', inlineEditable: true },
        { name: 'slug', label: 'Slug', type: 'text', section: 'Profile', inlineEditable: true },
        {
          name: 'region',
          label: 'Region',
          type: 'text',
          section: 'Operations',
          inlineEditable: true,
        },
        { name: 'plan', label: 'Plan', type: 'select', section: 'Subscription' },
        { name: 'status', label: 'Status', type: 'select', section: 'Subscription' },
        { name: 'environment', label: 'Environment', type: 'select', section: 'Subscription' },
        {
          name: 'billingEmail',
          label: 'Billing email',
          type: 'email',
          section: 'Billing',
          inlineEditable: true,
        },
        {
          name: 'ownerName',
          label: 'Owner',
          type: 'text',
          section: 'Ownership',
          inlineEditable: true,
        },
        {
          name: 'memberCount',
          label: 'Members',
          type: 'number',
          section: 'Ownership',
          importance: 'meta',
        },
        { name: 'createdAt', label: 'Created', type: 'date', importance: 'meta' },
      ],
    },
  },
];

export const GENERATED_MODULE_CONTRACTS = emitGeneratedModuleContracts(
  GENERATED_MODULE_TEMPLATE_DESCRIPTORS,
);
