# Calendar components

Component registry: [`component-registry.md`](./component-registry.md) (Calendar / Planning section).

## Primary component

Use **`<CalendarView>`** as the Google Calendar–style planner. It includes:

- Toolbar: Create (optional) · Today · prev/next · period title · **Day | Week | Month | Schedule** switcher
- **Month** — colored event pills with time prefix, click day → day view
- **Week / Day** — time grid, all-day row, current-time indicator, click slot → create
- **Schedule** — agenda list grouped by day with color stripe
- Optional **calendar legend sidebar** (`showCalendarLegend` + `calendars` prop)

Lower-level pieces (`SchedulerView`, `AgendaList`, `CalendarTimeGrid`) exist for edge cases — modules should default to `CalendarView`.

## Event model & colors

```ts
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date or datetime
  end: string;
  allDay?: boolean;
  calendarId?: string; // links to CalendarSource for color + visibility
  colorKey?: CalendarColorKey; // override source color
  resourceId?: string; // ResourceCalendar only
}

interface CalendarSource {
  id: string;
  label: string;
  color: CalendarColorKey; // violet | blue | teal | green | yellow | orange | red | gray
  visible?: boolean;
}
```

Events render with **solid calendar color fills** (Google Calendar style) from `CALENDAR_COLOR_STYLES` — full background on chips, time blocks, and agenda rows. Do not use side-accent-only styling.

## Module pattern (future `modules/calendar/`)

```
calendar/
├── shared.tsx           # events, calendarSources, page icon
└── CalendarPage.tsx     # ModulePage + CalendarView (single planner — no separate tabs)
```

```tsx
<CalendarView
  anchor={anchor}
  onAnchorChange={setAnchor}
  view={view}
  onViewChange={setView}
  events={events}
  calendars={sources}
  onCalendarVisibilityChange={toggleSource}
  showCalendarLegend
  leadingAction={<PageHeaderCtaLink …>Create</PageHeaderCtaLink>}
  onEventClick={openEvent}
  onSlotClick={openCreateAt}
/>
```

## Visual rules

- Shell: `schedulingShellClass` — no outer border on the card
- Body: `schedulingBodyClass` (`px-4 pb-4 pt-3`) — content never flush to edge
- Toolbar: Today + ghost icon nav + large period label (Google layout)
- View switcher: bordered segmented control (`CalendarViewSwitcher`)
- Week starts **Monday** — do not override

## Don't

- Split Day/Week/Month into separate pages — one `CalendarView` with `view` state
- Add FullCalendar or third-party schedulers
- Use `Timeline` for events — that's audit history; use Schedule view or `AgendaList`
- Import `@phosphor-icons/react` in `apps/web` — use `@/lib/icons`
