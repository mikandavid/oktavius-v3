import { Badge, Button, Checkbox, cn, Combobox, Input } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import {
  ArchiveIcon,
  DeleteIcon,
  MarkReadIcon,
  MarkUnreadIcon,
  PaperclipIcon,
  SearchIcon,
} from '@/lib/icons';

import type { EmailFolder, EmailThread, EmailThreadStatus } from './types';

/** Header / toolbar inset. */
const QUEUE_INSET_CLASS = 'px-3';

/** List + select-all — same left inset as header (`pl-3`), light right inset. */
const QUEUE_LIST_INSET_CLASS = 'pl-3 pr-2';

/** Visible unchecked state — default Checkbox fill is too faint on card. */
const EMAIL_QUEUE_CHECKBOX_CLASS =
  'border border-border bg-background shadow-sm data-[state=checked]:border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground data-[state=indeterminate]:border-sidebar-primary data-[state=indeterminate]:bg-sidebar-primary/80 data-[state=indeterminate]:text-sidebar-primary-foreground';

type EmailThreadQueueProps = {
  threads: EmailThread[];
  folders: EmailFolder[];
  activeFolderId: string;
  onFolderChange: (folderId: string) => void;
  activeId: string;
  selectedIds: Set<string>;
  onSelect: (threadId: string) => void;
  onToggleSelect: (threadId: string) => void;
  onSetSelected: (ids: string[]) => void;
  onBulkArchive: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkMarkRead: (ids: string[]) => void;
  onBulkMarkUnread: (ids: string[]) => void;
};

type QueueFilter = 'all' | 'unread' | 'linked' | 'drafts' | 'failed';

const FILTERS: { id: QueueFilter; label: string; match: (t: EmailThread) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'unread', label: 'Unread', match: (t) => t.status === 'Unread' },
  { id: 'linked', label: 'Linked', match: (t) => Boolean(t.linkedEntity) },
  { id: 'drafts', label: 'Drafts', match: (t) => t.status === 'Draft' },
  { id: 'failed', label: 'Failed', match: (t) => t.status === 'Failed' },
];

function threadHasAttachments(thread: EmailThread): boolean {
  return thread.messages.some((m) => (m.attachments?.length ?? 0) > 0);
}

function leadParticipant(thread: EmailThread): string {
  return thread.participants[0] ?? thread.account;
}

function isUnread(status: EmailThreadStatus): boolean {
  return status === 'Unread';
}

type ThreadRowProps = {
  thread: EmailThread;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
};

/** Width of the unread dot + gap so subject/preview/tags stay aligned below the sender name. */
const DOT_INDENT_CLASS = 'pl-[14px]';

