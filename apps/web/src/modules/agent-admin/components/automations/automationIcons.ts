/**
 * automationIcons.ts — type-detection + icon/tone helpers for the automations list/detail.
 *
 * Mirrors osiris `isHeartbeatTargetPayload` + David's ActivationListItem icon logic,
 * adapted to v3 ScheduledTask shape. Icons come exclusively from @/lib/icons.
 */

import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

import {
  CalendarIcon,
  EmailIcon,
  HeartIcon,
  LifeBuoyIcon,
  RefreshIcon,
  TimeIcon,
  ZapIcon,
} from '@/lib/icons';
import type { ScheduledTask } from '@/runtime/osiris/schedulerClient';

// ---------------------------------------------------------------------------
// Heartbeat detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the task is a heartbeat activation.
 * Mirrors osiris `isHeartbeatTargetPayload`.
 * `targetPayload` is `Record<string, unknown>` — read defensively.
 */
export function isHeartbeatTask(task: ScheduledTask): boolean {
  const p = task.targetPayload;
  return (
    typeof p === 'object' &&
    p !== null &&
    p['eventType'] === 'agent_activation' &&
    p['activationKind'] === 'heartbeat'
  );
}

// ---------------------------------------------------------------------------
// Status derivation (David's rule, applied to ScheduledTask)
// ---------------------------------------------------------------------------

export type AutomationActivationStatus = 'scheduled' | 'paused' | 'completed';

/**
 * Derives a three-state status matching David's `deriveScheduledActivationStatus`:
 *   paused   — !enabled
 *   completed — scheduleType === 'once' && !nextRunAt && lastRunAt
 *   scheduled — everything else
 */
export function deriveActivationStatus(
  task: Pick<ScheduledTask, 'enabled' | 'scheduleType' | 'nextRunAt' | 'lastRunAt'>,
): AutomationActivationStatus {
  if (!task.enabled) return 'paused';
  if (task.scheduleType === 'once' && !task.nextRunAt && task.lastRunAt) return 'completed';
  return 'scheduled';
}

// ---------------------------------------------------------------------------
// Icon + tone per task type
// ---------------------------------------------------------------------------

export interface AutomationTypeIcon {
  Icon: PhosphorIcon;
  toneClass: string;
  label: 'heartbeat' | 'email' | 'halo' | 'once' | 'interval' | 'cron' | 'event';
}

const DESTRUCTIVE_TONE = 'border-destructive/20 bg-destructive/10 text-destructive';
const PRIMARY_TONE = 'border-primary/15 bg-primary/[0.05] text-primary/70';

/**
 * Returns the icon component, CSS tone class, and a stable label for testids/a11y.
 * Logic mirrors David's `ActivationListItem` with distinct per-type icons:
 *   heartbeat     → Heart (destructive tone)
 *   email_received → Email
 *   halo_ticket_created → LifeBuoy
 *   once          → Calendar
 *   interval      → Refresh (ArrowsClockwise)
 *   cron          → Time (Clock)
 *   event / other → Zap (Lightning)
 */
export function automationTypeIcon(task: ScheduledTask): AutomationTypeIcon {
  if (isHeartbeatTask(task)) {
    return { Icon: HeartIcon, toneClass: DESTRUCTIVE_TONE, label: 'heartbeat' };
  }
  const kind = task.triggerConfig?.kind;
  if (kind === 'email_received') {
    return { Icon: EmailIcon, toneClass: PRIMARY_TONE, label: 'email' };
  }
  if (kind === 'halo_ticket_created') {
    return { Icon: LifeBuoyIcon, toneClass: PRIMARY_TONE, label: 'halo' };
  }
  switch (task.scheduleType) {
    case 'once':
      return { Icon: CalendarIcon, toneClass: PRIMARY_TONE, label: 'once' };
    case 'interval':
      return { Icon: RefreshIcon, toneClass: PRIMARY_TONE, label: 'interval' };
    case 'cron':
      return { Icon: TimeIcon, toneClass: PRIMARY_TONE, label: 'cron' };
    default:
      return { Icon: ZapIcon, toneClass: PRIMARY_TONE, label: 'event' };
  }
}

// ---------------------------------------------------------------------------
// Status pill class helper
// ---------------------------------------------------------------------------

export function statusPillClass(status: AutomationActivationStatus): string {
  if (status === 'scheduled') return 'border-primary/15 bg-primary/[0.05] text-primary/70';
  if (status === 'paused') return 'border-border/60 text-muted-foreground';
  return 'border-border/60 text-muted-foreground/80';
}
