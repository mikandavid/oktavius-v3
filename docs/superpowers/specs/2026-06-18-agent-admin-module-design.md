# Design: Combined "AI Agent" Module (`agent-admin`)

Date: 2026-06-18
Branch: `FE`
Status: Approved design — ready for implementation plan

## Problem

In osiris ERP, everything related to the AI agent is scattered across the frontend:
agent usage/instruction settings, agent integrations (Halo/OnOffice connections),
the scheduler ("automations"), the agent heartbeat, and scheduled agent activations
(the "event-bus queue" of upcoming/past agent runs). In v3 only a partial
`AiSettingsSection` exists inside `/settings`. We want a single, dedicated module
that consolidates all AI-agent administration in one place.

## Goals

- One dedicated top-level module for all AI-agent administration.
- Four sections: **Settings**, **Integrations**, **Automations**, **Heartbeat & Queue**.
- Fully wired to the real osiris backend (not a status-only scaffold).
- Fold the existing `/settings?section=ai` content into the module and redirect.
- Comply with the v3 design system (`docs/ui-rules`) and established module patterns.

## Non-goals

- No backend/API changes are authored here. We consume existing osiris endpoints.
- No changes to the agent **chat** runtime (`components/agent/`, `AgentChatShell`,
  `runAgentTurn`). That is a separate surface and stays where it is.
- No per-domain agent instructions (funeral-case / doc-processing). Those remain
  embedded in their own modules; only org-wide custom instructions move here.
- The chart-palette / export-theme preferences from the osiris in-chat
  `AgentSettingsPopover` are chat-display prefs, not agent admin — out of scope.

## Decisions (locked)

| Decision                        | Choice                                                                 |
| ------------------------------- | ---------------------------------------------------------------------- |
| Module shape                    | Dedicated top-level nav module                                         |
| Backend                         | Fully wired to real osiris API                                         |
| Tabs                            | Settings, Integrations, Automations, Heartbeat & Queue                 |
| Existing `/settings?section=ai` | Move into module + redirect                                            |
| Internal nav                    | Left-rail sections (reuse SettingsPage pattern), `?section=` deep-link |
| Permission fallback             | Superadmin-only until bootstrap emits the new permission keys          |

## Architecture

### Module registration

Add one entry to `apps/web/src/lib/appNavModules.ts`:

```ts
{
  id: 'agent-admin',
  path: '/agent',
  label: 'AI Agent',
  labelKey: 'navigation.agentAdmin',
  icon: RobotIcon,            // from @/lib/icons (Phosphor)
  section: 'admin',
  permission: 'agent-admin.view',
  loadPage: () => import('@/modules/agent-admin/AgentAdminPage'),
  pageExport: 'AgentAdminPage',
}
```

Routing/lazy-loading is generated from the manifest by `app/router.tsx` — no manual
route wiring needed beyond the manifest entry and the redirect (below).

### Page shell & internal navigation

`apps/web/src/modules/agent-admin/AgentAdminPage.tsx` mirrors `SettingsPage`:

- A `SettingsSectionConfig[]`-style array describing the four sections
  (`id`, `label`, `icon`, `group?`, `title`, `sectionDescription`, `permission`, `render`).
- Left-rail section list + main content, reusing the `SettingsPageFactory`-style
  component (extract/share if reasonable; otherwise replicate the small factory).
- Deep-linking via `?section=` using the same param helper convention as
  `settingsSectionParam.ts` (`AGENT_SECTION_PARAM = 'section'`, default `settings`).
- Per-section permission gating via `canUseOsirisPermissionRequirement(permissionSubject, section.permission)`.
- Autosave footer (`SettingsAutosaveFooter`) for the Settings section only.

### Redirect

`/settings?section=ai` → `/agent?section=settings`. Implement as a redirect at the
settings level (the `ai` section resolver returns a `<Navigate>` / router redirect),
and remove the `AiSettingsSection` entry from `SettingsPage`'s section list so there
is a single source of truth.

