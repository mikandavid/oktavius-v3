import { Badge, Button, DetailFieldGrid, SectionCard } from '@oktavius/base-ui';

import { ForwardIcon } from '@/lib/icons';

import type { AgentEntityDetailCardPayload } from '../types';

type AgentEntityDetailCardProps = AgentEntityDetailCardPayload & {
  onOpen?: (href?: string) => void;
  className?: string;
};

export function AgentEntityDetailCard({
  title,
  subtitle,
  status,
  fields,
  href,
  onOpen,
  className,
}: AgentEntityDetailCardProps) {
  return (
    <SectionCard
      className={className}
      title={title}
      meta={subtitle}
      actions={status ? <Badge variant="info">{status}</Badge> : undefined}
    >
      <DetailFieldGrid
        fields={fields.map((field) => ({
          label: field.label,
          value: field.value,
        }))}
      />
      {href || onOpen ? (
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpen?.(href)}>
            <ForwardIcon size={14} className="mr-1.5" />
            Open record
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
}
