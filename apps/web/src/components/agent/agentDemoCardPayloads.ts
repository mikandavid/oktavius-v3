import type { AgentCardPayload } from './types';

export const DEMO_ENTITY_LIST_CARD: AgentCardPayload = {
  kind: 'entity-list',
  title: 'Open tasks',
  total: 3,
  items: [
    {
      id: 'task_1',
      label: 'Send renewal proposal',
      subtitle: 'Due 15.12.2024',
      status: 'Open',
      href: '/tasks/task_1',
    },
    {
      id: 'task_2',
      label: 'UAT sign-off',
      subtitle: 'Due 10.01.2025',
      status: 'In review',
      href: '/tasks/task_2',
    },
    {
      id: 'task_3',
      label: 'Schedule kickoff',
      subtitle: 'Due 20.12.2024',
      status: 'Open',
      href: '/tasks/task_3',
    },
  ],
};

export const DEMO_ENTITY_DETAIL_CARD: AgentCardPayload = {
  kind: 'entity-detail',
  title: 'Apex Technologies',
  subtitle: 'Client · Vienna',
  status: 'Active',
  href: '/dashboard',
  fields: [
    { label: 'Primary contact', value: 'Maria Keller' },
    { label: 'Contract value', value: '€ 48.000 / year' },
    { label: 'Next renewal', value: '15.03.2025' },
    { label: 'Owner', value: 'Sales team' },
  ],
};

export const DEMO_PYTHON_CARD: AgentCardPayload = {
  kind: 'python',
  summary: 'Analyze overdue invoices by client segment',
  status: 'done',
  code: `segments = df.groupby("segment")["amount"].sum()
print(segments.sort_values(ascending=False).head())`,
  output: 'enterprise    128400.00\nmid_market     84200.00\nsmb            31600.00',
};

export const DEMO_DOCUMENT_CARD: AgentCardPayload = {
  kind: 'document',
  title: 'Renewal proposal — Apex Technologies',
  status: 'completed',
  generationId: 'gen_demo_001',
  formats: ['pdf', 'docx'],
};

export const DEMO_SCHEDULE_CARD: AgentCardPayload = {
  kind: 'schedule',
  title: 'Today',
  subtitle: '05.12.2024',
  events: [
    {
      id: 'evt_1',
      title: 'Renewal review with Apex',
      startTime: '2024-12-05T10:00:00Z',
      endTime: '2024-12-05T10:45:00Z',
      type: 'Meeting',
    },
    {
      id: 'evt_2',
      title: 'Send updated proposal',
      startTime: '2024-12-05T14:00:00Z',
      type: 'Task',
    },
  ],
};

export const DEMO_SKILL_APPROVAL_CARD: AgentCardPayload = {
  kind: 'skill-approval',
  id: 'skill_demo_1',
  title: 'Approve CRM enrichment',
  summary: 'The agent wants to enrich Apex Technologies with external firmographic data.',
  skillKey: 'crm.enrich',
  status: 'pending',
  fields: [
    { label: 'Industry', value: 'Software & IT', confidence: 0.92 },
    { label: 'Employees', value: '120–150', confidence: 0.78 },
    { label: 'Revenue band', value: '€10M–€25M', confidence: 0.71, status: 'warning' },
  ],
};

export const DEMO_FINANCIAL_CARD: AgentCardPayload = {
  kind: 'financial',
  title: 'Receivables overview',
  metrics: [
    { label: 'Open invoices', value: '€ 128.400', trend: 'up' },
    { label: 'Overdue', value: '€ 18.200', trend: 'down' },
    { label: 'Collected this month', value: '€ 64.900', trend: 'up' },
  ],
};

export const DEMO_SEARCH_RESULTS_CARD: AgentCardPayload = {
  kind: 'search-results',
  query: 'apex renewal',
  groups: [
    {
      type: 'Clients',
      items: [
        { id: 'c1', title: 'Apex Technologies', subtitle: 'Vienna · Active', href: '/dashboard' },
      ],
    },
    {
      type: 'Tasks',
      items: [
        { id: 't1', title: 'Send renewal proposal', subtitle: 'Due 15.12.2024', href: '/tasks/t1' },
      ],
    },
  ],
};

export const DEMO_TIMELINE_CARD: AgentCardPayload = {
  kind: 'timeline',
  title: 'Document timeline',
  events: [
    { title: 'Proposal generated', timestamp: '2024-12-05T09:15:00Z' },
    { title: 'Sent to client', timestamp: '2024-12-05T10:00:00Z' },
    { title: 'Viewed by client', timestamp: '2024-12-05T14:22:00Z' },
  ],
};

