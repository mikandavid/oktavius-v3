import {
  CalendarEventEditorDialog,
  CalendarEventQuickCreate,
  CalendarView,
  ChartCard,
  SimpleSparklineChart,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { useShowcaseCalendarDemo } from '../fixtures/calendarDemo';
import { ShowcaseBlock } from '../shared';

const ORDERS_DATA = [
  { label: 'Licenses', value: 18 },
  { label: 'Services', value: 12 },
  { label: 'Hardware', value: 7 },
  { label: 'Support', value: 9 },
];

const REVENUE_DATA = [
  { label: 'Jul', value: 32000 },
  { label: 'Aug', value: 38500 },
  { label: 'Sep', value: 41200 },
  { label: 'Oct', value: 39800 },
  { label: 'Nov', value: 45100 },
  { label: 'Dec', value: 51340 },
];

const ORDER_STATUS_DATA = [
  { label: 'Draft', value: 4 },
  { label: 'Confirmed', value: 11 },
  { label: 'Fulfilled', value: 18 },
  { label: 'Cancelled', value: 2 },
];

const PIPELINE_FUNNEL = [
  { label: 'Leads', value: 120 },
  { label: 'Qualified', value: 64 },
  { label: 'Proposal', value: 28 },
  { label: 'Won', value: 11 },
];

const STACKED_PIPELINE = [
  {
    label: 'Q1',
    value: 0,
    segments: [
      { key: 'New', value: 12 },
      { key: 'Active', value: 24 },
      { key: 'Won', value: 8 },
    ],
  },
  {
    label: 'Q2',
    value: 0,
    segments: [
      { key: 'New', value: 15 },
      { key: 'Active', value: 21 },
      { key: 'Won', value: 10 },
    ],
  },
  {
    label: 'Q3',
    value: 0,
    segments: [
      { key: 'New', value: 18 },
      { key: 'Active', value: 19 },
      { key: 'Won', value: 12 },
    ],
  },
];

const MULTI_LINE_REVENUE = [
  { label: 'Jul', revenue: 32000, margin: 8400 },
  { label: 'Aug', revenue: 38500, margin: 10200 },
  { label: 'Sep', revenue: 41200, margin: 11100 },
  { label: 'Oct', revenue: 39800, margin: 9800 },
  { label: 'Nov', revenue: 45100, margin: 12400 },
  { label: 'Dec', revenue: 51340, margin: 14200 },
];

const REVENUE_SERIES = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'margin', label: 'Margin' },
];

const COMBO_DATA = [
  { label: 'Jul', barValue: 38, lineValue: 32000 },
  { label: 'Aug', barValue: 44, lineValue: 38500 },
  { label: 'Sep', barValue: 41, lineValue: 41200 },
  { label: 'Oct', barValue: 36, lineValue: 39800 },
  { label: 'Nov', barValue: 47, lineValue: 45100 },
  { label: 'Dec', barValue: 52, lineValue: 51340 },
];

const TOP_CLIENTS = [
  { label: 'Apex Tech', value: 48 },
  { label: 'Northwind', value: 36 },
  { label: 'Contoso', value: 29 },
  { label: 'Fabrikam', value: 22 },
  { label: 'Globex', value: 18 },
];

const RADAR_KPIS = [
  { subject: 'Sales', actual: 82, target: 90 },
  { subject: 'Support', actual: 76, target: 80 },
  { subject: 'Delivery', actual: 88, target: 85 },
  { subject: 'Quality', actual: 91, target: 88 },
  { subject: 'Retention', actual: 74, target: 82 },
];

const RADAR_SERIES = [
  { key: 'actual', label: 'Actual' },
  { key: 'target', label: 'Target' },
];

export function CalendarChartsSection() {
  const [anchor, setAnchor] = useState(() => new Date('2024-12-10'));
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const calendar = useShowcaseCalendarDemo();

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="CalendarView"
        meta="Week/day: drag events · resize edges · click or drag empty slots to open create editor"
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
          className="min-h-[420px]"
        />
        <CalendarEventQuickCreate
          draft={calendar.createDraft}
          calendars={calendar.calendars}
          teamMembers={calendar.teamMembers}
          onOpenChange={(open) => {
            if (!open) calendar.cancelEditor();
          }}
          onSave={calendar.confirmSave}
        />
        <CalendarEventEditorDialog
          draft={calendar.editDraft}
          calendars={calendar.calendars}
          teamMembers={calendar.teamMembers}
          onOpenChange={(open) => {
            if (!open) calendar.cancelEditor();
          }}
          onSave={calendar.confirmSave}
          onDelete={calendar.deleteEvent}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="Sparkline" meta="Inline trend · StatCard companion">
        <div className="flex max-w-xs items-end justify-between rounded-card border border-border/60 bg-card px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Revenue (6 mo)</p>
            <p className="text-xl font-semibold text-foreground">€ 51.3k</p>
          </div>
          <SimpleSparklineChart data={REVENUE_DATA} height={44} className="w-28" />
        </div>
      </ShowcaseBlock>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Revenue trend"
          meta="Gradient area"
          type="area"
          data={REVENUE_DATA}
          valueFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
        />
        <ChartCard
          title="Revenue vs margin"
          meta="Multi-line"
          type="multi-line"
          multiSeriesData={MULTI_LINE_REVENUE}
          series={REVENUE_SERIES}
          valueFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
        />
        <ChartCard
          title="Orders + revenue"
          meta="Bar + line combo"
          type="combo"
          comboData={COMBO_DATA}
          barLabel="Orders"
          lineLabel="Revenue"
          valueFormatter={(v) => (v > 200 ? `€${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <ChartCard title="Orders by category" meta="Vertical bars" type="bar" data={ORDERS_DATA} />
        <ChartCard
          title="Top clients"
          meta="Horizontal bars"
          type="horizontal-bar"
          data={TOP_CLIENTS}
          valueFormatter={(v) => `€${v}k`}
        />
        <ChartCard title="Status mix" meta="Donut + legend" type="pie" data={ORDER_STATUS_DATA} />
        <ChartCard
          title="Team KPIs"
          meta="Radar · actual vs target"
          type="radar"
          radarData={RADAR_KPIS}
          series={RADAR_SERIES}
        />
        <ChartCard
          title="Sales funnel"
          meta="Gradient stages"
          type="funnel"
          funnelData={PIPELINE_FUNNEL}
        />
        <ChartCard
          title="Pipeline by quarter"
          meta="Stacked new / active / won"
          type="stacked-bar"
          stackedData={STACKED_PIPELINE}
        />
        <ChartCard
          title="Target attainment"
          meta="Semantic gauge"
          type="gauge"
          gaugeValue={72}
          gaugeLabel="Quota"
        />
      </div>
    </div>
  );
}
