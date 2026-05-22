import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';

import { BackButton } from './BackButton';
import { PAGE_HEADER_ACTIONS_ROW_WIDE } from './pageChrome';

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  backTo?: string;
};

export function PageLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('min-w-0 max-w-full space-y-4', className)}>{children}</div>;
}

export function ModulePage({
  children,
  layoutClassName,
  ...headerProps
}: PageHeaderProps & { children: ReactNode; layoutClassName?: string }) {
  return (
    <PageLayout className={layoutClassName}>
      <PageHeader {...headerProps} />
      {children}
    </PageLayout>
  );
}

export function PageHeader({ title, subtitle, actions, icon, backTo }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {backTo ? <BackButton to={backTo} label="Back" /> : null}
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-border/60 bg-muted/40 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div> : null}
        </div>
      </div>
      {actions ? <div className={cn(PAGE_HEADER_ACTIONS_ROW_WIDE)}>{actions}</div> : null}
    </div>
  );
}
