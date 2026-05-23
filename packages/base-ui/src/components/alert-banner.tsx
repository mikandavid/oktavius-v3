import * as React from 'react';
import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

import { cn } from '../lib/utils';

export type AlertBannerTone = 'info' | 'success' | 'warning' | 'destructive';

const TONE_ICON: Record<
  AlertBannerTone,
  React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' }>
> = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  destructive: WarningCircle,
};

const TONE: Record<AlertBannerTone, string> = {
  info: 'border-info/25 bg-info/10',
  success: 'border-success/25 bg-success/10',
  warning: 'border-warning/25 bg-warning/10',
  destructive: 'border-destructive/25 bg-destructive/10',
};

const TONE_ICON_CLASS: Record<AlertBannerTone, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

export interface AlertBannerProps {
  tone?: AlertBannerTone;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Span the full workspace width (breaks out of page gutter). Use when mounted above ModulePage. */
  flush?: boolean;
  className?: string;
}

/**
 * Site-wide or page-level banner.
 * Use for maintenance notices, trial warnings, important announcements.
 * Different from InfoBox — compact, page-top placement.
 */
export function AlertBanner({
  tone = 'info',
  children,
  dismissible = false,
  onDismiss,
  flush = false,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const Icon = TONE_ICON[tone];

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 border px-4 py-3 text-sm',
        flush ? '-mx-3 rounded-none border-x-0 md:-mx-6' : 'rounded-card',
        TONE[tone],
        className,
      )}
      role="alert"
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', TONE_ICON_CLASS[tone])} weight="fill" />
      <div className="min-w-0 flex-1 text-foreground/90 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-foreground">
        {children}
      </div>
      {dismissible ? (
        <button
          type="button"
          className="shrink-0 rounded-control p-1 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
