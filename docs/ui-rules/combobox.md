# Single-select dropdowns

## Use `Combobox` only

All single-choice dropdowns (forms, filter toolbars, settings, token editor) use `<Combobox>` from `@oktavius/base-ui`.

| Use                                                                        | Don't                                         |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| `<Combobox options value onChange />`                                      | `<Select>` / `<SelectTrigger>` / Radix select |
| `EntityForm` `type: 'combobox'` or `type: 'select'` (both render Combobox) | `type: 'select'` wired to Radix Select        |
| `FilterToolbar` filter slots                                               | Plain `<Select>` in filters                   |

`Select` remains in `@oktavius/base-ui` for legacy only — **do not import it in `apps/web`**.

## Combobox features

- Built-in search field in the popover — **Enter** selects the first visible (non-disabled) match
- `asyncItems`, `onCreate`, `footerAction` for advanced forms
- `clearable={false}` for required filters (e.g. "All" row in `FilterToolbar`)
- `className` to match context (`h-9` forms, ghost inline styles in toolbar)

## Multi-select

Use `<MultiSelect>` — not Combobox, not Select.
