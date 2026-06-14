# Settings UI — One-Line Rows (info left, input right)

**Date:** 2026-06-14
**Branch:** FE
**Status:** Approved

## Problem

Several settings sections use paired (`PackedRow`) and `layout="stacked"` rows that
put inputs below their label or two-per-line. The desired layout is uniform: every
settings field on one line — label + description on the left, control on the right.

## Decisions

- One-line inline rows for all simple/paired fields.
- Keep genuine multi-line textareas (invoice footer, agent instructions) and table/list
  managers (Catalogs, Locations overview) full-width as deliberate exceptions.
- Scope: all `/settings` tabs (profile page not included).

## Design

### 1. `packages/base-ui/src/components/settings-layout.tsx` — `SettingsRow`

Add optional `align?: 'center' | 'start'` for inline layout (default `center`). `start`
top-aligns the control with the label, for taller controls (MultiSelect, input + error
message). Backward-compatible; `stacked` layout unaffected.

### 2. `OrganizationSettingsSection.tsx`

- Split the 5 `PackedRow`s into 10 inline `SettingsRow`s, each using `INPUT_WIDTH`:
  Street, Address Line 2, Postal Code, City, Tax ID, VAT ID, Email, Phone, Bank Name,
  Account Holder.
- IBAN & BIC → inline rows with `align="start"`; the validation error stays directly
  under the input inside the right cell.
- Invoice Footer Text → stays stacked (textarea exception).
- Reuse existing per-field caption i18n keys as row labels. The now-unused combined keys
  (`address`, `postalCity`, `taxAndVatId`, `emailPhone`, `bank`) remain in the locale
  files (harmless).
- Drop `PackedRow`/`PackedField` imports.

### 3. `AiSettingsSection.tsx`

Remove the 2-column grid; "Warning threshold (%)" and "Hard limit threshold (%)" become
inline one-line rows (NumberInput right). Agent Instructions textareas unchanged.

### 4. `LocationPolicySettingsSection.tsx`

"Org-shared modules" MultiSelect → inline `align="start"` with a constrained
right-column width; chips wrap inside.

### 5. `SettingsPage.tsx` (General section)

Date Format / Time Format `PackedRow` → two inline `SettingsRow`s.

### 6. `settingsForm.tsx`

Delete `PackedRow`/`PackedField` once no consumers remain. Keep `INPUT_WIDTH`,
`SHORT_INPUT_WIDTH`, `CONTROL_WIDTH`, and `SettingsAutosaveFooter`.

### Right-column consistency

Keep the shared width constants so every control's right edge lines up.

## Testing

- `SettingsRow`: test `align="start"` produces top-aligned inline layout.
- `OrganizationSettingsSection.test.tsx`: assert previously-paired fields render as
  distinct labeled rows (Street, VAT ID, Bank Name, etc.).
- Full web test suite, typecheck, lint.

## Out of scope

- Profile notification settings.
- Restructuring the Catalogs/Locations table managers or the Mail/WhatsApp panels.
