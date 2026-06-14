# WhatsApp Settings Tab — Design

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Scope:** Frontend only. Port the osiris WhatsApp settings UI into the V3 Settings page as a new tab.

## Goal

Add a **WhatsApp** tab to the V3 Settings page (`modules/settings/SettingsPage.tsx`) that reproduces, at full parity, the osiris WhatsApp settings:

1. **Connection status** — bot connection state (disconnected / connecting / connected), phone number, uptime, with 30s polling.
2. **Messaging policies** — org-wide auto-reply toggle, DM policy, group policy.
3. **Allowed contacts** — allowlist CRUD: add / edit / delete contacts, each with optional display name, linked org user, WhatsApp role override, and per-contact auto-reply.

The osiris `/whatsapp` backend API (`osiris_erp/apps/api/src/routes/whatsapp.ts`) is assumed live and reachable from the V3 frontend's configured API base URL. **No backend work is in scope.**

## Background / source

The osiris implementation lives in:

- `osiris_erp/apps/web/src/routes/_auth.settings.whatsapp.tsx` (route shell)
- `osiris_erp/apps/web/src/modules/profile/components/WhatsAppCard.tsx` (`WhatsAppConnection`)
- `osiris_erp/apps/web/src/modules/profile/components/WhatsAppContactsConfig.tsx`
- `osiris_erp/apps/web/src/modules/profile/hooks/useWhatsApp.ts`

The osiris endpoints are **session / active-org scoped** — they take no `orgId` in the URL (`GET /whatsapp/status`, `GET|PATCH /whatsapp/config`, `GET|POST /whatsapp/contacts`, `PATCH|DELETE /whatsapp/contacts/:id`). The server resolves the org from the session.

## Architectural decisions

### Data layer — standalone client + react-query hooks (chosen)

V3's `ApiRegistry` (`apps/web/src/api/contracts.ts`) is CRUD-only (`clients`, `contacts`, `invoices`, `orders`, `projects`) and cannot host the WhatsApp singleton/allowlist endpoints. The established V3 idiom for non-CRUD osiris endpoints is a `runtime/osiris/*Client.ts` module using `fetch` + `joinOsirisApiBaseUrl` + `credentials: 'include'` (e.g. `membersAdminClient.ts`).

We add a standalone `runtime/osiris/whatsappClient.ts` and consume it directly from react-query hooks in the settings module. We do **not** thread it through `OsirisRuntimeState` / `AuthProvider`, because:

- The endpoints are session-scoped (no org-id threading to justify it).
- react-query owns caching, the 30s status poll, and invalidation-on-mutation.
- `QueryClientProvider` is already mounted app-wide via `apps/web/src/api/ApiProvider.tsx`.

Org membership for the "link user" dropdown **does** come through the runtime (`useOptionalOsirisRuntime().listOrgMembers`), which already exists.

### UI primitives — `@oktavius/base-ui`

All needed primitives exist: `Badge`, `Dialog`, `DropdownMenu`, `Select`, `Switch`, `Input`, `Label`, `AlertDialog`, `Button`. The phone field uses base-ui **`PhoneInput`** (backed by `@oktavius/reference-data/phone`) instead of osiris's country-`Select` + manual `normalizePhoneNumber` (those helpers do not exist in V3 by name; `PhoneInput` is V3's phone idiom).

Contact deletion uses **`AlertDialog`** (never `window.confirm` — per project rule).

### i18n — full keys in the `settings` namespace

Translation keys are not individually type-checked (`TranslateFunction` key is `string`), and the `settings` namespace already exists. We add `whatsapp*` keys to **both** `packages/i18n/locales/en/settings.json` and `packages/i18n/locales/de/settings.json`. No namespace regeneration needed; `pnpm --filter @oktavius/i18n validate` enforces en/de parity. Components call `t('settings.whatsapp…')`.

## Components & files

### New — `apps/web/src/runtime/osiris/whatsappClient.ts`

- Types (ported from osiris `useWhatsApp.ts`): `OsirisWhatsAppStatus`, `OsirisWhatsAppConfig`, `OsirisWhatsAppContact`, `OsirisWhatsAppAddContactInput`, `OsirisWhatsAppUpdateContactInput`, `OsirisWhatsAppConfigInput`.
- `createOsirisWhatsAppClient({ baseUrl })` exposing: `getStatus()`, `getConfig()`, `updateConfig(input)`, `listContacts()`, `addContact(input)`, `updateContact(id, input)`, `deleteContact(id)`.
- Responses normalized with `osirisClientUtils` helpers. Add a small local `readBoolean` (not present in `osirisClientUtils`).
- Base URL via `resolveOsirisApiBaseUrl()` (same source as the other clients).

