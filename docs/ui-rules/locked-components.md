# Locked components

Components whose **styling and layout rules must not be overridden** in `apps/web`. Use the named export; do not pass ad-hoc `classNames` or strip styles with long `className` hacks.

**Agent rule:** If the need matches a row below, use that component. Do not restyle the generic wrapper.

Related: [`calendar-components.md`](./calendar-components.md) · [`agent-contract.md`](./agent-contract.md)

---

## Locked today

| Component                      | Use for                                           | Never use instead                            |
| ------------------------------ | ------------------------------------------------- | -------------------------------------------- |
| **`CalendarMiniPicker`**       | Sidebar jump-to-date, compact month grid          | Raw `<Calendar classNames={…}>`              |
| **`CalendarSidebar`**          | Planner left panel (team, calendars, mini picker) | Custom sidebar + raw Calendar                |
| **`CalendarSidebarToggleRow`** | Checkbox filter rows in calendar sidebar          | Radix `Checkbox` + custom row markup         |
| **`CalendarSidebarSection`**   | Sidebar section headers                           | `CollapsibleSection` in narrow filter panels |

Implementation: `packages/base-ui/src/components/scheduling/calendar-mini-picker.tsx`

### CalendarMiniPicker — locked rules

1. Weekday row + each week row: `grid grid-cols-7` (never `flex w-full` + fixed `w-7` headers).
2. Nav: in-flow top bar (`flex justify-between`); no `absolute` on `button_previous` / `button_next`; no `navLayout="around"`.
3. Month browsing: `month` + `onMonthChange`; sync month when `selected` changes externally.
4. Selected day: `bg-cta` + `text-cta-foreground` together — no week-highlight modifiers with bg/ring on day buttons.
5. Week starts Monday (`weekStartsOn={1}`).

Tests: `packages/base-ui/src/components/scheduling/calendar-mini-picker.test.tsx`

---

## Audit — dual-purpose components (prioritized)

Components that serve multiple contexts today. **Locked** = extract + document (like calendar). **Document** = keep one component, add usage rules. **Planned** = not yet extracted.

| Priority | Component                                                  | Risk     | Contexts                                       | Status / fix                                                                                       |
| -------- | ---------------------------------------------------------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P0       | **`CalendarMiniPicker`**                                   | High     | Popover vs sidebar month grid                  | **Locked**                                                                                         |
| P1       | **`SplitView`**                                            | High     | Resizable demo vs fill-height document preview | **Documented** — native grid, pixel widths, no percentage panel state                              |
| P1       | **`Combobox`**                                             | High     | Form field vs toolbar ghost filter             | **Planned** — `appearance="toolbar"` or `ComboboxFilter`; stop stripping styles in `FilterToolbar` |
| P2       | **`CalendarView`**                                         | Med–High | Full page vs showcase embed                    | **Document** — prefer built-in sizing; avoid page `min-h-[…]` hacks                                |
| P2       | **`EntityForm`**                                           | Medium   | Page 2-col vs dialog 1-col                     | **Document** — `surface="page" \| "dialog"` matrix; avoid layout branching in modules              |
| P2       | **`PopoverContent`**                                       | Medium   | Dropdown vs notification panel                 | **Planned** — `PopoverPanel` preset (`p-0`, width, max-height)                                     |
| P3       | **`Chart` / `ChartCard`**                                  | Medium   | Dashboard tile vs inline sparkline             | **Document** — portal tooltips vs scroll containers                                                |
| P3       | **`DatePicker`**                                           | Medium   | Form vs datetime split trigger                 | **OK** — styling contained in base-ui                                                              |
| P3       | **`FileInput` vs `PageFileDrop`**                          | Medium   | Single file field vs page drop zone            | **Planned** — unify upload API in base-ui                                                          |
| P3       | **`CalendarEventForm`**                                    | Medium   | Uses Radix `Select` for calendar pick          | **Planned** — align with `Combobox` standard                                                       |
| P4       | **`Drawer`**                                               | Low–Med  | Mobile nav vs bottom sheet                     | **Document** — `side` + shell class pairings                                                       |
| P4       | **`SettingsLayout`**                                       | Low–Med  | Settings vs fill-height showcase               | **Document** — when to pass `contentClassName` for overflow                                        |
| P4       | **`KanbanBoard`**, **`RichTextEditor`**, **`MultiSelect`** | Low      | Single primary context each                    | **OK as-is**                                                                                       |

---

## Anti-patterns (agents)

```tsx
// ❌ Sidebar month grid — fights react-day-picker v9 DOM
<Calendar classNames={{ nav: 'absolute …', week: 'flex w-full' }} />

// ❌ Toolbar filter — strips Combobox chrome ad hoc
<Combobox className="border-0 bg-transparent shadow-none …" />

// ❌ Queue split — tiny or fixed sidebar
<SplitView defaultSidebarSize={18} minSidebarSize={14} maxSidebarSize={35} … />
<SplitView resizable={false} sidebarColumn="minmax(280px, 340px)" … />

// ✅ Use locked / purpose-built APIs
<CalendarMiniPicker selected={anchor} onSelect={setAnchor} />
<SplitView persistKey="…" defaultSidebarWidth={400} minSidebarWidth={320} maxSidebarWidth={760} … />
```

---

## Adding a new locked component

When a generic base-ui wrapper breaks in a second context:

1. Extract `{Name}{Variant}.tsx` with styling locked inside (no `classNames` prop).
2. Add row to **Locked today** table above.
3. Add JSDoc on the generic wrapper: “Use `{Variant}` for …”.
4. Add vitest smoke/regression tests for DOM structure and interaction.
5. Update [`component-registry.md`](./component-registry.md) and `.cursor/rules/locked-components.mdc`.

---

## Verification

```bash
pnpm test                          # base-ui vitest
pnpm check                         # lint + typecheck
```

Before merging changes to locked components or their generic wrappers, run tests and manually spot-check `/calendar` + `/showcase`.