function ThreadRowContent({ thread }: { thread: EmailThread }) {
  const unread = isUnread(thread.status);
  const hasAttachments = threadHasAttachments(thread);
  const sender = leadParticipant(thread);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        {/* Always reserve the dot column so rows without a dot stay aligned. */}
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', unread ? 'bg-info' : 'invisible')}
          aria-label={unread ? 'Unread' : undefined}
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-xs',
            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90',
          )}
        >
          {sender}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {thread.updatedAt}
        </span>
      </div>
      <p
        className={cn(
          'truncate text-xs leading-snug',
          DOT_INDENT_CLASS,
          unread ? 'font-medium text-foreground' : 'text-foreground/85',
        )}
      >
        {thread.subject}
      </p>
      <p
        className={cn('line-clamp-1 text-xs leading-snug text-muted-foreground', DOT_INDENT_CLASS)}
      >
        {thread.preview}
      </p>
      {thread.linkedEntity ||
      hasAttachments ||
      thread.status === 'Draft' ||
      thread.status === 'Failed' ? (
        <div className={cn('mt-1 flex flex-wrap items-center gap-1.5', DOT_INDENT_CLASS)}>
          {thread.linkedEntity ? (
            <Badge variant="secondary" className="max-w-full truncate text-[10px] font-normal">
              {thread.linkedEntity.label}
            </Badge>
          ) : null}
          {hasAttachments ? <PaperclipIcon size={11} className="text-muted-foreground" /> : null}
          {thread.status === 'Draft' ? (
            <Badge variant="warning" className="text-[10px]">
              Draft
            </Badge>
          ) : null}
          {thread.status === 'Failed' ? (
            <Badge variant="destructive" className="text-[10px]">
              Failed
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ThreadRow({ thread, active, selected, onSelect, onToggleSelect }: ThreadRowProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-start gap-2.5 py-2.5 transition-colors',
        active && 'bg-muted/70',
        selected && !active && 'bg-muted/50',
        !active && 'hover:bg-muted/40',
      )}
    >
      <div className="flex shrink-0 items-start pt-0.5">
        <Checkbox
          className={EMAIL_QUEUE_CHECKBOX_CLASS}
          checked={selected}
          aria-label={`Select thread ${thread.subject}`}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={onToggleSelect}
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left shadow-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ThreadRowContent thread={thread} />
      </button>
    </div>
  );
}

export function EmailThreadQueue({
  threads,
  folders,
  activeFolderId,
  onFolderChange,
  activeId,
  selectedIds,
  onSelect,
  onToggleSelect,
  onSetSelected,
  onBulkArchive,
  onBulkDelete,
  onBulkMarkRead,
  onBulkMarkUnread,
}: EmailThreadQueueProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<QueueFilter>('all');

  const folderThreads = useMemo(
    () => threads.filter((t) => t.folderId === activeFolderId),
    [threads, activeFolderId],
  );

  const folderOptions = useMemo(
    () =>
      folders.map((folder) => {
        const count = threads.filter((t) => t.folderId === folder.id).length;
        return {
          value: folder.id,
          label: folder.label,
          description: count > 0 ? `${count}` : undefined,
        };
      }),
    [folders, threads],
  );

  const filtered = useMemo(() => {
    const f = FILTERS.find((entry) => entry.id === filter);
    const needle = query.trim().toLowerCase();
    return folderThreads.filter((t) => {
      if (f && !f.match(t)) return false;
      if (!needle) return true;
      return (
        t.subject.toLowerCase().includes(needle) ||
        t.preview.toLowerCase().includes(needle) ||
        t.participants.some((p) => p.toLowerCase().includes(needle))
      );
    });
  }, [folderThreads, filter, query]);

  const visibleIds = useMemo(() => filtered.map((t) => t.id), [filtered]);
  const selectedVisible = visibleIds.filter((id) => selectedIds.has(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;
  const bulkSelectionActive = selectedIds.size > 0;
  const selectedArray = Array.from(selectedIds);

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) onSetSelected([]);
    else onSetSelected(visibleIds);
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <div
        className={cn(
          'shrink-0 space-y-2.5 border-b border-border/50 pt-3 pb-3',
          QUEUE_INSET_CLASS,
        )}
      >
        <Combobox
          value={activeFolderId}
          options={folderOptions}
          onChange={(id) => id && onFolderChange(id)}
          placeholder="Mailbox"
        />
        <div className="relative">
          <SearchIcon
            size={12}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            className="h-8 w-full pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((entry) => {
            const active = entry.id === filter;
            return (
              <Button
                key={entry.id}
                type="button"
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
              </Button>
            );
          })}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-2 border-b border-border/50 py-2',
            bulkSelectionActive && 'bg-muted/30',
            QUEUE_LIST_INSET_CLASS,
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Checkbox
              className={EMAIL_QUEUE_CHECKBOX_CLASS}
              checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
              onCheckedChange={toggleSelectAllVisible}
              aria-label="Select all visible threads"
            />
            <span className="truncate text-xs text-muted-foreground">
              {bulkSelectionActive
                ? `${selectedIds.size} selected`
                : `Select all (${visibleIds.length})`}
            </span>
          </div>
          {bulkSelectionActive ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Archive selected"
                title="Archive"
                onClick={() => onBulkArchive(selectedArray)}
              >
                <ArchiveIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Mark selected as read"
                title="Mark read"
                onClick={() => onBulkMarkRead(selectedArray)}
              >
                <MarkReadIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Mark selected as unread"
                title="Mark unread"
                onClick={() => onBulkMarkUnread(selectedArray)}
              >
                <MarkUnreadIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                aria-label="Delete selected"
                title="Delete"
                onClick={() => onBulkDelete(selectedArray)}
              >
                <DeleteIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onSetSelected([])}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        role="list"
        aria-label="Email threads"
      >
        {filtered.length === 0 ? (
          <p className={cn('py-8 text-center text-xs text-muted-foreground', QUEUE_INSET_CLASS)}>
            No threads match this filter.
          </p>
        ) : (
          <div className={cn('flex flex-col divide-y divide-border/40', QUEUE_LIST_INSET_CLASS)}>
            {filtered.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                active={thread.id === activeId}
                selected={selectedIds.has(thread.id)}
                onSelect={() => onSelect(thread.id)}
                onToggleSelect={() => onToggleSelect(thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
