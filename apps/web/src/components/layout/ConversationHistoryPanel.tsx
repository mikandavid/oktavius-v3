import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Input, ScrollArea, Skeleton, cn } from '@oktavius/base-ui';

import { BackIcon, CloseIcon, DeleteIcon, EditIcon, PlusIcon, SearchIcon } from '@/lib/icons';

export type ConversationHistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
};

type ConversationHistoryPanelProps = {
  items: ConversationHistoryItem[];
  activeItemId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectItem: (id: string) => void;
  onCreateItem: () => void;
  onBack: () => void;
  onDeleteItem?: (id: string) => void;
  onRenameItem?: (id: string, title: string) => void;
  title?: string;
  placeholder?: string;
  loading?: boolean;
  fullWidth?: boolean;
  closeLabel?: string;
};

const FULL_WIDTH_CONTENT_CLASS = 'mx-auto w-full max-w-5xl';

type TimeGroup = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'older';

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('de-AT', { month: 'short', day: 'numeric' }).format(date);
}

function getTimeGroup(value: string): TimeGroup {
  const date = new Date(value).getTime();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  if (date >= startOfToday) return 'today';
  if (date >= startOfYesterday) return 'yesterday';
  if (date >= startOfWeek) return 'thisWeek';
  if (date >= startOfMonth) return 'thisMonth';
  return 'older';
}

const GROUP_LABELS: Record<TimeGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  older: 'Older',
};

function groupItems(items: ConversationHistoryItem[]) {
  const grouped = new Map<TimeGroup, ConversationHistoryItem[]>();

  for (const item of items) {
    const group = getTimeGroup(item.updatedAt);
    const current = grouped.get(group);
    if (current) current.push(item);
    else grouped.set(group, [item]);
  }

  return (['today', 'yesterday', 'thisWeek', 'thisMonth', 'older'] as const)
    .map((group) => ({ group, items: grouped.get(group) ?? [] }))
    .filter((group) => group.items.length > 0);
}

export function ConversationHistoryPanel({
  items,
  activeItemId,
  searchQuery,
  onSearchChange,
  onSelectItem,
  onCreateItem,
  onBack,
  onDeleteItem,
  onRenameItem,
  title = 'Conversations',
  placeholder = 'Search conversations',
  loading = false,
  fullWidth = false,
  closeLabel = 'Close history',
}: ConversationHistoryPanelProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, []);

  const groupedItems = useMemo(() => groupItems(items), [items]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-border/60 bg-muted/30">
        <div
          className={cn(
            'flex h-full w-full items-center gap-1.5 px-2',
            fullWidth && FULL_WIDTH_CONTENT_CLASS,
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onBack}
            aria-label={closeLabel}
          >
            <BackIcon size={14} />
          </Button>
          <h2 className="flex-1 text-[13px] font-semibold text-foreground/90">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              onBack();
              onCreateItem();
            }}
            aria-label="New chat"
          >
            <PlusIcon size={14} />
          </Button>
        </div>
      </div>

      <div className={cn('shrink-0 px-3 py-2.5', fullWidth && FULL_WIDTH_CONTENT_CLASS)}>
        <div className="relative">
          <SearchIcon
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
          />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={placeholder}
            className="h-8 rounded-lg border-border/40 bg-muted/30 pl-8 pr-8 text-[13px] placeholder:text-muted-foreground/50 focus:border-primary/30 focus:bg-background"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
              aria-label="Clear search"
            >
              <CloseIcon size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-x-hidden">
        <div className={cn('px-2 pb-3', fullWidth && FULL_WIDTH_CONTENT_CLASS)}>
          {loading ? <ConversationHistorySkeleton /> : null}
          {!loading && items.length === 0 ? (
            <EmptyState hasSearch={Boolean(searchQuery.trim())} onCreateItem={onCreateItem} />
          ) : null}
          {!loading
            ? groupedItems.map(({ group, items: grouped }) => (
                <div key={group} className="mb-0.5">
                  <div className="px-3 pb-1.5 pt-3.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {GROUP_LABELS[group]}
                    </span>
                  </div>
                  <div className="space-y-px">
                    {grouped.map((item) => (
                      <ConversationHistoryRow
                        key={item.id}
                        item={item}
                        isActive={item.id === activeItemId}
                        onSelect={() => onSelectItem(item.id)}
                        onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
                        onRename={onRenameItem ? (nextTitle) => onRenameItem(item.id, nextTitle) : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))
            : null}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConversationHistoryRow({
  item,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  item: ConversationHistoryItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onRename?: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    setDraftTitle(item.title);
  }, [item.title]);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== item.title) {
      onRename?.(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group/conversation mx-1 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center overflow-hidden rounded-lg border border-transparent text-foreground transition-colors duration-200',
        isActive ? 'border-border/60 bg-muted/70' : 'hover:border-border/40 hover:bg-muted/50',
      )}
      tabIndex={0}
      onClick={!isEditing ? onSelect : undefined}
      onKeyDown={(event) => {
        if (isEditing) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="min-w-0 flex-1 overflow-hidden px-3 py-2">
        {isEditing ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitRename();
              if (event.key === 'Escape') setIsEditing(false);
            }}
            onBlur={commitRename}
            className="h-6 w-full border-0 border-b border-border/70 bg-transparent px-0 py-0 text-[13px] font-medium leading-snug text-foreground outline-none"
          />
        ) : (
          <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-snug">
            {item.title || 'Untitled'}
          </div>
        )}
        <div className="mt-0.5 text-[10px] text-muted-foreground/60">{formatRelativeTime(item.updatedAt)}</div>
      </div>

      <div
        className={cn(
          'shrink-0 pr-1.5 transition-opacity duration-150',
          'opacity-100 sm:opacity-0 sm:group-hover/conversation:opacity-100 sm:group-focus-within/conversation:opacity-100',
          isActive && 'opacity-100',
        )}
      >
        <div className="flex items-center gap-0.5">
          {onRename ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                setIsEditing(true);
              }}
              aria-label="Rename conversation"
            >
              <EditIcon size={14} />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label="Delete conversation"
            >
              <DeleteIcon size={14} />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ConversationHistorySkeleton() {
  return (
    <div className="space-y-4 pt-2">
      {[1, 2, 3].map((group) => (
        <div key={group}>
          <div className="px-3 pb-1.5 pt-3">
            <Skeleton className="h-2.5 w-14" />
          </div>
          <div className="space-y-0.5">
            {Array.from({ length: group === 1 ? 3 : 2 }).map((_, index) => (
              <div key={index} className="mx-1 px-4 py-2.5">
                <Skeleton className="mb-1.5 h-3.5 w-[70%]" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasSearch,
  onCreateItem,
}: {
  hasSearch: boolean;
  onCreateItem: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted/40">
          <SearchIcon size={14} className="text-muted-foreground/40" />
        </div>
        <p className="text-[13px] text-muted-foreground/70">No matching conversations</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
        <PlusIcon size={16} className="text-muted-foreground/35" />
      </div>
      <p className="mb-1 text-[13px] font-medium text-foreground/70">No conversations yet</p>
      <p className="mb-4 text-xs text-muted-foreground/60">Start the first conversation.</p>
      <Button variant="outline" size="sm" onClick={onCreateItem} className="h-7 px-3 text-xs">
        <PlusIcon size={14} className="mr-1.5" />
        New chat
      </Button>
    </div>
  );
}
