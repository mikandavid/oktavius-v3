import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';

type InfoBoxTone = 'neutral' | 'info' | 'success' | 'warning' | 'destructive';

const TONE: Record<InfoBoxTone, string> = {
  neutral: 'border-border bg-muted/40 text-foreground',
  info: 'border-info/25 bg-info/10 text-info',
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
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
    <div className={cn('rounded-card border p-4', TONE[tone], className)}>
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0 space-y-1.5">
          {title ? <p className="text-sm font-medium">{title}</p> : null}
          {children ? <div className="text-sm text-foreground/90">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
