import { useLocation } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';
import { notFoundPageIcon } from '@/lib/modulePageIcons';

export function AppNotFoundPage() {
  const location = useLocation();

  return (
    <ModulePage
      title="Page not found"
      subtitle="This page is not available in the current workspace"
      icon={notFoundPageIcon()}
    >
      <EmptyState
        title="This area is no longer installed"
        description={`${location.pathname} is not part of the current app configuration.`}
        action={<PageHeaderCtaLink to="/dashboard">Back to dashboard</PageHeaderCtaLink>}
      />
    </ModulePage>
  );
}
