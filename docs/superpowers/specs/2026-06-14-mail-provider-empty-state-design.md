# Mail Provider — Empty State & Settings Tab

**Date:** 2026-06-14
**Branch:** FE
**Status:** Approved

## Problem

When no mail provider is connected, the Email page shows a bare `InlineEmptyState`
("Email data source is not connected.") with no explanation and no way to act. There
is no surface anywhere in the V3 UI that tells the user a provider is missing or lets
them start connecting one.

## Goal

Give the user a clear, actionable prompt when no mail provider is connected:

1. A proper empty-state on the Email page that explains the situation and links to where
   a provider is connected.
2. A new **Mail** settings tab that shows the connection status (currently "none
   connected") and the supported providers.

## Constraints / context

- The V3 frontend has **no mail-provider backend client**. The Email module runs on
  demo/localStorage data; `ConnectedAccountsHeaderMenu` and `hostedNylasProviderLabel`
  are unused scaffolding.
- The WhatsApp settings tab is the reference pattern: a `*SettingsSection` wrapper → a
  `*Connection` status panel (Badge + hint), registered in `SettingsPage` with
  `permission: 'org.manage'`, i18n via `t('settings.x', undefined, 'fallback')`.
- Settings tabs are selected via local `useState('general')` — **no URL deep-linking**
  exists today. Settings is at `/settings`, Email at `/email`.
- Per user decision: **status + info only, no live connect** (honest scaffold, ready to
  wire to a backend later).

## Design

### 1. Email page empty-state (`apps/web/src/modules/email/EmailPage.tsx`)

When `!hasEmailDataSource`, replace the `InlineEmptyState` in the detail pane with the
shared `EmptyState`:

- **Title:** "No mail provider connected"
- **Description:** "Connect Google, Microsoft, or Exchange to sync your mailbox and start
  sending email."
- **Action:** a "Connect a provider" button that navigates to `/settings?section=mail`.

The "Compose" header button remains disabled while disconnected (existing behavior).

### 2. Mail settings tab (`apps/web/src/modules/settings/mail/`)

Mirrors the WhatsApp tab structure.

- `MailSettingsSection.tsx` — section wrapper.
- `MailProviderConnection.tsx` — status panel:
  - A `Badge` reading "No mail provider connected" (outline / disconnected tone).
  - The list of supported providers (Google / Microsoft / Exchange) via
    `hostedNylasProviderLabel`.
  - An explanatory hint: no provider is connected and how connecting will work once the
    backend is available.
- `data/useMailProviderStatus.ts` — thin hook returning a static
  `{ status: 'disconnected', accounts: [] }`, shaped to be swapped for a real
  osiris/Nylas query later (matching the WhatsApp react-query shape).
- Registered in `SettingsPage` as
  `{ id: 'mail', label: 'Mail', icon: <EmailIcon/>, permission: 'org.manage',
  render: () => <MailSettingsSection/> }`, placed near the WhatsApp tab.

### 3. Settings deep-link (`apps/web/src/modules/settings/SettingsPage.tsx`)

Initialize `activeSection` from a `?section=` search param (falling back to `'general'`,
and ignoring unknown/forbidden sections) so the email CTA lands directly on the Mail tab.

### 4. i18n

New `settings.mail*` and `email.*` keys using the inline-fallback pattern so they render
before codegen runs.

### 5. Tests

- Email empty-state renders the "Connect a provider" CTA and navigates to
  `/settings?section=mail`.
- Mail connection panel shows the "disconnected" badge and the provider list.
- Settings reads `?section=mail` and activates the Mail tab.
- Follows the existing pre-seeded react-query / RTL patterns.

## Out of scope

- Real OAuth / backend wiring for provider connect.
- Wiring the unused `ConnectedAccountsHeaderMenu` into the header.
- The profile "No email" prompt.
