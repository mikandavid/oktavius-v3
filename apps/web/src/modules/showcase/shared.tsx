import type { ReactNode } from 'react';

import { SectionCard } from '@oktavius/base-ui';

export type ShowcaseSectionId =
  | 'overview'
  | 'design-tokens'
  | 'foundations'
  | 'layouts'
  | 'inputs'
  | 'forms'
  | 'feedback'
  | 'errors'
  | 'dialogs'
  | 'data'
  | 'multi-tenant'
  | 'settings'
  | 'responsive-detail'
  | 'detail-layout'
  | 'workflow'
  | 'agent'
  | 'documents'
  | 'calendar-charts'
  | 'patterns'
  | 'comms-ops';

export const SHOWCASE_NAV: Array<{ key: ShowcaseSectionId; label: string; description: string }> = [
  { key: 'overview', label: 'Overview', description: 'How to use this gallery' },
  {
    key: 'design-tokens',
    label: 'Design tokens',
    description: 'Three-layer color system — neutral ramp, roles, live preview',
  },
  { key: 'foundations', label: 'Foundations', description: 'Buttons, badges, status, typography' },
  {
    key: 'layouts',
    label: 'Layouts',
    description: 'Layout primitives (Stack, Cluster, Split, Sidebar, Grid) + page templates',
  },
  { key: 'inputs', label: 'Inputs', description: 'All control primitives and states' },
  { key: 'forms', label: 'Forms', description: 'EntityForm field registry' },
  { key: 'feedback', label: 'Feedback', description: 'Toasts, banners, empty & loading states' },
  {
    key: 'errors',
    label: 'Errors',
    description: 'Module and section error boundaries with retry fallbacks',
  },
  { key: 'dialogs', label: 'Dialogs', description: 'Modals, confirms, menus, wizards' },
  { key: 'data', label: 'Data', description: 'Tables, stats, lists, export' },
  {
    key: 'multi-tenant',
    label: 'Multi-tenant',
    description: 'Organization and location scoped data views',
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Settings page factory and generic catalog blocks',
  },
  {
    key: 'responsive-detail',
    label: 'Responsive detail',
    description: 'URL-backed master-detail layouts that collapse below md',
  },
  {
    key: 'detail-layout',
    label: 'Detail & layout',
    description: 'DetailView, SplitView, tabs, settings',
  },
  { key: 'workflow', label: 'Workflow', description: 'Tasks, approvals, comments, mentions' },
  { key: 'agent', label: 'Agent', description: 'Chat shell, message list, result cards, settings' },
  {
    key: 'documents',
    label: 'Documents',
    description: 'Preview, PDF panel, templates, attachments',
  },
  {
    key: 'calendar-charts',
    label: 'Calendar & charts',
    description: 'Scheduling, KPI charts, report builder',
  },
  { key: 'patterns', label: 'ERP patterns', description: 'Kanban, stepper, tree, maps, import' },
  {
    key: 'comms-ops',
    label: 'Comms & ops',
    description: 'Time tracking, group chat, knowledge base, doc processing, notifications',
  },
];

export function ShowcaseBlock({
  title,
  meta,
  actions,
  children,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} meta={meta} actions={actions}>
      {children}
    </SectionCard>
  );
}
