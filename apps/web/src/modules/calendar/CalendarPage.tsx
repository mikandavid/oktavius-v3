import { useState } from 'react';

import { CalendarEventQuickCreate, CalendarView } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { calendarPageIcon } from '@/lib/modulePageIcons';

import { useInteractiveCalendarDemo } from './shared';

export function CalendarPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const calendar = useInteractiveCalendarDemo();

  return (
    <ModulePage
      title="Calendar"
      subtitle="Click events to edit · drag to reschedule · click or drag slots to create"
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
        onEventClick={calendar.onEventClick}
        onEventMove={calendar.onEventMove}
        onEventResize={calendar.onEventResize}
        onSlotClick={calendar.onSlotClick}
        onSlotRangeSelect={calendar.onSlotRangeSelect}
        className="min-h-[520px] rounded-card bg-card"
      />

      <CalendarEventQuickCreate
        draft={calendar.editorDraft}
        calendars={calendar.calendars}
        onOpenChange={(open) => {
          if (!open) calendar.cancelEditor();
        }}
        onSave={calendar.confirmSave}
      />
    </ModulePage>
  );
}
