import { useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  InlineEmptyState,
  Label,
  ListRow,
  RelativeTime,
  SectionCard,
  Textarea,
} from '@oktavius/base-ui';

import { UserIcon } from '@/lib/icons';

export interface CommentItem {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  /** Internal notes are hidden from external parties */
  internal?: boolean;
}

export interface CommentsPanelProps {
  comments: CommentItem[];
  onSubmit: (body: string, internal: boolean) => void;
  title?: string;
  meta?: string;
  placeholder?: string;
  allowInternal?: boolean;
  className?: string;
}

/** Record activity thread with compose box — approvals, cases, documents. */
export function CommentsPanel({
  comments,
  onSubmit,
  title = 'Comments',
  meta,
  placeholder = 'Write a comment…',
  allowInternal = true,
  className,
}: CommentsPanelProps) {
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed, internal);
    setBody('');
    setInternal(false);
  };

  return (
    <SectionCard title={title} meta={meta ?? `${comments.length} messages`} className={className}>
      <div className="space-y-3">
        {comments.length ? (
          <div className="space-y-1">
            {comments.map((comment) => (
              <ListRow
                key={comment.id}
                leading={
                  <Avatar
                    label={comment.author}
                    size="sm"
                    icon={<UserIcon size={14} weight="duotone" />}
                  />
                }
                title={
                  <span className="flex items-center gap-2">
                    <span>{comment.author}</span>
                    {comment.internal ? <Badge variant="secondary">Internal</Badge> : null}
                  </span>
                }
                subtitle={
                  <>
                    <span className="mt-1 block whitespace-pre-wrap text-sm text-foreground">
                      {comment.body}
                    </span>
                    <RelativeTime date={comment.createdAt} className="mt-1 block text-xs" />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <InlineEmptyState text="No comments yet." centered />
        )}

        <div className="space-y-2 border-t border-border/50 pt-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={placeholder}
            rows={3}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {allowInternal ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="comment-internal"
                  checked={internal}
                  onCheckedChange={(checked) => setInternal(checked === true)}
                />
                <Label
                  htmlFor="comment-internal"
                  className="text-xs font-normal text-muted-foreground"
                >
                  Internal note
                </Label>
              </div>
            ) : (
              <span />
            )}
            <Button
              type="button"
              variant="cta"
              size="sm"
              disabled={!body.trim()}
              onClick={handleSubmit}
            >
              Post comment
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
