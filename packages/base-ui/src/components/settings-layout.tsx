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
  /** Applied to the main content panel — use overflow-hidden when children manage their own scroll (e.g. SplitView). */
  contentClassName?: string;
}

/**
 * Two-column settings layout: nav sidebar on left, content on right.
 * Desktop: each column scrolls independently. Mobile: horizontal section tabs + scrolling content.
 */
export function SettingsLayout({
  items,
  activeKey,
  onSelect,
  children,
  className,
  contentClassName,
}: SettingsLayoutProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-8', className)}>
      {/* Desktop section nav — stays in place; scrolls on its own when items overflow */}
      <nav
        aria-label="Section navigation"
        className="hidden min-h-0 w-52 shrink-0 space-y-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] md:block"
      >
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
                  ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              {item.icon ? (
                <span
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-sidebar-primary' : 'text-muted-foreground',
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {/* Mobile section nav */}
        <div className="flex shrink-0 gap-1 overflow-x-auto pb-1 md:hidden">
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
                    ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content — scrolls independently from section nav; flex col so fill-height panels (e.g. design tokens) can use flex-1 */}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-card bg-card p-5 [scrollbar-gutter:stable]',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
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
  /** Inline: label left, control right (default). Stacked: full-width content below the label. */
  layout?: 'inline' | 'stacked';
}

/** Single settings control row: label+description left, control right. */
export function SettingsRow({
  label,
  description,
  children,
  className,
  layout = 'inline',
}: SettingsRowProps) {
  const stacked = layout === 'stacked';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border/50 py-3 last:border-b-0',
        !stacked && 'sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className={cn(stacked ? 'min-w-0 w-full max-w-xl' : 'shrink-0')}>{children}</div>
    </div>
  );
}