export const DEMO_ACTION_ITEMS_CARD: AgentCardPayload = {
  kind: 'action-items',
  title: 'Dashboard tasks',
  items: [
    {
      id: 'a1',
      title: 'Review overdue invoices',
      priority: 'high',
      dueDate: '2024-12-06T17:00:00Z',
    },
    { id: 'a2', title: 'Approve UAT checklist', priority: 'medium', completed: true },
  ],
};

export const DEMO_ACTIVE_TIMER_CARD: AgentCardPayload = {
  kind: 'active-timer',
  title: 'Billable timer',
  client: 'Apex Technologies',
  project: 'Renewal rollout',
  elapsedSeconds: 3725,
  isRunning: true,
  startedAt: '2024-12-05T08:00:00Z',
};

export const DEMO_MEMORY_CARD: AgentCardPayload = {
  kind: 'memory',
  title: 'Memory matches',
  query: 'renewal preferences',
  entries: [
    {
      id: 'm1',
      title: 'Apex prefers PDF proposals',
      summary: 'Send renewal docs as PDF with 30-day terms.',
      score: 0.91,
    },
  ],
};

export const DEMO_SALES_DOCUMENT_CARD: AgentCardPayload = {
  kind: 'sales-document',
  title: 'Invoice INV-2024-184',
  documentNumber: 'INV-2024-184',
  status: 'Open',
  total: '€ 4.800,00',
  dueDate: '15.01.2025',
  href: '/documents',
};

export const DEMO_DOC_PROCESSING_CARD: AgentCardPayload = {
  kind: 'doc-processing',
  variant: 'result',
  title: 'Invoice extraction',
  documentName: 'apex_invoice.pdf',
  status: 'completed',
  fields: [
    { label: 'Vendor', value: 'Apex Technologies GmbH' },
    { label: 'Amount', value: '€ 4.800,00' },
    { label: 'Due date', value: '15.01.2025' },
  ],
};

export const DEMO_EMAIL_COMPOSE_CARD: AgentCardPayload = {
  kind: 'email-compose',
  to: 'maria.keller@apex.example',
  subject: 'Renewal proposal — Apex Technologies',
  body: 'Hi Maria,\n\nPlease find the updated renewal proposal attached.\n\nBest,\nSales team',
  status: 'draft',
};

export const DEMO_PLANNER_CARD: AgentCardPayload = {
  kind: 'planner',
  title: 'Staff availability',
  date: '2024-12-05T00:00:00Z',
  slots: [
    {
      id: 's1',
      label: 'Maria Keller',
      startTime: '2024-12-05T08:00:00Z',
      endTime: '2024-12-05T12:00:00Z',
      status: 'Assigned',
    },
    {
      id: 's2',
      label: 'Jonas Weber',
      startTime: '2024-12-05T13:00:00Z',
      endTime: '2024-12-05T17:00:00Z',
      status: 'Open',
    },
  ],
};

export const DEMO_PROJECT_SUMMARY_CARD: AgentCardPayload = {
  kind: 'project-summary',
  title: 'Renewal rollout',
  subtitle: 'Apex Technologies',
  status: 'On track',
  metrics: [
    { label: 'Budget used', value: '62%' },
    { label: 'Tasks open', value: '4' },
    { label: 'Hours logged', value: '128 h' },
  ],
  highlights: ['UAT scheduled for 12 Dec', 'Proposal sent to client'],
};

export const DEMO_CATALOG_ITEM_CARD: AgentCardPayload = {
  kind: 'catalog-item',
  title: 'Enterprise support plan',
  sku: 'SUP-ENT-12',
  price: '€ 1.200 / month',
  status: 'Active',
  fields: [
    { label: 'Billing', value: 'Annual' },
    { label: 'Seats', value: 'Unlimited' },
  ],
};

export const DEMO_CONTEXT_DUMP_CARD: AgentCardPayload = {
  kind: 'context-dump',
  title: 'Page context',
  sections: [
    { label: 'Route', content: '/dashboard' },
    { label: 'Selected record', content: 'Apex Technologies (c1)' },
    { label: 'Open tasks', content: '3' },
  ],
};

export const DEMO_DOC_PROCESSING_PROGRESS_CARD: AgentCardPayload = {
  kind: 'doc-processing',
  variant: 'progress',
  title: 'Scanning invoice',
  documentName: 'apex_invoice.pdf',
  status: 'processing',
  progress: 68,
  message: 'Extracting line items…',
};
