import * as React from 'react';
import { X } from '@phosphor-icons/react';

import { cn } from '../lib/utils';

export type AlertBannerTone = 'info' | 'success' | 'warning' | 'destructive';

const TONE_DOT: Record<AlertBannerTone, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

const TONE_BORDER: Record<AlertBannerTone, string> = {
  info: 'border-b-info/30',
  success: 'border-b-success/30',
  warning: 'border-b-warning/40',
  destructive: 'border-b-destructive/40',
};

export interface AlertBannerProps {
  tone?: AlertBannerTone;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Site-wide or page-level banner.
 * Use for maintenance notices, trial warnings, important announcements.
 * Different from InfoBox — full-width, sticky, top-of-page placement.
 */
export function AlertBanner({
  tone = 'info',
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 border-b bg-background px-4 py-2.5 text-sm',
        TONE_BORDER[tone],
        className,
      )}
      role="alert"
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])} />
      <div className="min-w-0 flex-1 text-foreground">{children}</div>
      {dismissible ? (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
