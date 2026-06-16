# Contacts Module — Design Spec

**Date:** 2026-06-16
**Status:** Approved (design); pending implementation plan
**Module id:** `contacts`
**Source:** ported/adapted from `osiris_erp` `modules/contacts`

## Goal

Add a first-class **Contacts** module to oktavius-v3 — the foundational entity for
the trades + property segments and the first of the "90% coverage" modules. v1 is a
polished full-page CRUD experience wired to the real osiris `/contacts` API.

The experience target: the list is the landing surface, and a single contact reads
cleanly on its own full page (chosen layout: **Option A — full-page list → full-page
detail**, matching the Support module's familiarity).

## Scope

### In scope (v1)

- **List** — `CrudMainView`/`CrudTable` with search, Type + Category filters, sort,
  pagination, bulk delete, empty states.
- **Detail** — full-page read view (`ModulePage` + `DetailView`) with sections
  General · Address · Web · Tags & Notes.
- **Create / Edit** — full-page `EntityForm` (one component for both), sections
  General · Address · Web · Classification (categories + tags) · Notes.
- **Categories** — assign existing categories to a contact (multiselect) and filter
  the list by category. Reads `GET /contacts/categories`. **No** category management
  UI (create/rename/delete) in v1.
- **Tags** — free-form string tags.
- Wired to the real osiris `/contacts` API (list / get / create / update / soft-delete).

### Deferred (each blocked on a module v3 does not have yet — per the 2026-06-15 parity audit)

- **Credit-risk panel** — needs `doc-processing`.
- **Linked entities** — needs `clients` / `vendors` / `sales` / `projects` / `calendar`.
- **Generate document** — needs `template-gen`.
- **Custom fields** — custom-fields infra still missing in v3.
- **Site / branch selector** (`siteId`) — no `sites` module wired.
- **Bulk import** (CSV/Excel → contacts) — deferred to a focused follow-up pass; no
  "Import" button in the v1 header.
- **Category management UI** — assignment only in v1; management lives in settings later.

## Architecture

### 1. Routing & view state — single `/contacts` route, nuqs query params

V3 registers exactly one route per module (`router.tsx` maps each manifest entry to
`path: module.path`; there is no per-module nested-children support). Existing data
modules (Support, Storage) keep one route and drive sub-views via nuqs query params /
internal state rather than `/path/:id` URLs. Contacts follows the same pattern — **no
router changes**:

| URL                             | View                    |
| ------------------------------- | ----------------------- |
| `/contacts`                     | List                    |
| `/contacts?id=<uuid>`           | Detail (full page)      |
| `/contacts?id=<uuid>&mode=edit` | Edit (full page form)   |
| `/contacts?mode=new`            | Create (full page form) |

`ContactsPage` reads the params (via nuqs) and renders one of the three views inside
`ModulePage`. Back / Cancel clears the params. This gives shareable links and a working
back button without touching the router.

### 2. File structure (mirrors `support` / `storage`)

```
apps/web/src/modules/contacts/
  ContactsPage.tsx          # route host: reads nuqs params, selects the view
  ContactsListView.tsx      # CrudMainView + FilterToolbar + bulk delete
  ContactDetailView.tsx     # DetailView: General · Address · Web · Tags & Notes
  ContactFormView.tsx       # EntityForm for create + edit
  shared.tsx                # columns, row mapper, formFields, filter defs,
                            # category-label helper, type variantMap
  shared.test.ts
  data/
    contactsClient.ts       # fetch wrapper, snake_case→camelCase normalizers
    contactsClient.test.ts
    contactsKeys.ts         # org-scoped React Query key factory
    types.ts                # Contact, ContactCategory, list params + response
    useContactsData.ts      # query + mutation hooks
    useContactsData.test.tsx
```

### 3. Data layer (real osiris API)

- `contactsClient` is built from `resolveOsirisApiBaseUrl()`, uses `fetch` with
  `credentials: 'include'`, and surfaces failures via `readErrorMessage` (same shape as
  `supportClient`). All responses normalized snake_case → camelCase in the client.
- Endpoints consumed:
  - `GET /contacts` — query params: `page`, `pageSize` (default 20, max 100),
    `sort` (default `-created_at`), `search` (name/email/phone/mobile/fax/city),
    `isBusiness`, `contactType`/category filter (`categoryId`). Returns
    `{ data: Contact[], total, totalPages }`.
  - `GET /contacts/:id`
  - `POST /contacts`
  - `PATCH /contacts/:id`
  - `DELETE /contacts/:id` (soft delete)
  - `GET /contacts/categories` — for the form multiselect + list filter options.
  - `PUT /contacts/:id/categories` — set category assignments on save.
- React Query hooks (`useContactsData.ts`) scoped by `activeOrgId` from
  `useOptionalOsirisRuntime`. Query keys via `contactsKeys` (`root`, `list(params)`,
  `detail(id)`, `categories`). Mutations invalidate `contactsKeys.root(org)` and emit
  `appToast` on success / error.

### 4. Data model (Contact — v1 fields)

From osiris `contacts` table, the v1 subset:

- `id` (uuid), `orgId`
- `name` (required), `isBusiness` (boolean; Person/Business)
- `email`, `phone`, `mobile`, `fax`, `linkedin`
- `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`
- `clientCode`
- `categoryIds` (uuid[]) — via `/contacts/categories` + assignment endpoint
- `tags` (string[])
- `notes`
- `createdAt`, `updatedAt`

Excluded in v1: `siteId`, `customFields`, credit-risk fields. `contactType` (deprecated
in osiris) is not surfaced — categories supersede it.

### 5. Screens

**List (`ContactsListView`)**

- `CrudMainView` with `icon={modulePageIcon()}`.
- Columns (5; within the 5–7 visible rule): **Name** (avatar + name) · **Email** ·
  **Phone** · **Type** (Business/Person `StatusBadge` via shared `variantMap`) ·
  **Category**.
- `FilterToolbar` with 2 slots (**Type**, **Category**) + search box (3-slot limit honored).
- Default sort `-created_at`, pageSize 20.
- Row click → detail (`?id=`). Bulk-select → delete via `ConfirmActionDialog`.
- Empty states: "no contacts yet" (with New CTA) vs. "no matches" (filters active).
- Header: one `cta` "New contact" via `PageHeaderCtaLink`.

**Detail (`ContactDetailView`)**

- `ModulePage` + `DetailView`. Sections: General (email/phone/mobile/fax, type badge) ·
  Address · Web (LinkedIn) · Tags & Notes.
- Header: icon-only Edit + Delete (`IconEditButton` / `IconDeleteButton`); back affordance
  to the list. Status (Business/Person, category) in the subtitle.
- Unknown `id` → inline "contact not found" state.

**Create / Edit (`ContactFormView`)**

- `ModulePage` + `EntityForm`. Sections: General (name required, Business/Person toggle,
  email, phone, mobile, fax) · Address (6 fields) · Web (LinkedIn) · Classification
  (categories multiselect via `Combobox`, tags) · Notes.
- All selects use `Combobox` (never `Select`). Page submit = `variant="default"`; Cancel =
  `ghost`. On success → toast + navigate to detail (create) or back to detail (edit).

### 6. States & errors

- Loading skeletons in list + detail.
- Query error → inline message with retry.
- Mutation error → `appToast` error; success → `appToast` success.
- Soft-delete → return to list with success toast.

### 7. Registration

Single entry in `apps/web/src/lib/appNavModules.ts`:

```ts
{
  id: 'contacts',
  path: '/contacts',
  label: 'Contacts',
  labelKey: 'navigation.contacts',
  icon: ContactsIcon,            // from @/lib/icons
  section: 'modules',
  permission: 'contacts.view',
  loadPage: () => import('@/modules/contacts/ContactsPage'),
  pageExport: 'ContactsPage',
}
```

Write actions gated on `contacts.write`, delete on `contacts.delete`.

### 8. i18n

- New `contacts` namespace: `packages/i18n/locales/en/contacts.json`.
- Preloaded in `ContactsPage` via `usePreloadNamespaces(['contacts'])`.
- Port only the ~30 keys v1 uses (title, column labels, field labels, type/category
  labels, empty states, form section headers, confirm/toast strings). Skip credit-risk
  and linked-entities keys.
- Nav label via `labelKey: 'navigation.contacts'`.

## Testing

Vitest + React Testing Library using the established harness: pre-seeded
`QueryClientProvider` + `TestI18nProvider` + `MemoryRouter` + `NuqsAdapter`, data hooks
mocked via `vi.mock`.

- `contactsClient` normalizer tests (snake→camel, error handling).
- `shared.test.ts` — column/row mapper + filter config + category-label.
- List: renders rows, applies a filter, shows both empty states.
- Form: create + edit submit paths (validation on required `name`).
- Detail: renders sections; unknown id → not-found state.

## Design-system compliance (non-negotiable)

- `ModulePage` / `CrudMainView` everywhere with `icon`.
- White `bg-card` tiles, **no borders/shadow** on surfaces; page wash `bg-muted/40`.
- Inputs `bg-muted/60`; radius tokens `rounded-card` / `rounded-control`.
- Exactly one `cta` per header strip (the New contact button).
- `Combobox` (never `Select`); `@/lib/icons` (never `@phosphor-icons/react`); no custom
  `<table>`; no `window.confirm` (use `ConfirmActionDialog`).
- `StatusBadge` + shared `variantMap` for the Type column; dates via `formatDisplayDate`.
- `pnpm lint` clean.

## Out-of-scope follow-ups (tracked, not built here)

1. Bulk import wizard (CSV/Excel column mapping).
2. Category management UI (settings).
3. Linked-entities, credit-risk, doc-generation, custom fields, site selector — unlock
   as their dependency modules land in v3.
