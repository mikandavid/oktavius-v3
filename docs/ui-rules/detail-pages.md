# Detail pages

## Choose the pattern

| Entity                             | Pattern                                               |
| ---------------------------------- | ----------------------------------------------------- |
| Simple (users, single record)      | `<ModulePage>` + `<DetailView>` — one scroll, no tabs |
| Complex (clients, cases, projects) | `<ModulePage>` + `<Tabs>` + `<SectionCard>` per tab   |

**Never put `<DetailView>` inside `<Tabs>`** — it nests a Card inside tab content. Use `SectionCard` + field rows, or a dedicated Details tab with inline `<dl>` layout.

## ModulePage header

- `subtitle`: meta line + `<StatusBadge>` inline — never in `actions`
- `actions`: `<IconEditButton>` + `<IconDeleteButton>` only — icon-only, no visible text
- Delete: `<ConfirmActionDialog variant destructive>` wired to `open` state

## Complex entity — Overview tab (first tab)

1. `StatCard` row (3–5 KPIs)
2. `SectionCard` “Recent activity” — `<Timeline>`
3. `SectionCard` per sub-entity — top 3–5 `<ListRow>` items + “View all” ghost button to dedicated tab

Never show full sub-entity lists on Overview.

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
