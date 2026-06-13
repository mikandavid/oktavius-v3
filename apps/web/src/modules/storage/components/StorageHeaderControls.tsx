import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@/lib/icons';

import type { StorageSortBy } from '../data/types';
import type { StorageViewState } from '../useStorageViewState';
import { StorageViewToggle } from './StorageViewToggle';

const SORT_FIELDS: StorageSortBy[] = ['name', 'updatedAt', 'fileSizeBytes'];

export function StorageHeaderControls({ state }: { state: StorageViewState }) {
  const { t } = useTranslation();
  const DirIcon = state.sort.dir === 'asc' ? ChevronUpIcon : ChevronDownIcon;

  const changeSort = (field: StorageSortBy) => {
    if (field === state.sort.by) {
      state.setSort({ by: field, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      state.setSort({ by: field, dir: 'asc' });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative w-44 sm:w-56">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={state.search.term}
          onChange={(event) =>
            state.setSearch({ term: event.target.value, scope: state.search.scope })
          }
          placeholder={t('storage.search.placeholder')}
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <DirIcon size={14} />
            {t(`storage.sort.${state.sort.by}`)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SORT_FIELDS.map((field) => {
            const active = state.sort.by === field;
            return (
              <DropdownMenuItem key={field} onSelect={() => changeSort(field)}>
                <CheckIcon size={16} className={active ? '' : 'invisible'} />
                {t(`storage.sort.${field}`)}
                {active && <DirIcon size={14} className="ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <StorageViewToggle mode={state.displayMode} onChange={state.setDisplayMode} />
    </div>
  );
}
