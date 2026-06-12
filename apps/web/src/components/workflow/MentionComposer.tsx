import { cn, ListRow, Popover, PopoverContent, PopoverTrigger, Textarea } from '@oktavius/base-ui';
import { useMemo, useRef, useState } from 'react';

import { FormattedText } from '@/components/common/FormattedText';

export type MentionOption = {
  handle: string;
  label: string;
  description?: string;
};

type MentionComposerProps = {
  value: string;
  onChange: (value: string) => void;
  mentionOptions: MentionOption[];
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
};

/** Textarea with @mention autocomplete for comment threads. */
export function MentionComposer({
  value,
  onChange,
  mentionOptions,
  placeholder = 'Write a comment…',
  rows = 3,
  className,
  id,
}: MentionComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return mentionOptions
      .filter(
        (option) =>
          option.handle.toLowerCase().includes(query) || option.label.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [mentionOptions, mentionQuery]);

  const syncMentionQuery = (nextValue: string, cursor: number) => {
    const beforeCursor = nextValue.slice(0, cursor);
    const match = beforeCursor.match(/(?:^|\s)@([\w.-]*)$/);
    if (!match) {
      setMentionQuery(null);
      setMentionOpen(false);
      return;
    }
    setMentionQuery(match[1] ?? '');
    setMentionOpen(true);
  };

  const insertMention = (option: MentionOption) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const beforeCursor = value.slice(0, cursor);
    const afterCursor = value.slice(cursor);
    const mentionStart = beforeCursor.lastIndexOf('@');
    if (mentionStart < 0) return;

    const prefix = beforeCursor.slice(0, mentionStart);
    const nextValue = `${prefix}@${option.handle} ${afterCursor}`;
    onChange(nextValue);
    setMentionOpen(false);
    setMentionQuery(null);
    window.requestAnimationFrame(() => textarea.focus());
  };

  return (
    <Popover open={mentionOpen && filteredOptions.length > 0} onOpenChange={setMentionOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            rows={rows}
            placeholder={placeholder}
            onChange={(event) => {
              onChange(event.target.value);
              syncMentionQuery(event.target.value, event.target.selectionStart);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setMentionOpen(false);
              }
            }}
            onClick={(event) => {
              syncMentionQuery(event.currentTarget.value, event.currentTarget.selectionStart);
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        {filteredOptions.map((option) => (
          <ListRow
            key={option.handle}
            title={`@${option.handle}`}
            subtitle={option.description ?? option.label}
            onClick={() => insertMention(option)}
            className="rounded-control"
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function renderCommentBody(body: string) {
  return <FormattedText text={body} />;
}
