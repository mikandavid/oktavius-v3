import { cn, InlineEmptyState, ListRow, SectionCard } from '@oktavius/base-ui';

import { CheckIcon, DocumentIcon } from '@/lib/icons';

export interface TemplateOption {
  id: string;
  name: string;
  description?: string;
  category?: string;
  updatedAt?: string;
}

export interface TemplatePickerProps {
  templates: TemplateOption[];
  value?: string;
  onChange: (templateId: string) => void;
  title?: string;
  meta?: string;
  emptyMessage?: string;
  /** When embedded in a dialog, skip the SectionCard shell. */
  embedded?: boolean;
  className?: string;
}

/** Document template selector for generate/send flows. */
export function TemplatePicker({
  templates,
  value,
  onChange,
  title = 'Document template',
  meta,
  emptyMessage = 'No templates available.',
  embedded = false,
  className,
}: TemplatePickerProps) {
  const list = templates.length ? (
    <div className="space-y-1">
      {templates.map((template) => {
        const selected = template.id === value;
        return (
          <ListRow
            key={template.id}
            variant="queue"
            leading={<DocumentIcon size={16} className="text-muted-foreground" />}
            title={template.name}
            subtitle={
              <>
                {template.description ? (
                  <span className="line-clamp-2">{template.description}</span>
                ) : null}
                {template.category || template.updatedAt ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {[template.category, template.updatedAt].filter(Boolean).join(' · ')}
                  </span>
                ) : null}
              </>
            }
            trailing={selected ? <CheckIcon size={16} className="text-cta" /> : null}
            onClick={() => onChange(template.id)}
            className={cn(selected && 'ring-1 ring-cta/30 bg-cta/5')}
            aria-current={selected ? 'true' : undefined}
          />
        );
      })}
    </div>
  ) : (
    <InlineEmptyState text={emptyMessage} centered />
  );

  if (embedded) {
    return (
      <div className={cn('space-y-2', className)}>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {list}
      </div>
    );
  }

  return (
    <SectionCard title={title} meta={meta} className={className}>
      {list}
    </SectionCard>
  );
}
