import { cn } from '../../lib/utils';
import { type CalendarSource, eventBlockClasses } from './calendar-colors';
import {
  type CalendarEvent,
  type CalendarEventClickHandler,
  type CalendarTeamMember,
  eventClickAnchor,
  formatAgendaDayHeading,
  formatCalendarEventDetailHint,
  formatEventTimeRange,
  groupEventsByDay,
  isToday,
  schedulingBodyClass,
  schedulingShellClass,
} from './calendar-shared';

export interface AgendaListProps {
  events?: CalendarEvent[];
  calendars?: CalendarSource[];
  teamMembers?: CalendarTeamMember[];
  onEventClick?: CalendarEventClickHandler;
  emptyMessage?: string;
  /** When true, renders without outer card shell (inside CalendarView) */
  embedded?: boolean;
  className?: string;
}

export function AgendaList({
  events = [],
  calendars,
  teamMembers,
  onEventClick,
  emptyMessage = 'No upcoming events.',
  embedded = false,
  className,
}: AgendaListProps) {
  const groups = groupEventsByDay(events);

  if (groups.length === 0) {
    const empty = <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
    if (embedded) {
      return <div className={cn(schedulingBodyClass, className)}>{empty}</div>;
    }
    return <div className={cn(schedulingShellClass, schedulingBodyClass, className)}>{empty}</div>;
  }

  const content = groups.map(({ day, events: dayEvents }) => (
    <section key={day.toISOString()} className="border-b border-border/40 last:border-b-0">
      <header
        className={cn(
          'flex items-baseline gap-3 px-4 py-3',
          isToday(day) ? 'bg-cta/8' : 'bg-muted/20',
        )}
      >
        <span
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold',
            isToday(day) && 'bg-cta text-cta-foreground',
          )}
        >
          {day.getDate()}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{formatAgendaDayHeading(day)}</h3>
          {isToday(day) ? <p className="text-xs text-muted-foreground">Today</p> : null}
        </div>
      </header>
      <div className={cn(schedulingBodyClass, 'space-y-2 pt-2')}>
        {dayEvents.map((event) => {
          const detailHint = formatCalendarEventDetailHint(event, teamMembers);
          return (
            <button
              key={event.id}
              type="button"
              onClick={
                onEventClick
                  ? (clickEvent) => onEventClick(event, eventClickAnchor(clickEvent.currentTarget))
                  : undefined
              }
              disabled={!onEventClick}
              className={cn(
                'flex w-full flex-col rounded-control px-3 py-2.5 text-left transition-[filter]',
                eventBlockClasses(event, calendars),
                !onEventClick && 'cursor-default',
              )}
            >
              <span className="truncate text-sm font-semibold">{event.title}</span>
              <span className="truncate text-xs opacity-90">{formatEventTimeRange(event)}</span>
              {detailHint ? (
                <span className="truncate text-xs opacity-75">{detailHint}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  ));

  if (embedded) {
    return <div className={cn('min-w-0', className)}>{content}</div>;
  }

  return <div className={cn(schedulingShellClass, className)}>{content}</div>;
}
