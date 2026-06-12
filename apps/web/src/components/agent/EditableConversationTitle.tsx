import { cn } from '@oktavius/base-ui';
import { useCallback, useEffect, useRef, useState } from 'react';

type EditableConversationTitleProps = {
  conversationId: string | null;
  title: string | null;
  fallbackTitle: string;
  onRename: (id: string, title: string) => Promise<void> | void;
  className?: string;
};

export function EditableConversationTitle({
  conversationId,
  title,
  fallbackTitle,
  onRename,
  className,
}: EditableConversationTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

  const storedTitle = title?.trim() ?? '';
  const displayTitle = storedTitle || fallbackTitle;
  const canEdit = Boolean(conversationId);

  const startEditing = useCallback(() => {
    if (!canEdit) return;
    setDraft(displayTitle);
    setIsEditing(true);
  }, [canEdit, displayTitle]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const cancelEditing = useCallback(() => {
    skipCommitRef.current = true;
    setDraft(displayTitle);
    setIsEditing(false);
  }, [displayTitle]);

  const commitEditing = useCallback(() => {
    const trimmed = draft.trim();
    if (conversationId && trimmed && trimmed !== storedTitle) {
      void onRename(conversationId, trimmed);
    }
    setIsEditing(false);
  }, [conversationId, draft, onRename, storedTitle]);

  const handleBlur = useCallback(() => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }
    commitEditing();
  }, [commitEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitEditing();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            cancelEditing();
          }
        }}
        className={cn(
          'h-7 w-full min-w-0 truncate border-0 border-b border-border/70 bg-transparent px-0 py-0 text-[13px] font-semibold text-foreground/90 outline-none ring-0 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          className,
        )}
      />
    );
  }

  return (
    <h2 className={cn('min-w-0 truncate text-[13px] font-semibold text-foreground/90', className)}>
      {canEdit ? (
        <button
          type="button"
          onClick={startEditing}
          className="block w-full cursor-text truncate text-left hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={`Rename conversation: ${displayTitle}`}
        >
          {displayTitle}
        </button>
      ) : (
        displayTitle
      )}
    </h2>
  );
}
