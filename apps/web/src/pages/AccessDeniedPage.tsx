import { Link } from 'react-router-dom';

import { Button, buttonVariants, cn } from '@oktavius/base-ui';

import { EmptyState } from '@/components/common/EmptyState';
import { ModulePage } from '@/components/common/PageLayout';
import { LockIcon } from '@/lib/icons';

type AccessDeniedPageProps = {
  moduleName?: string;
};

export function AccessDeniedPage({ moduleName = 'this module' }: AccessDeniedPageProps) {
  return (
    <ModulePage title="Access denied" subtitle="You do not have permission to view this area.">
      <div className="mx-auto max-w-md pt-8">
        <EmptyState
          title="Insufficient permissions"
          description={`Your role cannot open ${moduleName}. Contact an administrator if you need access.`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/dashboard" className={cn(buttonVariants({ variant: 'cta', size: 'sm' }))}>
                Back to dashboard
              </Link>
              <Button variant="outline" size="sm" type="button">
                Request access
              </Button>
            </div>
          }
        />
        <div className="mt-4 flex justify-center text-muted-foreground/60">
          <LockIcon size={20} />
        </div>
      </div>
    </ModulePage>
  );
}
