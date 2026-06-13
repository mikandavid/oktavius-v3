import { type ReactNode, useState } from 'react';

import { cn } from '../lib/utils';

export interface SettingsNavItem {
  key: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  /** Optional group label; items with the same group are rendered under a shared header. */
  group?: string;
}

export interface SettingsLayoutProps {
  items: SettingsNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  children: ReactNode;
  className?: string;
  /** Applied to the main content panel — use overflow-hidden when children manage their own scroll (e.g. SplitView). */
  contentClassName?: string;
  /** When true, renders a filter input above the desktop nav that narrows visible items. */
  filterable?: boolean;
  /** Placeholder text for the filter input (default: 'Filter sections…'). */
  filterPlaceholder?: string;
  /** Ordered list of group names; groups not in this list are appended in the order they first appear in `items`. */
  groupOrder?: string[];
}

export function filterSettingsNavItems(items: SettingsNavItem[], query: string): SettingsNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      (item.description?.toLowerCase().includes(q) ?? false),
  );
}

export function groupSettingsNavItems(
  items: SettingsNavItem[],
  groupOrder?: string[],
): Array<{ group: string | null; items: SettingsNavItem[] }> {
  const buckets = new Map<string | null, SettingsNavItem[]>();
  for (const item of items) {
    const key = item.group ?? null;
    const existing = buckets.get(key);
    if (existing) existing.push(item);
    else buckets.set(key, [item]);
  }
  const orderedKeys: Array<string | null> = [];
  if (groupOrder) {
    for (const g of groupOrder) if (buckets.has(g)) orderedKeys.push(g);
  }
  for (const key of buckets.keys()) if (!orderedKeys.includes(key)) orderedKeys.push(key);
  return orderedKeys.map((group) => ({ group, items: buckets.get(group) ?? [] }));
}

/**
 * Two-column settings layout: nav sidebar on left, content on right.
 * Desktop: each column scrolls independently. Mobile: horizontal section tabs + scrolling content.
 * Optionally renders a filter box and/or group headers.
 */
export function SettingsLayout({
  items,
  activeKey,
  onSelect,
  children,
  className,
  contentClassName,
  filterable = false,
  filterPlaceholder = 'Filter sections…',
  groupOrder,
}: SettingsLayoutProps) {
  const [query, setQuery] = useState('');
  const visibleItems = filterable ? filterSettingsNavItems(items, query) : items;
  const hasGroups = visibleItems.some((item) => item.group);
  const groups = groupSettingsNavItems(visibleItems, groupOrder);

  const navButtonClass = (isActive: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
      isActive
        ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
    );

  const renderNavButton = (item: SettingsNavItem) => {
    const isActive = item.key === activeKey;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onSelect(item.key)}
        className={navButtonClass(isActive)}
      >
        {item.icon ? (
          <span
            className={cn('shrink-0', isActive ? 'text-sidebar-primary' : 'text-muted-foreground')}
          >
            {item.icon}
          </span>
        ) : null}
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-8', className)}>
      {/* Desktop section nav */}
      <nav
        aria-label="Section navigation"
        className="hidden min-h-0 w-52 shrink-0 flex-col gap-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] md:flex"
      >
        {filterable ? (
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={filterPlaceholder}
            aria-label={filterPlaceholder}
            className="mb-1 h-8 shrink-0 rounded-md border border-border bg-muted/40 px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        ) : null}
        {hasGroups
          ? groups.map(({ group, items: groupItems }) => {
              // After filtering, a group can be empty — skip its wrapper entirely.
              if (groupItems.length === 0) return null;
              return (
                <div key={group === null ? '__ungrouped__' : group} className="space-y-1">
                  {group ? (
                    <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {group}
                    </p>
                  ) : null}
                  {groupItems.map(renderNavButton)}
                </div>
              );
            })
          : visibleItems.map(renderNavButton)}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {/* Mobile section nav — flat, filtered, no group headers */}
        <div className="flex shrink-0 gap-1 overflow-x-auto pb-1 md:hidden">
          {visibleItems.map((item) => {
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

        {/* Content */}
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
