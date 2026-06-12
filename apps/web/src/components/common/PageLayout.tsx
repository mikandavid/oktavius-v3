import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { useRegisterFillHeightPage } from '@/components/layout/AppShellLayoutContext';

import { BackButton } from './BackButton';
import { MODULE_PAGE_FILL_CLASS, PAGE_HEADER_ACTIONS_ROW } from './pageChrome';

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  backTo?: string;
};

export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0 max-w-full space-y-4', className)}>{children}</div>;
}

export function ModulePage({
  children,
  layoutClassName,
  fillHeight,
  ...headerProps
}: PageHeaderProps & { children: ReactNode; layoutClassName?: string; fillHeight?: boolean }) {
  const resolvedLayoutClassName =
    layoutClassName ?? (fillHeight ? MODULE_PAGE_FILL_CLASS : undefined);
  const usesFillHeight = Boolean(resolvedLayoutClassName);

  useRegisterFillHeightPage(usesFillHeight);

  return (
    <PageLayout className={cn(!resolvedLayoutClassName && 'space-y-4', resolvedLayoutClassName)}>
      <div className={usesFillHeight ? 'shrink-0' : undefined}>
        <PageHeader {...headerProps} />
      </div>
      {usesFillHeight ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </PageLayout>
  );
}

export function PageHeader({ title, subtitle, actions, icon, backTo }: PageHeaderProps) {
  return (
    <div className="grid shrink-0 grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {backTo ? <BackButton to={backTo} label="Back" /> : null}
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-muted/40 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div> : null}
        </div>
      </div>
      {actions ? <div className={cn(PAGE_HEADER_ACTIONS_ROW)}>{actions}</div> : null}
    </div>
  );
}
