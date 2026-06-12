import { CalendarEventEditorDialog, CalendarView } from '@oktavius/base-ui';
import { useState } from 'react';

import { ModulePage } from '@/components/common/PageLayout';
import { calendarPageIcon } from '@/lib/modulePageIcons';

import { useCalendarRuntime } from './shared';

export function CalendarPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const calendar = useCalendarRuntime();

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
        teamMembers={calendar.teamMembers}
        selectedTeamMemberIds={calendar.selectedTeamMemberIds}
        onTeamMemberVisibilityChange={calendar.onTeamMemberVisibilityChange}
        onSelectAllTeamMembers={calendar.onSelectAllTeamMembers}
        onClearTeamMembers={calendar.onClearTeamMembers}
        onCalendarVisibilityChange={calendar.onCalendarVisibilityChange}
        showSidebar
        onEventClick={calendar.onEventClick}
        onEventMove={calendar.onEventMove}
        onEventResize={calendar.onEventResize}
        onSlotClick={calendar.onSlotClick}
        onSlotRangeSelect={calendar.onSlotRangeSelect}
        className="min-h-[520px] rounded-card bg-card"
      />

      <CalendarEventEditorDialog
        draft={calendar.editorDraft}
        calendars={calendar.calendars}
        teamMembers={calendar.teamMembers}
        onOpenChange={(open) => {
          if (!open) calendar.cancelEditor();
        }}
        onSave={calendar.confirmSave}
        onDelete={calendar.deleteEvent}
      />
    </ModulePage>
  );
}
