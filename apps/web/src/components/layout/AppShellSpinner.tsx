import { cn } from '@oktavius/base-ui';

import { SpinnerIcon } from '@/lib/icons';

type AppShellSpinnerProps = {
  label?: string;
  className?: string;
};

export function AppShellSpinner({ label = 'Loading…', className }: AppShellSpinnerProps) {
  return (
    <div
      className={cn(
        'flex min-h-[12rem] flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SpinnerIcon size={24} className="animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}
