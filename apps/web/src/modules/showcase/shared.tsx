import type { ReactNode } from 'react';

import { SectionCard } from '@oktavius/base-ui';

export type ShowcaseSectionId =
  | 'overview'
  | 'foundations'
  | 'inputs'
  | 'forms'
  | 'feedback'
  | 'dialogs'
  | 'data'
  | 'detail-layout'
  | 'workflow'
  | 'documents'
  | 'calendar-charts'
  | 'patterns';

export const SHOWCASE_NAV: Array<{ key: ShowcaseSectionId; label: string; description: string }> = [
  { key: 'overview', label: 'Overview', description: 'How to use this gallery' },
  { key: 'foundations', label: 'Foundations', description: 'Buttons, badges, status, typography' },
  { key: 'inputs', label: 'Inputs', description: 'All control primitives and states' },
  { key: 'forms', label: 'Forms', description: 'EntityForm field registry' },
  { key: 'feedback', label: 'Feedback', description: 'Toasts, banners, empty & loading states' },
  { key: 'dialogs', label: 'Dialogs', description: 'Modals, confirms, menus, wizards' },
  { key: 'data', label: 'Data', description: 'Tables, stats, lists, export' },
  {
    key: 'detail-layout',
    label: 'Detail & layout',
    description: 'DetailView, SplitView, tabs, settings',
  },
  { key: 'workflow', label: 'Workflow', description: 'Tasks, approvals, comments, checklist' },
  { key: 'documents', label: 'Documents', description: 'Preview, templates, attachments' },
  { key: 'calendar-charts', label: 'Calendar & charts', description: 'Scheduling and KPI charts' },
  { key: 'patterns', label: 'ERP patterns', description: 'Kanban, stepper, tree, import' },
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
