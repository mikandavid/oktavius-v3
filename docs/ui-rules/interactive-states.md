# Interactive Control States

## Purpose

Standard state model for `@oktavius/base-ui` primitives and app wrappers. Agents must use these APIs — not ad-hoc spinners, red borders, or disabled hacks.

**Visual tokens:** [`visual-foundation.md`](./visual-foundation.md) § Interactive Affordances  
**Shared classes:** `packages/base-ui/src/lib/controlStates.ts`

---

## State vocabulary

| State                  | Meaning              | When to use                                                                                        |
| ---------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| **default**            | Resting, editable    | Normal idle control                                                                                |
| **hover**              | Pointer over control | Automatic via CSS — do not toggle in JS                                                            |
| **active / pressed**   | Mouse/touch down     | Automatic via `active:` — Button variants ship this                                                |
| **focus**              | Keyboard focus       | `focus-visible:ring-2 focus-visible:ring-ring/40` — automatic on primitives                        |
| **disabled / blocked** | Not interactive      | Native `disabled` — no hover, `opacity-50`, `cursor-not-allowed`                                   |
| **loading**            | Async in flight      | `Button loading` · `Combobox isLoading` · `PageSkeleton` at page level                             |
| **invalid**            | Validation failed    | `FormField error` · `EntityForm errors` · `aria-invalid` · red ring                                |
| **valid / confirmed**  | Explicit success     | Only after confirmed check (e.g. username available) — green ring; **never** on every filled field |

**Rule:** More states is not better. Pick only what the control type supports.

---

## State matrix by component

| Component             | hover      | active     | focus | disabled      | loading             | invalid              | valid       |
| --------------------- | ---------- | ---------- | ----- | ------------- | ------------------- | -------------------- | ----------- |
| `Button`              | ✅ variant | ✅ variant | ✅    | ✅ `disabled` | ✅ `loading`        | —                    | —           |
| `Input` / `Textarea`  | ✅         | —          | ✅    | ✅            | —                   | ✅                   | ✅ optional |
| `NumberInput`         | ✅         | —          | ✅    | ✅            | —                   | ✅                   | ✅ optional |
| `Combobox`            | ✅ trigger | —          | ✅    | ✅            | ✅ `isLoading`      | ✅                   | ✅ optional |
| `Checkbox` / `Switch` | ✅         | Radix      | ✅    | ✅            | —                   | ✅ `aria-invalid`    | —           |
| `DatePicker`          | ✅         | —          | ✅    | ✅            | —                   | ✅ parse error       | —           |
| `FormField`           | —          | —          | —     | —             | —                   | ✅ forwards to child | ✅ optional |
| `DialogFormFooter`    | —          | —          | —     | ✅            | ✅ `confirmLoading` | —                    | —           |
| `ListRow` / tabs      | ✅         | optional   | ✅    | ✅            | —                   | —                    | —           |
| `Card` / `StatCard`   | —          | —          | —     | —             | use `Skeleton`      | —                    | —           |

Display-only components (`Badge`, `StatusDot`, `AlertBanner`) do not get interaction states.

---

## API patterns

### Buttons

```tsx
<Button loading={isSaving} disabled={!canSave}>
  Save
</Button>

<Button size="icon" loading={isExporting} aria-label="Export" />
```

- `loading` sets `disabled`, `aria-busy`, and shows spinner.
- Do not swap children manually when `Button` supports `loading`.
- Icon-only loading: spinner replaces icon (`size="icon"`).

### Text inputs

```tsx
<FormField id="email" label="Email" error={errors.email}>
  <Input id="email" type="email" value={email} onChange={…} />
</FormField>

{/* Explicit confirmed valid — rare */}
<FormField id="handle" label="Handle" valid={handleAvailable}>
  <Input id="handle" value={handle} valid={handleAvailable} />
</FormField>
```

- `FormField` with `error` forwards `aria-invalid` + destructive ring to child.
- Pass `valid` only when you have explicit confirmation — not for “field has text”.

### EntityForm + backend validation

```tsx
// Backend 422 / field errors → map to EntityForm
<EntityForm
  fields={clientFormFields}
  errors={{ email: 'Email already registered', vatId: 'Invalid VAT number' }}
  onSubmit={handleSubmit}
/>
```

Backend agents: return field-keyed error objects; frontend passes them as `errors`. Do not invent inline red `<div>` styling.

### Combobox async

```tsx
<Combobox
  options={options}
  value={value}
  onChange={setValue}
  isLoading={isFetching}
  invalid={Boolean(errors.clientId)}
/>
```

### Dialog submit

```tsx
<DialogFormFooter
  confirmLabel="Create"
  confirmLoading={isSubmitting}
  confirmDisabled={!isValid}
  confirmType="submit"
  confirmForm="party-form"
/>
```

Or use `<EntityForm>` built-in submit (`isSubmitting` → disabled + label swap; prefer adding `loading` on submit `Button` when customizing).

---

## Shared helpers (base-ui)

```typescript
import {
  filledControlClasses,
  filledControlStateClasses,
  controlValidationClasses,
  resolveControlValidationState,
  type ControlValidationState,
} from '@oktavius/base-ui';
```

Use when building **new** filled triggers (custom pickers, inline editors) — do not duplicate hover/focus/disabled strings.

---

## Agent rules

### Frontend agents

1. Use primitive state props — never hand-roll `animate-spin` on `Button` when `loading` exists.
2. Validation errors: `FormField` + `EntityForm errors` — not wrapper-only `role="alert"` without ring on control.
3. Do not set `valid` on every non-empty input.
4. Disabled + loading: use `loading` alone on buttons (it implies disabled).
5. Custom click targets: `interactiveSurfaceClasses` / `interactiveTextClasses` from `lib/utils.ts`.

### Backend agents

1. Validation failures: `{ field: string, message: string }[]` or `{ [field]: message }` shape consumable by `EntityForm`.
2. Do not return HTML error snippets — plain text messages only.
3. Blocking operations: frontend sets `loading` / `isLoading`; API should be idempotent where retries are possible.

---

## Pre-submit checklist (states)

1. Submit buttons use `loading` while async.
2. Form errors wired through `EntityForm errors` or `FormField error`.
3. Invalid controls show ring + error text (not text alone).
4. No hover styles on `disabled` controls.
5. Icon actions use `Button size="icon"` + tooltip, not unstyled `<button>`.
