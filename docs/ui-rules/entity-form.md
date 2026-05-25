# EntityForm

Use `<EntityForm>` for every create/edit form. Never hand-roll field grids.

## Surfaces

| Context                          | Props                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Full-page route (`/clients/new`) | Default `surface="page"` — nested card, submit `variant="default"`                                              |
| Dialog modal                     | `surface="dialog"` — no nested card, submit `variant="cta"`, `showHeader={false}` when parent has `DialogTitle` |

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Add party</DialogTitle></DialogHeader>
    <EntityForm surface="dialog" showHeader={false} fields={…} defaultValues={…} onSubmit={…} />
  </DialogContent>
</Dialog>
```

## Field rules

- Group with `section` — Identity, Contact, Contract, etc.
- Wide fields: `colSpan: 2` (notes, textarea, tags)
- Single-select: `type: 'combobox'` or `'select'` (both render Combobox)
- ISO country code: `type: 'country'` — stores `AT`, `DE`, …; optional `countryMode: 'dach' | 'all'`
- ISO currency code: `type: 'currencySelect'` — stores `EUR`, `USD`, … (distinct from `currency` amount input)
- Domain enums: `type: 'vocabulary'` with `vocabulary: 'salutation' | 'clientStatus' | …`
- Mutually exclusive visible options (2–4 choices): `type: 'radio'` with `options` and optional `radioOrientation`
- Entity pickers: `type: 'relation'` with optional `asyncItems`, `onCreate`, `footerAction`
- Phone numbers: `type: 'phone'` (country dial code + local number via `PhoneInput`)
- Structured address: `type: 'address'` with `countries` option list; value is `AddressValue`
- Booleans: `checkbox` or `switch` — label is inline, no outer `<Label>`
- Dates stored as ISO strings — display handled by `DatePicker`
- API / client errors: pass `errors={{ fieldName: 'Message' }}` to `EntityForm`, or set `error` on individual field defs
- Validation chrome: `FormField` forwards invalid ring to child — see `interactive-states.md`
- Confirmed valid values: `valid` on `FormField` only when explicitly verified (not every filled field)

## Input restrictions (keystroke filtering)

Field components strip invalid characters as the user types — do not rely on submit-time validation alone.

| Field type           | Allowed input                                                              | Component / helper                         |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| `number`             | Digits only (optional leading `-`)                                         | `NumberInput` with `decimals={0}`          |
| `currency`           | Decimal numbers                                                            | `NumberInput` with `decimals={2}`          |
| `phone`              | Digits and spaces in local part                                            | `PhoneInput` + `sanitizePhoneLocalInput`   |
| `email`              | No whitespace                                                              | `sanitizeEmailInput`                       |
| `url`                | No whitespace                                                              | `sanitizeUrlInput`                         |
| `address.postalCode` | Country-aware: digits-only (AT, DE, CH, …) or alphanumeric (GB, US, NL, …) | `AddressField` + `sanitizePostalCodeInput` |
| `address.city`       | Free text                                                                  | No filtering (names vary widely)           |

Postal code rules follow the selected address country. When the country changes, the postal value is re-sanitized. Prefer `type: 'number'` / `type: 'currency'` over raw `<Input type="number">`.

## Don't

- Raw `<Input>` / `<Combobox>` in page forms outside EntityForm
- `variant="cta"` on full-page submit buttons
- `<input type="date">` or native `<select>`
- Flat single-section forms when 4+ fields — always use `section`

Footer in dialogs: prefer built-in EntityForm submit, or `<DialogFormFooter confirmVariant="cta">`.
