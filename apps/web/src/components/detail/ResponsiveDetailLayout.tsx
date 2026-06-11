import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button, SplitView, cn } from '@oktavius/base-ui';
import { parseAsString } from 'nuqs';

import { useMediaQuery } from '@/lib/useMediaQuery';

export type ResponsiveDetailLayoutContext = {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
  isDesktop: boolean;
};

type ResponsiveDetailLayoutProps = {
  master: (context: ResponsiveDetailLayoutContext) => ReactNode;
  detail: (context: ResponsiveDetailLayoutContext) => ReactNode;
  paramKey?: string;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  defaultSelectedId?: string;
  emptyDetail?: ReactNode;
  backLabel?: string;
  className?: string;
  masterClassName?: string;
  detailClassName?: string;
  persistKey?: string;
  defaultSidebarWidth?: number;
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
};

const breakpointQueries = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
};

export function ResponsiveDetailLayout({
  master,
  detail,
  paramKey = 'id',
  breakpoint = 'md',
  defaultSelectedId,
  emptyDetail = null,
  backLabel = 'Back',
  className,
  masterClassName,
  detailClassName,
  persistKey,
  defaultSidebarWidth = 380,
  minSidebarWidth = 300,
  maxSidebarWidth = 680,
}: ResponsiveDetailLayoutProps) {
  const isDesktop = useMediaQuery(breakpointQueries[breakpoint], true);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSelectedId = searchParams.get(paramKey);
  const selectedId = rawSelectedId == null ? null : parseAsString.parse(rawSelectedId);
  const resolvedSelectedId = selectedId ?? defaultSelectedId ?? null;
  const context: ResponsiveDetailLayoutContext = {
    selectedId: resolvedSelectedId,
    select: (id) => {
      const next = new URLSearchParams(searchParams);
      next.set(paramKey, id);
      setSearchParams(next);
    },
    clear: () => {
      const next = new URLSearchParams(searchParams);
      next.delete(paramKey);
      setSearchParams(next);
    },
    isDesktop,
  };

  if (isDesktop) {
    return (
      <SplitView
        className={cn('min-h-[320px] w-full rounded-card bg-card', className)}
        persistKey={persistKey}
        defaultSidebarWidth={defaultSidebarWidth}
        minSidebarWidth={minSidebarWidth}
        maxSidebarWidth={maxSidebarWidth}
        sidebar={<div className={masterClassName}>{master(context)}</div>}
      >
        <div className={cn('min-h-full', detailClassName)}>
          {resolvedSelectedId ? detail(context) : emptyDetail}
        </div>
      </SplitView>
    );
  }

  if (!resolvedSelectedId) {
    return (
      <div className={cn('rounded-card bg-card', className, masterClassName)}>
        {master(context)}
      </div>
    );
  }

  return (
    <div className={cn('rounded-card bg-card', className)}>
      <div className="border-b border-border p-3">
        <Button type="button" size="sm" variant="outline" onClick={context.clear}>
          {backLabel}
        </Button>
      </div>
      <div className={detailClassName}>{detail(context)}</div>
    </div>
  );
}
