# Calendar components

Component registry: [`component-registry.md`](./component-registry.md) (Calendar / Planning section).

## Primary component

Use **`<CalendarView>`** as the Google Calendar–style planner. It includes:

- Toolbar: Create (optional) · Today · prev/next · period title · **Day | Week | Month | Schedule** switcher
- **Month** — colored event pills with time prefix, click day → day view
- **Week / Day** — time grid, all-day row, current-time indicator
  - **Click** empty slot → create (via `onSlotClick`)
  - **Drag** empty slot range → create block (via `onSlotRangeSelect`)
  - **Drag** event → reschedule (`onEventMove`)
  - **Resize** event top/bottom edges (`onEventResize`)
- **Schedule** — agenda list grouped by day with color stripe
- Optional **left sidebar** (`showSidebar`) — team filters, calendar legend, mini month picker

Lower-level pieces (`SchedulerView`, `AgendaList`, `CalendarTimeGrid`) exist for edge cases — modules should default to `CalendarView`.

## Sidebar (`CalendarSidebar`)

Used internally by `CalendarView` when `showSidebar` is true. Composes:

| Section      | Component                  | Notes                                        |
| ------------ | -------------------------- | -------------------------------------------- |
| Team         | `CalendarSidebarToggleRow` | Same checkbox row pattern as calendar legend |
| Calendars    | `CalendarSourceLegend`     | Native checkbox + color dot                  |
| Jump to date | **`CalendarMiniPicker`**   | Do not replace with raw `<Calendar>`         |

Sidebar layout: `hidden lg:flex lg:flex-col w-60` beside the main grid (toolbar spans main column only).

Toggle rows live in `calendar-sidebar-primitives.tsx` — reuse these for any new sidebar sections.

## Mini month picker (`CalendarMiniPicker`)

**Always use this** for compact jump-to-date UI (sidebar, filters, panels).

```tsx
<CalendarMiniPicker selected={anchor} onSelect={setAnchor} />
```

Implementation: `packages/base-ui/src/components/scheduling/calendar-mini-picker.tsx`

### Why a dedicated component

`react-day-picker` v9 changed DOM structure vs older shadcn examples. The base `<Calendar>` (`components/calendar.tsx`) targets **popover/date fields** — absolute nav buttons, `w-9` cells. Reusing it in a sidebar with ad hoc `classNames` caused:

- Nav arrows missing or unclickable (`absolute` + wrong layout mode)
- White-on-white selected days (`text-cta-foreground` on `bg-muted` from stacked modifiers)
- Grid misalignment (weekday `w-7` headers vs `flex w-full` date rows)

All mini-picker styling is **locked inside `CalendarMiniPicker`**. Do not duplicate or override.

### Locked rules (agents — follow exactly)

1. **Grid** — `weekdays` and each `week` use `grid grid-cols-7`. Never `flex w-full` on week rows with fixed-width weekday headers.
2. **Nav** — default top `<nav>` with `flex justify-between` and **in-flow** nav buttons. Do not use `navLayout="around"` or `absolute left-1` / `right-1` on nav buttons.
3. **Month state** — `month` + `onMonthChange` (controlled browsing) plus `selected` for the chosen day. Sync displayed month when `selected` changes month externally.
4. **Selection styling** — only the `selected` class sets fill: `bg-cta` + `text-cta-foreground` together. Do not add per-week `modifiersClassNames` with background or ring on day buttons.
5. **Outside days** — `outside` class only (`text-muted-foreground/45`). No extra opacity stacks.
6. **Week start** — Monday (`weekStartsOn={1}`).

### Do not

- Style sidebar pickers by passing `classNames` to raw `<Calendar>`
- Copy osiris ERP `CalendarV2Sidebar` markup — different stack (FullCalendar era patterns)
- Add CollapsibleSection to sidebar filter lists — use `CalendarSidebarSection`
- Mix Radix `Checkbox` and native checkboxes in the same sidebar

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

## Module pattern

```
calendar/
├── shared.tsx           # events, calendarSources, team filter state
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
  teamMembers={teamMembers}
  selectedTeamMemberIds={selectedTeamMemberIds}
  onTeamMemberVisibilityChange={toggleTeamMember}
  onSelectAllTeamMembers={selectAllTeam}
  onClearTeamMembers={clearTeam}
  onCalendarVisibilityChange={toggleSource}
  showSidebar
  onEventClick={openEvent}
  onEventMove={moveEvent}
  onEventResize={resizeEvent}
  onSlotClick={openCreateAt}
  onSlotRangeSelect={openCreateRange}
/>
```

## Visual rules

- Shell: `schedulingShellClass` — no outer border on the card
- Body: `schedulingBodyClass` (`px-4 pb-4 pt-3`) — content never flush to edge
- Toolbar: Today + ghost icon nav + large period label (Google layout)
- View switcher: bordered segmented control (`CalendarViewSwitcher`)
- Week starts **Monday** — do not override

## Component map

| Need                                 | Use                                                  |
| ------------------------------------ | ---------------------------------------------------- |
| Full planner page                    | `CalendarView`                                       |
| Sidebar team + calendars + jump date | `CalendarSidebar` (via `showSidebar`)                |
| Standalone mini month                | `CalendarMiniPicker`                                 |
| Form / popover date                  | `DatePicker` → base `Calendar`                       |
| Calendar visibility list             | `CalendarSourceLegend`                               |
| Sidebar section / toggle row         | `CalendarSidebarSection`, `CalendarSidebarToggleRow` |

## Don't

- Split Day/Week/Month into separate pages — one `CalendarView` with `view` state
- Add FullCalendar or third-party schedulers
- Use `Timeline` for events — that's audit history; use Schedule view or `AgendaList`
- Import `@phosphor-icons/react` in `apps/web` — use `@/lib/icons`
- Customize mini picker by overriding `<Calendar classNames={…}>` in app code
