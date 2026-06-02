# Detail pages

## Choose the pattern

| Entity / workflow                                                           | Pattern                                                                                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Simple record (users, contacts, basic config)                               | `<ModulePage>` + `<DetailView>` — one scroll, no tabs                                                                               |
| Long record with many sections (profile, compliance, settings-like details) | `<ModulePage layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}>` + `<AppSectionNavLayout>` — see [`section-nav.md`](./section-nav.md) |
| Operational workspace with peer modes (case workbench, project workspace)   | `<ModulePage>` + `<Tabs>` + `<SectionCard>` per tab, only after the modes are genuinely separate workflows                          |
| Queue or master-detail workflow                                             | `<ModulePage fillHeight>` + `<SplitView>` — see [`split-view-master-detail.md`](./split-view-master-detail.md)                      |
| Preview-led workflow (documents, storage)                                   | `<ModulePage fillHeight>` + preview/split layout — see [`fill-height-pages.md`](./fill-height-pages.md)                             |

**Never put `<DetailView>` inside `<Tabs>`** — it nests a Card inside tab content. Use `SectionCard` + field rows, or a dedicated Details tab with inline `<dl>` layout.

**Tabs are not the default for complexity.** Before adding a top tab bar, choose the page anatomy:

1. If users mostly read the record, use `DetailView`.
2. If users scan many sections in one record, use `AppSectionNavLayout`.
3. If users choose records from a queue and work one at a time, use `SplitView`.
4. If users compare or inspect files, make the preview the dominant surface.
5. Use tabs only for peer work modes that users intentionally switch between, such as Overview / Activity / Files on a true workspace.

## ModulePage header

- `subtitle`: meta line + `<StatusBadge>` inline — never in `actions`
- `actions`: `<IconEditButton>` + `<IconDeleteButton>` only — icon-only, no visible text
- Delete: `<ConfirmActionDialog variant destructive>` wired to `open` state

## Workspace tabs — Overview tab (first tab)

1. `StatCard` row — use `STAT_CARD_GRID_CLASS`, max 6 KPIs
2. `SectionCard` “Recent activity” — `<Timeline>`
3. `SectionCard` per sub-entity — top 3–5 `<ListRow>` items + “View all” ghost button to dedicated tab

Never show full sub-entity lists on Overview.

## DetailView field hierarchy

Cards must not look like spreadsheets. Use `importance` on each field:

| Importance | Layout                                           | When                                    |
| ---------- | ------------------------------------------------ | --------------------------------------- |
| `primary`  | `RecordInfoHero` — large value + optional `icon` | 2–6 key facts (status, contact, amount) |
| `default`  | Two-column grid                                  | Supporting fields                       |
| `meta`     | `RecordInfoMeta` footer strip                    | IDs, revision, audit timestamps         |

Field labels: sentence case via `CARD_CONTENT_TIERS.label` — never uppercase column headers.

See `docs/ui-rules/hierarchy-system.md` § Card Content Tiers for the six fixed typography sizes.

## Sub-entity lists (Parties, Tasks, …)

```tsx
<SectionCard
  title="Parties"
  actions={<Button variant="outline" size="sm"><PlusIcon /> Add</Button>}
>
  {items.length ? items.map(…) : <InlineEmptyState text="…" centered />}
</SectionCard>
```

- Items: `<ListRow>` with `<Avatar leading>`, title, subtitle, trailing actions
- Add/edit: `<SubEntityFormDialog>` from `@/components/common/SubEntityFormDialog` — never hand-roll dialog + form markup
- Tick-off lists: `<ChecklistSection items onToggle>` — done = checkbox + **muted strikethrough label** + row opacity; `readOnly` for overview previews. See [`checklist.md`](./checklist.md).
- Empty sub-list: `<InlineEmptyState>` — not `<EmptyState>`

## Section titles

Use `SectionCard` title style: `text-sm font-semibold text-foreground` — sentence case, no ALL-CAPS.
