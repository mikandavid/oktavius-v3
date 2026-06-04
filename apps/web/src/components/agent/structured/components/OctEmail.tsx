import { Button, SectionCard } from '@oktavius/base-ui';

import { ForwardIcon } from '@/lib/icons';

import type { OctComponentProps } from '../registry';

export default function OctEmail({ attrs, body }: OctComponentProps) {
  const to = attrs.to ?? '';
  const subject = attrs.subject ?? '';
  const preview = body.trim() || attrs.preview || '';

  return (
    <SectionCard title={subject || 'Email draft'} meta={to ? `To: ${to}` : undefined}>
      {preview ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{preview}</p>
      ) : (
        <p className="text-xs text-muted-foreground">No preview.</p>
      )}
      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" disabled>
          <ForwardIcon size={14} className="mr-1.5" />
          Open composer
        </Button>
      </div>
    </SectionCard>
  );
}