## Sections

### 1. Settings (`?section=settings`, permission `org.manage`)

Moves the existing `AiSettingsSection` here verbatim:

- **AI Usage Budget** — warning threshold, hard limit, overage allowed
  (`OsirisWorkspaceSettings.aiUsage`).
- **Org-wide custom instructions** — add/edit/remove/enable
  (`OsirisWorkspaceSettings.agent.customInstructions`).

Already wired in v3 via `workspaceSettingsClient.ts` + the workspace-settings
autosave hooks. No new data layer needed; this is a relocation.

### 2. Integrations (`?section=integrations`, permission `org.manage`)

Port from osiris `modules/settings/components/OrgAgentIntegrationsPanel.tsx` +
`integrations/*`:

- My connections / shared connections lists.
- Add (`AddConnectionDialog`), Manage (`ManageConnectionDialog`),
  Disconnect (via `ConfirmActionDialog`, NOT native confirm).
- Native integration form (Halo, OnOffice) — `Combobox` not `Select`.
- Health check / reconnect / test actions with `appToast.fromApiError`.

New data layer (see Data Layer below): `agentIntegrationsClient.ts`,
`useAgentIntegrations.ts`.

### 3. Automations (`?section=automations`, permission `scheduler.view` / `scheduler.manage_*`)

Port from osiris `modules/automations/*`:

- List of scheduled tasks (use `CrudTable` / list shell): name, schedule, status, last run.
- Detail view: configuration + run history.
- Create/edit form: schedule type (`once` | `interval` | `cron`), triggers
  (`EmailTriggerConfig`, `HaloTriggerConfig`), trigger-mailboxes lookup.
- Actions: pause / resume / run-now.

New data layer: `schedulerClient.ts`, `useScheduler.ts`.

### 4. Heartbeat & Queue (`?section=heartbeat`, permission `scheduler.manage_own`)

Port from osiris `agent/components/ScheduledAgentActivationsPanel.tsx` +
the heartbeat controls extracted from `AgentSettingsPopover.tsx`:

- **Heartbeat**: status indicator (pulse), Activate / Kill (Kill via
  `ConfirmPopover`/`ConfirmActionDialog`).
- **Queue**: scheduled agent activations — upcoming + past, status
  (paused/scheduled/completed), next run time, schedule expression, run history;
  pause / resume / trigger-now per activation.

New data layer: `agentActivationsClient.ts`, `useAgentActivations.ts`.

## Data layer ("fully wired")

The osiris clients exist but v3's `runtime/osiris/` adapter does not have them yet.
Port them as new client files following the `storageClient.ts` template:
direct `fetch` via `joinOsirisApiBaseUrl(baseUrl, path)`, `credentials: 'include'`
(session cookie auth + `X-Org-Id` header from the API registry), JSON body,
`readErrorMessage(response, fallback)` on non-OK.

| Client file (new)                           | Endpoints                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `runtime/osiris/agentIntegrationsClient.ts` | `GET/POST/PATCH/DELETE /agent-integrations/*`, `/connections`, `/connections/{id}/health`, `/connections/{id}/reconnect`, `/{key}/test`, `/provider-diagnostics`, `/apps` |
| `runtime/osiris/schedulerClient.ts`         | `GET/POST/PATCH /scheduler`, `/scheduler/{taskId}`, `/scheduler/{taskId}/pause                                                                                            | resume                                                                     | run-now`, `/scheduler/runs`, `/scheduler/trigger-mailboxes` |
| `runtime/osiris/agentActivationsClient.ts`  | `GET /scheduler/heartbeat`, `POST /scheduler/heartbeat/activate                                                                                                           | kill`, scheduled activations list + `{id}` pause/resume/trigger-now + runs |

Per-section react-query hook files under `modules/agent-admin/data/`:

