import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface SettingsNavItem {
  key: string;
  label: string;
  icon?: ReactNode;
  description?: string;
}

export interface SettingsLayoutProps {
  items: SettingsNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Two-column settings layout: nav sidebar on left, content on right.
 * Collapses to stacked tabs on small screens.
 */
export function SettingsLayout({
  items,
  activeKey,
  onSelect,
  children,
  className,
}: SettingsLayoutProps) {
  return (
    <div className={cn('flex min-h-0 gap-6 md:gap-8', className)}>
      {/* Nav */}
      <nav className="hidden w-52 shrink-0 space-y-1 md:block">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {item.icon ? (
                <span className="shrink-0 text-muted-foreground">{item.icon}</span>
              ) : null}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 rounded-card bg-card p-5">{children}</div>
    </div>
  );
}

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Semantic wrapper for a settings section (title + description + controls). */
export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Single settings control row: label+description left, control right. */
export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-3 border-b border-border/50 last:border-b-0 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
