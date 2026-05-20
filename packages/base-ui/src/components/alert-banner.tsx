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

const TONE: Record<AlertBannerTone, string> = {
  info: 'border-b-info/25 bg-info/10 text-info',
  success: 'border-b-success/25 bg-success/10 text-success',
  warning: 'border-b-warning/25 bg-warning/10 text-warning',
  destructive: 'border-b-destructive/25 bg-destructive/10 text-destructive',
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
        'flex w-full items-center gap-3 border-b px-4 py-2.5 text-sm',
        TONE[tone],
        className,
      )}
      role="alert"
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])} />
      <div className="min-w-0 flex-1 text-foreground/90">{children}</div>
      {dismissible ? (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
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
