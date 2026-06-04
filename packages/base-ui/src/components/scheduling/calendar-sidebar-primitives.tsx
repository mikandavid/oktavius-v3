import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export const calendarSidebarSectionTitleClass =
  'text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground';

export const calendarSidebarRowClass =
  'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm transition-colors hover:bg-muted/50';

export const calendarSidebarCheckboxClass =
  'h-3.5 w-3.5 shrink-0 rounded border-border/70 accent-cta';

export function CalendarSidebarSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={calendarSidebarSectionTitleClass}>{title}</p>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

export function CalendarSidebarToggleRow({
  checked,
  disabled,
  onCheckedChange,
  leading,
  label,
  hint,
  className,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  leading?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn(calendarSidebarRowClass, !checked && 'opacity-50', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || !onCheckedChange}
        onChange={onCheckedChange ? (event) => onCheckedChange(event.target.checked) : undefined}
        className={calendarSidebarCheckboxClass}
      />
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-foreground">{label}</span>
        {hint ? <span className="block truncate text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}
