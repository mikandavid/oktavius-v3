import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';

import { CheckIcon, ChevronDownIcon, PlusIcon } from '@/lib/icons';

export interface SavedView {
  id: string;
  label: string;
  description?: string;
  isDefault?: boolean;
}

export interface SavedViewSelectorProps {
  views: SavedView[];
  value?: string;
  onChange: (viewId: string) => void;
  onSaveCurrent?: () => void;
  onManage?: () => void;
  className?: string;
}

/** Saved filter/column views for list pages — plugs into FilterToolbar row. */
export function SavedViewSelector({
  views,
  value,
  onChange,
  onSaveCurrent,
  onManage,
  className,
}: SavedViewSelectorProps) {
  const active =
    views.find((view) => view.id === value) ?? views.find((view) => view.isDefault) ?? views[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 font-normal', className)}
        >
          {active?.label ?? 'View'}
          <ChevronDownIcon size={14} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {views.map((view) => (
          <DropdownMenuItem key={view.id} onSelect={() => onChange(view.id)} className="gap-2">
            {view.id === active?.id ? (
              <CheckIcon size={14} className="text-cta" />
            ) : (
              <span className="w-3.5" aria-hidden />
            )}
            <span className="min-w-0 flex-1 truncate">{view.label}</span>
            {view.isDefault ? (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Default
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
        {onSaveCurrent || onManage ? (
          <>
            <DropdownMenuSeparator />
            {onSaveCurrent ? (
              <DropdownMenuItem onSelect={onSaveCurrent} className="gap-2">
                <PlusIcon size={14} />
                Save current view
              </DropdownMenuItem>
            ) : null}
            {onManage ? (
              <DropdownMenuItem onSelect={onManage}>Manage views…</DropdownMenuItem>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
