import type { ReactNode } from 'react';

import { ModulePage } from '@/components/common/PageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import { accessDeniedPageIcon } from '@/lib/modulePageIcons';

export type AccessDeniedPageProps = {
  /** When false, renders only the empty state (embed inside another shell). */
  fullPage?: boolean;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
};

export function AccessDeniedPage({
  fullPage = true,
  title = 'Access denied',
  subtitle = 'You do not have permission to view this page',
  emptyTitle = 'Insufficient permissions',
  emptyDescription = 'Contact your workspace administrator if you believe you should have access to this area.',
  backTo = '/dashboard',
  backLabel = 'Back to dashboard',
  action,
}: AccessDeniedPageProps) {
  const content = (
    <EmptyState
      title={emptyTitle}
      description={emptyDescription}
      action={
        action ?? (backTo ? <PageHeaderCtaLink to={backTo}>{backLabel}</PageHeaderCtaLink> : null)
      }
    />
  );

  if (!fullPage) return content;

  return (
    <ModulePage title={title} subtitle={subtitle} icon={accessDeniedPageIcon()}>
      {content}
    </ModulePage>
  );
}
