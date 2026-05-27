# CrudTable width

## List views (`CrudMainView`)

- Pass `columnStretch="all"` (default on `CrudMainView`).
- Host uses `.crud-table-host` — `contain: inline-size`, `max-width: 100%`, `overflow-x: hidden`.
- `columnSizeToFit={true}` — columns shrink/grow to viewport width; **no horizontal scroll**.
- Secondary columns use `hideBelow: 'md' | 'lg'` so list pages show the most important fields first.

## Do not persist column pixel widths when stretching

When `columnStretch="all"`, localStorage saves **order / hide / pin only** — not `width`. Saved pixel widths were forcing the grid wider than the card.

## Layout chain

`APP_MAIN_SCROLL_CLASS` includes `overflow-x-hidden`. Card: `w-full max-w-full min-w-0 overflow-hidden`.

## Manual resize

User column resize in fit mode is not persisted; table re-fits on reload.

## Column alignment

Use `resolveCrudColumnAlign` / `crudTableAlignClass` from `crudTableDensity`:

- **Left:** text, status badges, dates, badges
- **Right:** `type: 'currency'` and numeric columns with `align: 'right'` only
- Never center-align status or date columns

## Cell padding

Use `crudTableColumnPaddingClass` from `crudTableDensity` on header/cell inner wrappers (already applied in `CrudTable`):

| Case                              | Classes                    |
| --------------------------------- | -------------------------- |
| First data column                 | `pl-5` + default `pr-4`    |
| Last data column (no actions col) | `pr-5` + default `pl-*`    |
| First + last (single column)      | `pl-5 pr-5`                |
| Default column                    | `pl-4 pr-4`                |
| Right-aligned column              | `pl-3 pr-4` (last: `pr-5`) |
| Selection column                  | `pl-4 pr-2`                |
| Actions column                    | `pl-2 pr-5`                |

`CrudMainView` filter toolbar and pagination use `px-5` to align with table edges.

Do not use `px-2` on grid cells — content will hug the card edge.

## List CRUD (`CrudMainView`)

Pass `entityLabel` + `getRowHref` to enable standard list CRUD (on by default):

- Checkbox **multiselect** on each row
- Row **⋮** menu: Edit, Delete (with confirm)
- **Bulk bar** — own row above the grid (not over column headers); tint `bg-sidebar-primary/[0.06]`. Checkboxes use `sidebar-primary` when checked.
- **Bulk actions:** Edit only when `maxSelection: 1`; Delete selected for any count

Opt out with `enableListCrud={false}`. Append custom actions via `rowActions` / `bulkActions`. Hook deletes with `onDeleteRows`.
