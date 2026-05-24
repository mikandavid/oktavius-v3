import { InlineEmptyState, ListRow, SectionCard, cn } from '@oktavius/base-ui';

import { CheckIcon, EmailIcon } from '@/lib/icons';

export interface EmailTemplateOption {
  id: string;
  name: string;
  subject: string;
  description?: string;
  updatedAt?: string;
}

export interface EmailTemplatePickerProps {
  templates: EmailTemplateOption[];
  value?: string;
  onChange: (templateId: string) => void;
  title?: string;
  meta?: string;
  emptyMessage?: string;
  /** When embedded in a dialog, skip the SectionCard shell. */
  embedded?: boolean;
  className?: string;
}

/** Email template selector for document send and notification flows. */
export function EmailTemplatePicker({
  templates,
  value,
  onChange,
  title = 'Email template',
  meta,
  emptyMessage = 'No email templates available.',
  embedded = false,
  className,
}: EmailTemplatePickerProps) {
  const list = templates.length ? (
    <div className="space-y-1">
      {templates.map((template) => {
        const selected = template.id === value;
        return (
          <ListRow
            key={template.id}
            variant="queue"
            leading={<EmailIcon size={16} className="text-muted-foreground" />}
            title={template.name}
            subtitle={
              <>
                <span className="line-clamp-1">{template.subject}</span>
                {template.description ? (
                  <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                    {template.description}
                  </span>
                ) : null}
                {template.updatedAt ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {template.updatedAt}
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
