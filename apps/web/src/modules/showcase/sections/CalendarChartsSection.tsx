import { useState } from 'react';

import { CalendarView, ChartCard } from '@oktavius/base-ui';

import { useInteractiveCalendarDemo } from '@/modules/calendar/shared';
import { toast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const REVENUE_DATA = [
  { label: 'Jul', value: 32000 },
  { label: 'Aug', value: 38500 },
  { label: 'Sep', value: 41200 },
  { label: 'Oct', value: 39800 },
  { label: 'Nov', value: 45100 },
  { label: 'Dec', value: 51340 },
];

const ORDERS_DATA = [
  { label: 'Licenses', value: 18 },
  { label: 'Services', value: 12 },
  { label: 'Hardware', value: 7 },
  { label: 'Support', value: 9 },
];

export function CalendarChartsSection() {
  const [anchor, setAnchor] = useState(() => new Date('2024-12-10'));
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const calendar = useInteractiveCalendarDemo();

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="CalendarView"
        meta="Week/day: drag events · resize edges · click or drag empty slots to create"
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
          className="min-h-[420px]"
        />
      </ShowcaseBlock>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue trend"
          meta="Last 6 months"
          type="line"
          data={REVENUE_DATA}
          valueFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
        />
        <ChartCard
          title="Orders by category"
          meta="Current quarter"
          type="bar"
          data={ORDERS_DATA}
        />
      </div>
    </div>
  );
}