### New — `apps/web/src/modules/settings/whatsapp/useWhatsApp.ts`

- Module-level client instance.
- react-query hooks: `useWhatsAppStatus` (`refetchInterval: 30_000`), `useWhatsAppConfig`, `useUpdateWhatsAppConfig`, `useWhatsAppContacts`, `useAddWhatsAppContact`, `useUpdateWhatsAppContact`, `useDeleteWhatsAppContact`. Mutations invalidate their query keys.
- Query keys include `activeOrgId` (from `useOptionalOsirisRuntime`) so an org switch refetches.

### New — `apps/web/src/modules/settings/whatsapp/WhatsAppConnection.tsx`

Port of osiris `WhatsAppCard`: status badge, phone number, formatted uptime, pairing hint. Connection icon from `@/lib/icons` (add `WifiHigh`, or reuse `StatusDot`).

### New — `apps/web/src/modules/settings/whatsapp/WhatsAppContactsConfig.tsx`

Port of osiris `WhatsAppContactsConfig`:

- **Messaging policies** section (auto-reply `Switch`, DM/group policy `Select`s), `Shield` icon.
- **Allowed contacts** section: list with role `Badge` + `DropdownMenu` (edit / toggle auto-reply / delete), `Phone` icon, `DotsThree` for the menu trigger.
- **Add** and **Edit** dialogs (`Dialog`). Phone entry via base-ui `PhoneInput`; "link user" `Select` from `runtime.listOrgMembers`; role `Select`.
- **Delete** via `AlertDialog`.
- Toasts via V3 `appToast` (`@/lib/toast`), not sonner.

### New — `apps/web/src/modules/settings/whatsapp/WhatsAppSettingsSection.tsx`

Composes `WhatsAppConnection` + `WhatsAppContactsConfig` with a header, mirroring the osiris route shell (org-selected / forbidden guards).

### Edit — `apps/web/src/modules/settings/SettingsPage.tsx`

Add a `settingsSections` entry: `id: 'whatsapp'`, `label`/`title` via `t('settings.whatsapp…')`, icon (`ChatCircle`, or add `WhatsappLogo`), `permission: 'org.manage'`, `render: () => <WhatsAppSettingsSection />`. `SettingsPageFactory` auto-hides the tab when the permission is not met.

### Edit — `apps/web/src/lib/icons.ts`

Add any missing phosphor re-exports used above (`WhatsappLogo`, `WifiHigh` as needed).

### Edit — `packages/i18n/locales/{en,de}/settings.json`

Add `whatsapp*` keys for every visible string (tab label, connection panel, policies, contacts list, dialogs, toasts).

## Data flow

```
Settings tab → WhatsAppSettingsSection
  → WhatsAppConnection / WhatsAppContactsConfig
    → react-query hooks (useWhatsApp.ts)
      → createOsirisWhatsAppClient (fetch, credentials: 'include')
        → osiris /whatsapp/* routes (session-scoped)
  "link user" dropdown → useOptionalOsirisRuntime().listOrgMembers
```

## Error handling, loading, permissions

- Mutations surface failures via `appToast.fromApiError` / `appToast.error`; loading via react-query `isLoading` / `isPending`.
- Tab body shows org-required / forbidden messaging like the osiris route; the tab itself is permission-gated (`org.manage`) at the factory level.

## Phone field detail (to validate in implementation)

base-ui `PhoneInput` emits a single dial-code-prefixed string (e.g. `"+43 1 234 5678"`). The osiris `addContact` payload accepts `phoneNumber` + optional `countryCode` and normalizes server-side. Plan: send the emitted string as `phoneNumber` (already international) and rely on backend E.164 normalization/validation, surfacing validation errors via toast. Confirm the backend `normalizePhoneNumber`/`isValidE164Phone` accepts a spaced `+`-prefixed value during implementation; strip spaces client-side if needed.

## Testing

Co-located vitest / testing-library tests following existing settings patterns:

- `useWhatsApp` hooks against a mocked client (query keys, polling config, invalidation).
- `WhatsAppContactsConfig`: render, add / edit / delete flows, policy changes (mocked hooks + `QueryClientProvider`).
- A factory-wiring assertion that the WhatsApp tab renders under `org.manage` and is hidden without it.

## Out of scope

- Any backend / API change (osiris `/whatsapp` assumed live).
- Bot pairing / QR flow (osiris has none in the frontend; pairing is a CLI script).
