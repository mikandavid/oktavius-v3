import { useMemo } from 'react';

import { Badge, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';

import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import type { LocationDetailItem } from '@/lib/locations/types';

function formatLocationAddress(item: LocationDetailItem): string {
  const street = item.street?.trim();
  const city = [item.postalCode?.trim(), item.locality?.trim()].filter(Boolean).join(' ');
  const line = [street, city].filter(Boolean).join(', ');
  return line || '—';
}

function compareLocations(a: LocationDetailItem, b: LocationDetailItem): number {
  const branchCompare = (a.branchCode ?? '').localeCompare(b.branchCode ?? '', undefined, {
    sensitivity: 'base',
  });
  if (branchCompare !== 0) return branchCompare;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

type WorkspaceLocationsOverviewProps = {
  locations: LocationDetailItem[];
  onEdit?: (location: LocationDetailItem) => void;
  onDeactivate?: (location: LocationDetailItem) => void;
};

/** Compact site list for workspace settings — not the popover contact card layout. */
export function WorkspaceLocationsOverview({
  locations,
  onEdit,
  onDeactivate,
}: WorkspaceLocationsOverviewProps) {
  const rows = useMemo(() => [...locations].sort(compareLocations), [locations]);

  const columns = useMemo<SettingsTableColumn<LocationDetailItem>[]>(() => {
    const baseColumns: SettingsTableColumn<LocationDetailItem>[] = [
      {
        key: 'name',
        header: 'Site',
        cell: (location) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{location.name}</p>
            {location.companyName?.trim() ? (
              <p className="truncate text-xs text-muted-foreground">
                {location.companyName.trim()}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'branch',
        header: 'Branch',
        headerClassName: 'w-[88px]',
        className: 'text-sm tabular-nums text-muted-foreground',
        cell: (location) => location.branchCode?.trim() || '—',
      },
      {
        key: 'address',
        header: 'Address',
        headerClassName: 'hidden md:table-cell',
        className: 'hidden md:table-cell max-w-[16rem] truncate text-sm text-muted-foreground',
        cell: (location) => formatLocationAddress(location),
      },
      {
        key: 'type',
        header: 'Type',
        headerClassName: 'w-[104px]',
        cell: (location) => {
          const label = location.category?.trim();
          if (!label) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <Badge variant="secondary" className="text-xs font-normal">
              {label}
            </Badge>
          );
        },
      },
    ];

    if (!onEdit && !onDeactivate) return baseColumns;

    return [
      ...baseColumns,
      {
        key: 'actions',
        header: '',
        headerClassName: 'w-24',
        cell: (location) => (
          <div className="flex items-center justify-end gap-1">
            {onEdit ? (
              <IconEditButton label={`Edit ${location.name}`} onClick={() => onEdit(location)} />
            ) : null}
            {onDeactivate && location.isActive ? (
              <IconDeleteButton
                label={`Deactivate ${location.name}`}
                onClick={() => onDeactivate(location)}
              />
            ) : null}
          </div>
        ),
      },
    ];
  }, [onDeactivate, onEdit]);

  return (
    <SettingsTable
      columns={columns}
      rows={rows}
      getRowId={(location) => location.id}
      emptyMessage="No locations configured yet."
    />
  );
}
