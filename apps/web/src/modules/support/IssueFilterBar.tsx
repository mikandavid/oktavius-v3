// IssueFilterBar — GitHub-issues header: Open/Closed toggle + search + optional dropdowns.
// Deliberately NOT a Tabs component; the Open/Closed split is rendered as text toggles.
import { cn, Combobox, Input, StatusDot } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CheckIcon, SearchIcon } from '@/lib/icons';

import type { StatusGroup } from './shared';

interface FilterOption {
  value: string;
  label: string;
}

interface IssueFilterBarProps {
  openCount: number;
  closedCount: number;
  statusGroup: StatusGroup;
  onStatusGroupChange: (g: StatusGroup) => void;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  /** Optional admin dropdowns. Omit to hide (requester surface). */
  priority?: { value: string; onChange: (v: string) => void; options: FilterOption[] };
  category?: { value: string; onChange: (v: string) => void; options: FilterOption[] };
}

export function IssueFilterBar({
  openCount,
  closedCount,
  statusGroup,
  onStatusGroupChange,
  search,
  onSearchChange,
  searchPlaceholder,
  priority,
  category,
}: IssueFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 rounded-card bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => onStatusGroupChange('open')}
            className={cn(
              'flex items-center gap-1.5 font-medium',
              statusGroup === 'open' ? 'text-foreground' : 'text-muted-foreground',
            )}
            aria-pressed={statusGroup === 'open'}
          >
            <StatusDot tone="info" size="sm" />
            {t('support.countOpen', { count: openCount })}
          </button>
          <button
            type="button"
            onClick={() => onStatusGroupChange('closed')}
            className={cn(
              'flex items-center gap-1.5 font-medium',
              statusGroup === 'closed' ? 'text-foreground' : 'text-muted-foreground',
            )}
            aria-pressed={statusGroup === 'closed'}
          >
            <CheckIcon size={14} weight="bold" />
            {t('support.countClosed', { count: closedCount })}
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      </div>

      {(priority || category) && (
        <div className="flex flex-wrap items-center gap-2">
          {priority && (
            <div className="w-40">
              <Combobox
                options={priority.options}
                value={priority.value || undefined}
                onChange={(v) => priority.onChange(v ?? '')}
                placeholder={t('support.filterPriorityAll')}
              />
            </div>
          )}
          {category && (
            <div className="w-40">
              <Combobox
                options={category.options}
                value={category.value || undefined}
                onChange={(v) => category.onChange(v ?? '')}
                placeholder={t('support.filterCategoryAll')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
