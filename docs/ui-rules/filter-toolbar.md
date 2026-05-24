# Filter toolbar (`FilterToolbar`)

## Layout rule

**Always one horizontal row** — never stack search and filter dropdowns on separate lines.

Use CSS grid with **fixed slot count** (`FILTER_TOOLBAR_SLOT_COUNT = 3`) so filter comboboxes stay in the same place when switching list pages (Clients = 2 filters, Cases = 3, Contracts = 1).

```tsx
gridTemplateColumns: `minmax(8rem, 1.5fr) repeat(3, minmax(6.5rem, 1fr)) auto`;
```

| Slot       | Behavior                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| Search     | `1.5fr`, min 8rem                                                                   |
| Filter 1–3 | Always 3 columns; unused slots = empty `h-9` placeholder (no combobox)              |
| Trailing   | `auto`, `min-w-[5.75rem]` — Reset always reserves space (`invisible` when inactive) |

Filter label width: fixed `w-[4.75rem]`. Combobox value truncates inside slot.

## Don't

- Variable `flex-1` filter count per page (causes horizontal jump between routes)
- Hiding Reset without reserving width (layout shift)
- `flex-col` / multi-row filter stacks

Parent `CrudMainView` card must stay `w-full min-w-0`.
