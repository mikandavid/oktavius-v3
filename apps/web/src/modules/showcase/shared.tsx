import { SectionCard } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

export type ShowcaseSectionId =
  | 'overview'
  | 'foundations'
  | 'layouts'
  | 'inputs'
  | 'forms'
  | 'feedback'
  | 'errors'
  | 'dialogs'
  | 'data'
  | 'settings'
  | 'responsive-detail'
  | 'detail-layout'
  | 'workflow'
  | 'agent'
  | 'documents'
  | 'calendar-charts'
  | 'patterns'
  | 'comms-ops';

export type ShowcaseGroup = 'Foundations' | 'Components' | 'Patterns' | 'ERP';

export const SHOWCASE_GROUP_ORDER: ShowcaseGroup[] = [
  'Foundations',
  'Components',
  'Patterns',
  'ERP',
];

export const SHOWCASE_NAV: Array<{
  key: ShowcaseSectionId;
  label: string;
  description: string;
  group: ShowcaseGroup;
}> = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'How to use this gallery',
    group: 'Foundations',
  },
  {
    key: 'foundations',
    label: 'Foundations',
    description: 'Buttons, badges, status, typography',
    group: 'Foundations',
  },
  {
    key: 'layouts',
    label: 'Layouts',
    description: 'Layout primitives (Stack, Cluster, Split, Sidebar, Grid) + page templates',
    group: 'Foundations',
  },
  {
    key: 'inputs',
    label: 'Inputs',
    description: 'All control primitives and states',
    group: 'Components',
  },
  { key: 'forms', label: 'Forms', description: 'EntityForm field registry', group: 'Components' },
  {
    key: 'feedback',
    label: 'Feedback',
    description: 'Toasts, banners, empty & loading states',
    group: 'Components',
  },
  {
    key: 'errors',
    label: 'Errors',
    description: 'Module and section error boundaries with retry fallbacks',
    group: 'Components',
  },
  {
    key: 'dialogs',
    label: 'Dialogs',
    description: 'Modals, confirms, menus, wizards',
    group: 'Components',
  },
  { key: 'data', label: 'Data', description: 'Tables, stats, lists, export', group: 'Components' },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Settings page factory and generic catalog blocks',
    group: 'Components',
  },
  {
    key: 'responsive-detail',
    label: 'Responsive detail',
    description: 'URL-backed master-detail layouts that collapse below md',
    group: 'Patterns',
  },
  {
    key: 'detail-layout',
    label: 'Detail & layout',
    description: 'DetailView, SplitView, tabs, settings',
    group: 'Patterns',
  },
  {
    key: 'workflow',
    label: 'Workflow',
    description: 'Tasks, approvals, comments, mentions',
    group: 'Patterns',
  },
  {
    key: 'agent',
    label: 'Agent',
    description: 'Chat shell, message list, result cards, settings',
    group: 'Patterns',
  },
  {
    key: 'documents',
    label: 'Documents',
    description: 'Preview, PDF panel, templates, attachments',
    group: 'Patterns',
  },
  {
    key: 'calendar-charts',
    label: 'Calendar & charts',
    description: 'Scheduling, KPI charts, report builder',
    group: 'Patterns',
  },
  {
    key: 'patterns',
    label: 'ERP patterns',
    description: 'Kanban, stepper, tree, maps, import',
    group: 'ERP',
  },
  {
    key: 'comms-ops',
    label: 'Comms & ops',
    description: 'Time tracking, group chat, knowledge base, doc processing, notifications',
    group: 'ERP',
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
