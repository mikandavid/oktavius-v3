import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';

type InfoBoxTone = 'neutral' | 'info' | 'success' | 'warning' | 'destructive';

const toneBorder: Record<InfoBoxTone, string> = {
  neutral: 'border-l-border',
  info: 'border-l-info',
  success: 'border-l-success',
  warning: 'border-l-warning',
  destructive: 'border-l-destructive',
};

const toneIcon: Record<InfoBoxTone, string> = {
  neutral: 'text-muted-foreground',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

type InfoBoxProps = {
  tone?: InfoBoxTone;
  icon?: ReactNode;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function InfoBox({ tone = 'neutral', icon, title, className, children }: InfoBoxProps) {
  return (
    <div
      className={cn(
        'rounded-r-md border border-border/60 border-l-4 bg-background p-3.5',
        toneBorder[tone],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className={cn('mt-0.5 shrink-0', toneIcon[tone])}>{icon}</div>
        ) : null}
        <div className="min-w-0 space-y-1">
          {title ? (
            <p className="text-sm font-medium text-foreground">{title}</p>
          ) : null}
          {children ? (
            <div className="text-sm text-muted-foreground">{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
