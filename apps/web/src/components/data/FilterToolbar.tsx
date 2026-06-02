import { CloseIcon, FilterIcon, SearchIcon } from '@/lib/icons';

import { Button, Combobox, Input, cn } from '@oktavius/base-ui';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterDef = {
  key: string;
  label: string;
  options: FilterOption[];
};

/** Fixed filter slots so toolbar controls do not shift between list pages. Lint: ux-limits.mjs MAX_LIST_FILTERS. */
export const FILTER_TOOLBAR_SLOT_COUNT = 3;

/** Filled controls on white `bg-card` list shells — lighter than default `bg-muted/60` forms. */
const FILTER_TOOLBAR_FIELD_SURFACE =
  'rounded-control bg-secondary text-foreground transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring/40';

const FILTER_COMBO_CLASS =
  'h-auto min-h-0 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-foreground shadow-none hover:bg-transparent focus:ring-0';

type FilterToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  values?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  trailing?: React.ReactNode;
};

function FilterSlot({
  filter,
  value,
  onFilterChange,
}: {
  filter: FilterDef;
  value: string;
  onFilterChange?: (key: string, value: string) => void;
}) {
  return (
    <label className={cn('flex h-9 min-w-0 items-center gap-2 px-3', FILTER_TOOLBAR_FIELD_SURFACE)}>
      <span className="w-[4.75rem] shrink-0 truncate text-xs font-medium text-foreground/70">
        {filter.label}
      </span>
      <Combobox
        className={FILTER_COMBO_CLASS}
        options={[
          { value: '__all__', label: 'All' },
          ...filter.options.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        ]}
        value={value || '__all__'}
        clearable={false}
        placeholder="All"
        searchPlaceholder={`Search ${filter.label.toLowerCase()}…`}
        onChange={(next) => onFilterChange?.(filter.key, !next || next === '__all__' ? '' : next)}
      />
    </label>
  );
}

/**
 * Single-row toolbar: search + fixed filter slots + trailing actions.
 * Slot count is constant across pages so comboboxes stay aligned when navigating.
 */
export function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records',
  filters = [],
  values = {},
  onFilterChange,
  onReset,
  trailing,
}: FilterToolbarProps) {
  const hasActiveFilters =
    search.length > 0 || Object.values(values).some((value) => value.length > 0);

  const slots = Array.from(
    { length: FILTER_TOOLBAR_SLOT_COUNT },
    (_, index) => filters[index] ?? null,
  );

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto] items-center gap-2 px-5 py-3">
      <div className="relative min-w-0">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          className={cn('w-full min-w-0 pl-9 pr-9', FILTER_TOOLBAR_FIELD_SURFACE)}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <CloseIcon size={14} />
          </button>
        ) : null}
      </div>

      {slots.map((filter, index) =>
        filter ? (
          <FilterSlot
            key={filter.key}
            filter={filter}
            value={values[filter.key] ?? ''}
            onFilterChange={onFilterChange}
          />
        ) : (
          <div key={`filter-slot-${index}`} aria-hidden className="h-9 min-w-0 rounded-control" />
        ),
      )}

      <div className="flex min-w-[5.75rem] shrink-0 items-center justify-end gap-2">
        {trailing}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className={cn(!hasActiveFilters && 'pointer-events-none invisible')}
          tabIndex={hasActiveFilters ? 0 : -1}
          aria-hidden={!hasActiveFilters}
        >
          <FilterIcon size={16} />
          Reset
        </Button>
      </div>
    </div>
  );
}
