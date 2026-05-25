import { useState } from 'react';

import { CalendarView } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { calendarPageIcon } from '@/lib/modulePageIcons';
import { toast } from '@/lib/toast';

import { useInteractiveCalendarDemo } from './shared';

export function CalendarPage() {
  const [anchor, setAnchor] = useState(() => new Date('2024-12-10'));
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const calendar = useInteractiveCalendarDemo();

  return (
    <ModulePage
      title="Calendar"
      subtitle="Drag events to reschedule · resize edges · click or drag slots to create"
      icon={calendarPageIcon()}
    >
      <CalendarView
        anchor={anchor}
        onAnchorChange={setAnchor}
        view={view}
        onViewChange={setView}
        events={calendar.events}
        calendars={calendar.calendars}
        onCalendarVisibilityChange={calendar.onCalendarVisibilityChange}
        showCalendarLegend
        onEventClick={(event) => toast.info(`Event: ${event.title}`)}
        onEventMove={calendar.onEventMove}
        onEventResize={calendar.onEventResize}
        onSlotClick={calendar.onSlotClick}
        onSlotRangeSelect={calendar.onSlotRangeSelect}
        onDayClick={(day) => toast.info(`Day: ${day.toISOString().slice(0, 10)}`)}
        className="min-h-[520px] rounded-card bg-card"
      />
    </ModulePage>
  );
}
