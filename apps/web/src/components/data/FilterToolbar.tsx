import { CloseIcon, FilterIcon, SearchIcon } from '@/lib/icons';

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@oktavius/base-ui';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterDef = {
  key: string;
  label: string;
  options: FilterOption[];
};

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
  const hasActiveFilters = search.length > 0 || Object.values(values).some((value) => value.length > 0);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full max-w-md">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              className="pl-9 pr-9"
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

          {filters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <label key={filter.key} className="flex items-center gap-2 rounded-control border bg-background px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                  <Select
                    value={values[filter.key] || '__all__'}
                    onValueChange={(value) =>
                      onFilterChange?.(filter.key, value === '__all__' ? '' : value)
                    }
                  >
                    <SelectTrigger className="h-7 min-w-[8rem] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus:ring-0">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trailing}
          {hasActiveFilters ? (
            <Button variant="outline" onClick={onReset}>
              <FilterIcon size={16} />
              Reset
            </Button>
          ) : null}
        </div>
    </div>
  );
}
