import { useState } from 'react';

import {
  CalendarEventEditorDialog,
  CalendarEventQuickCreate,
  CalendarView,
  ChartCard,
  SimpleSparklineChart,
} from '@oktavius/base-ui';

import {
  COMBO_DATA,
  MULTI_LINE_REVENUE,
  ORDER_STATUS_DATA,
  PIPELINE_FUNNEL,
  RADAR_KPIS,
  RADAR_SERIES,
  ReportBuilderPanel,
  REVENUE_DATA,
  REVENUE_SERIES,
  STACKED_PIPELINE,
  TOP_CLIENTS,
} from '@/components/reports/ReportBuilderPanel';

import { useInteractiveCalendarDemo } from '@/modules/calendar/shared';

import { ShowcaseBlock } from '../shared';

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

      <ShowcaseBlock title="ReportBuilderPanel" meta="Saved report configs · live chart preview">
        <ReportBuilderPanel />
      </ShowcaseBlock>
    </div>
  );
}
