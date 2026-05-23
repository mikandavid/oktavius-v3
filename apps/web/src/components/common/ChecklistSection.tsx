import type { ReactNode } from 'react';

import { Badge, Checkbox, cn, InlineEmptyState, ListRow, SectionCard } from '@oktavius/base-ui';

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  required?: boolean;
};

/** Applied to checklist row labels when `done` — grey + strikethrough (not checkbox alone). */
export const CHECKLIST_DONE_LABEL_CLASS =
  'text-muted-foreground line-through decoration-muted-foreground/70';

type ChecklistSectionProps = {
  title: string;
  meta?: string;
  items: ChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
  emptyText?: string;
  /** When true, checkboxes are visible but not interactive (e.g. overview preview). */
  readOnly?: boolean;
  actions?: ReactNode;
};

export function ChecklistSection({
  title,
  meta,
  items,
  onToggle,
  emptyText = 'No checklist items.',
  readOnly = false,
  actions,
}: ChecklistSectionProps) {
  const doneCount = items.filter((item) => item.done).length;
  const resolvedMeta = meta ?? (items.length ? `${doneCount}/${items.length} done` : undefined);

  return (
    <SectionCard title={title} meta={resolvedMeta} actions={actions}>
      {items.length ? (
        items.map((item) => (
          <ListRow
            key={item.id}
            title={
              <span className={cn(item.done && CHECKLIST_DONE_LABEL_CLASS)}>{item.label}</span>
            }
            className={cn(item.done && 'opacity-80')}
            leadingIsInteractive
            leading={
              <Checkbox
                checked={item.done}
                disabled={readOnly}
                aria-label={item.done ? `Mark "${item.label}" incomplete` : `Mark "${item.label}" complete`}
                onCheckedChange={(checked) => {
                  if (readOnly || checked === 'indeterminate') return;
                  onToggle(item.id, checked);
                }}
              />
            }
            trailing={
              item.required ? (
                <Badge variant={item.done ? 'outline' : 'warning'}>Required</Badge>
              ) : null
            }
          />
        ))
      ) : (
        <InlineEmptyState text={emptyText} centered />
      )}
    </SectionCard>
  );
}
