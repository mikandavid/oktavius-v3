import {
  type CalendarEvent,
  clampEventToDayWindow,
  eventEndDate,
  eventStartDate,
} from './calendar-shared';

export interface TimedEventLayout {
  eventId: string;
  topPct: number;
  heightPct: number;
  /** 0-based column within the overlap cluster */
  column: number;
  /** Total columns in this event's overlap cluster */
  columnCount: number;
}

interface EventInterval {
  event: CalendarEvent;
  topPct: number;
  heightPct: number;
  startMin: number;
  endMin: number;
}

function eventInterval(
  event: CalendarEvent,
  day: Date,
  startHour: number,
  endHour: number,
): EventInterval | null {
  const layout = clampEventToDayWindow(event, day, startHour, endHour);
  const start = eventStartDate(event);
  const end = eventEndDate(event);
  if (!layout || !start || !end) return null;

  const windowStartMin = startHour * 60;
  const startMin = Math.max(0, start.getHours() * 60 + start.getMinutes() - windowStartMin);
  const endMin = Math.min(
    (endHour - startHour) * 60,
    end.getHours() * 60 + end.getMinutes() - windowStartMin,
  );

  return { event, topPct: layout.topPct, heightPct: layout.heightPct, startMin, endMin };
}

/** Google Calendar–style side-by-side layout for overlapping timed events. */
export function layoutTimedEventsForDay(
  events: CalendarEvent[],
  day: Date,
  startHour: number,
  endHour: number,
): Map<string, TimedEventLayout> {
  const intervals = events
    .map((event) => eventInterval(event, day, startHour, endHour))
    .filter((entry): entry is EventInterval => entry !== null)
    .sort((a, b) => {
      if (a.startMin !== b.startMin) return a.startMin - b.startMin;
      return b.endMin - b.startMin - (a.endMin - a.startMin);
    });

  const result = new Map<string, TimedEventLayout>();
  if (intervals.length === 0) return result;

  let clusterStart = 0;

  const assignCluster = (from: number, to: number) => {
    const cluster = intervals.slice(from, to);
    const columnEnds: number[] = [];
    const assignments: Array<{ eventId: string; column: number }> = [];

    for (const interval of cluster) {
      let column = columnEnds.findIndex((end) => end <= interval.startMin);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(interval.endMin);
      } else {
        columnEnds[column] = interval.endMin;
      }
      assignments.push({ eventId: interval.event.id, column });
    }

    const columnCount = Math.max(1, columnEnds.length);
    for (const interval of cluster) {
      const assignment = assignments.find((entry) => entry.eventId === interval.event.id);
      result.set(interval.event.id, {
        eventId: interval.event.id,
        topPct: interval.topPct,
        heightPct: interval.heightPct,
        column: assignment?.column ?? 0,
        columnCount,
      });
    }
  };

  for (let index = 1; index <= intervals.length; index += 1) {
    const current = intervals[index];
    const clusterStillOverlaps =
      current &&
      clusterOverlaps(
        intervals.slice(clusterStart, index).map((entry) => entry),
        current,
      );

    if (!current || !clusterStillOverlaps) {
      assignCluster(clusterStart, index);
      clusterStart = index;
    }
  }

  return result;
}

function clusterOverlaps(cluster: EventInterval[], next: EventInterval): boolean {
  return cluster.some((entry) => entry.endMin > next.startMin && entry.startMin < next.endMin);
}
