import { SectionCard } from '@oktavius/base-ui';

import type { AgentContextDumpCardPayload } from '../types';

type AgentContextDumpCardProps = AgentContextDumpCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeSections(props: Record<string, unknown>) {
  if (Array.isArray(props.sections)) {
    return props.sections as Array<{ label: string; content: string }>;
  }
  const sections: Array<{ label: string; content: string }> = [];
  for (const [key, value] of Object.entries(props)) {
    if (['kind', 'title', 'sections', 'className'].includes(key)) continue;
    if (typeof value === 'object') {
      sections.push({ label: key, content: JSON.stringify(value, null, 2) });
    } else {
      sections.push({ label: key, content: String(value ?? '') });
    }
  }
  return sections;
}

export function AgentContextDumpCard(props: AgentContextDumpCardProps) {
  const title = (props.title as string | undefined) ?? 'Context dump';
  const sections = props.sections ?? normalizeSections(props);

  return (
    <SectionCard className={props.className} title={title} meta={`${sections.length} sections`}>
      <div className="max-h-64 space-y-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </div>
            <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/20 p-2 text-[11px] leading-relaxed">
              {section.content}
            </pre>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default AgentContextDumpCard;

export function normalizeContextDumpProps(
  props: Record<string, unknown>,
): AgentContextDumpCardPayload {
  if (props.kind === 'context-dump') return props as AgentContextDumpCardPayload;
  return {
    kind: 'context-dump',
    title: props.title as string | undefined,
    sections: normalizeSections(props),
  };
}