- Org-scoped query-key factories (`agentAdminKeys.integrations(org)`, etc.).
- `useQuery` for reads, `useMutation` with `onSuccess: invalidate` and
  `onError: (e) => appToast.fromApiError(e, '...')`.
- Each `useXClient()` memoizes `createOsirisXClient({ baseUrl: resolveOsirisApiBaseUrl() })`.
- `useOptionalOsirisRuntime()?.activeOrgId` for org scoping.

## Permissions

New permission strings referenced by the module:
`agent-admin.view`, `scheduler.view`, `scheduler.manage_own`, `scheduler.manage_org`
(`org.manage` already exists and gates Settings + Integrations).

osiris already uses the `scheduler.*` keys. **Fallback:** if the v3 bootstrap does
not yet surface a given key, that section gates to **superadmin-only** via the
permission requirement (e.g. `permission: ['scheduler.view']` still resolves true
for superadmins through `canUseOsirisPermissionRequirement`). The section auto-opens
to all permitted users once the bootstrap includes the key — no frontend change
needed when the backend catches up. Confirm during Phase 3/4 whether the keys are
present; if absent, the superadmin fallback is the shipped behavior.

## i18n

New namespace `agent-admin` (codegen + scanner per the v3 i18n system, 45 ns).
Components call `usePreloadNamespaces(['agent-admin'])` and gate render on `ready`,
using `useTranslation()` `t(key, params, fallback)`. Navigation label key
`navigation.agentAdmin` in the navigation namespace.

## Design-system compliance (`docs/ui-rules`)

- `Combobox` (never `Select`) for all single-selects.
- `appToast` (`.success` / `.fromApiError`) for all feedback.
- base-ui `SettingsSection` / `SettingsRow` / `Switch` / `Input` / `Textarea`.
- No native `confirm`/`alert`/`prompt` — destructive actions (disconnect, delete
  automation, kill heartbeat) use `ConfirmActionDialog` / `ConfirmPopover`.
- Surface aesthetic: borderless white tiles on tinted wash; transparent tinted
  alerts; brand purple reserved (no purple buttons except a single page entry-point).
- `CrudTable` / list shell for automations list + run-history tables.
- Icons only from `@/lib/icons` (Phosphor).

## Components removed / relocated

- `AiSettingsSection` entry removed from `SettingsPage`'s section list; the
  component is rendered by the module's Settings section instead (kept in place or
  moved under `modules/agent-admin/sections/`).
- `/settings?section=ai` becomes a redirect.

## Testing

- Per section: react-query hook tests with pre-seeded `QueryClient` (the established
  v3 test pattern) — assert correct endpoints/keys and toast-on-error.
- Page shell: section deep-linking (`?section=`), permission gating (superadmin vs
  non-permitted user sees fewer sections), redirect from `/settings?section=ai`.
- Use the nuqs test harness for query-param-driven nav, per module conventions.
- Destructive flows assert a confirm dialog appears (no native confirm).

## Phasing (for the implementation plan)

Each phase is independently shippable + testable on branch `FE` (stage only this
module's files; commit fast — concurrent agent streams on `FE`).

1. **Shell** — module registration in `appNavModules`, page shell + left-rail
   section factory, `?section=` param, i18n namespace + nav label, redirect from
   `/settings?section=ai`, **Settings** section (relocate `AiSettingsSection`).
2. **Integrations** — `agentIntegrationsClient` + hooks + section UI (connections,
   dialogs, health/reconnect/test).
3. **Automations** — `schedulerClient` + hooks + list/detail/form + run history.
4. **Heartbeat & Queue** — `agentActivationsClient` + hooks + heartbeat control +
   activations queue + runs.

## Risks

- **Permission keys not in v3 bootstrap.** Mitigated by superadmin-only fallback.
- **Endpoint shape drift** between osiris and v3 expectations. Mitigated by porting
  the osiris client logic faithfully and verifying response normalization.
- **Concurrent commits on `FE`.** Mitigated by small, fast, file-scoped commits per
  the FE workflow note.
