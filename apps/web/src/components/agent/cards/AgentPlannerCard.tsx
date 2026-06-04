import { Badge, ListRow, SectionCard, formatDisplayDateTime } from '@oktavius/base-ui';
import type { AgentPlannerCardPayload, AgentPlannerSlot } from '../types';

type AgentPlannerCardProps = AgentPlannerCardPayload & {
  className?: string;
} & Record<string, unknown>;

function normalizeSlots(props: Record<string, unknown>): AgentPlannerSlot[] {
  const raw = props.slots ?? props.assignments ?? props.items;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => entry as AgentPlannerSlot);
}

export function AgentPlannerCard(props: AgentPlannerCardProps) {
  const slots = props.slots ?? normalizeSlots(props);
  const title = (props.title as string | undefined) ?? 'Planner';
  const date = props.date as string | undefined;

  return (
    <SectionCard
      className={props.className}
      title={title}
      meta={date ? formatDisplayDateTime(date) : `${slots.length} slots`}
    >
      {slots.length === 0 ? (
        <p className="text-xs text-muted-foreground">No assignments.</p>
      ) : (
        <div className="space-y-1">
          {slots.slice(0, 12).map((slot, index) => {
            const label = slot.label ?? slot.staff ?? 'Assignment';
            const time =
              slot.startTime && slot.endTime
                ? `${formatDisplayDateTime(slot.startTime)} – ${formatDisplayDateTime(slot.endTime)}`
                : slot.startTime
                  ? formatDisplayDateTime(slot.startTime)
                  : undefined;
            return (
              <ListRow
                key={slot.id ?? `${label}-${index}`}
                title={label}
                subtitle={time}
                meta={slot.status ? <Badge variant="secondary">{slot.status}</Badge> : undefined}
              />
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default AgentPlannerCard;

export function normalizePlannerProps(props: Record<string, unknown>): AgentPlannerCardPayload {
  if (props.kind === 'planner') return props as AgentPlannerCardPayload;
  return {
    kind: 'planner',
    title: props.title as string | undefined,
    date: props.date as string | undefined,
    slots: normalizeSlots(props),
  };
}
