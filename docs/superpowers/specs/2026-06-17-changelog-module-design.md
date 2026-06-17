# Changelog module — design

**Date:** 2026-06-17
**Branch:** FE
**Status:** Approved (design)

## Summary

A simple, read-only `/changelog` module that displays release history as a vertical
timeline, fully consistent with the v3 UI system. It is a normal nav module in the
**Modules** section, visible to everyone (no permission gate). Data comes from a
backend API (`GET /changelog`); there is **no** local seed fallback — until the
osiris endpoint exists, the page renders a clean empty state.

## Decisions (from brainstorming)

- **Data source:** Backend API via react-query (`GET /changelog`), mirroring the
  support/mail data-client pattern.
- **Access:** Everyone. Sidebar `section: 'modules'`, no `permission`,
  no `superadminOnly`.
- **Layout:** Vertical timeline (left rail; each release is a node).
- **Filtering:** None (YAGNI).
- **Fallback:** Pure API. No bundled seed data; empty state until the endpoint ships.

## Architecture

New module at `apps/web/src/modules/changelog/`:

```
modules/changelog/
  ChangelogPage.tsx          # ModulePage shell; preloads i18n ns; orchestrates states
  ChangelogTimeline.tsx      # vertical rail; maps releases -> nodes
  ChangelogReleaseItem.tsx   # one release: dot + version + date (+ optional title) + items
  ChangeBadge.tsx            # ChangeType -> base-ui Badge variant
  data/
    types.ts                 # ChangeType, ChangelogItem, ChangelogRelease, result types
    changelogKeys.ts         # query-key factory (org-scoped)
    changelogClient.ts       # fetch + defensive parser (mirrors supportClient)
    useChangelog.ts          # react-query hook
  ChangelogPage.test.tsx
  ChangelogReleaseItem.test.tsx (optional, if logic warrants)
  data/changelogClient.test.ts
  data/useChangelog.test.tsx
```

Each unit has one purpose: the page owns layout + state orchestration; the timeline
and release-item components are pure presentational; the data layer owns fetching,
parsing, and caching and is independently testable.

## Data model (`data/types.ts`)

```ts
export type ChangeType = 'added' | 'improved' | 'fixed';

export interface ChangelogItem {
  type: ChangeType;
  text: string;
}

export interface ChangelogRelease {
  version: string; // e.g. "3.4.0"
  date: string; // ISO date string
  title?: string; // optional release headline
  items: ChangelogItem[];
}

export interface ChangelogResult {
  releases: ChangelogRelease[];
}
```

Releases are rendered newest-first (client sorts by `date` desc, stable). Change
types map to base-ui `Badge` variants:

| ChangeType | Badge variant |
| ---------- | ------------- |
| `added`    | `success`     |
| `improved` | `info`        |
| `fixed`    | `secondary`   |

Unknown types from the API are coerced to `improved` by the parser (no crash).

## Data layer

### `changelogClient.ts`

Follows the established `supportClient` shape:

- `createChangelogClient({ baseUrl }?)` returning `{ listReleases(): Promise<ChangelogResult> }`.
- Uses `joinOsirisApiBaseUrl(baseUrl, '/changelog')` and
  `fetch(url, { credentials: 'include' })`.
- A defensive parser built from the `osirisClientUtils` readers
  (`readRecord`, `readString`, `oneOf`, etc.): tolerates missing/extra fields,
  filters out malformed items, and never throws on a 200 with unexpected shape.
- On non-OK responses (including 404 while the endpoint is unbuilt) it throws a
  typed error via `readErrorMessage`; react-query surfaces it. A 404 is treated as
  "endpoint not available" and the page shows the empty state rather than an error
  (the hook maps 404 -> empty result).

### `changelogKeys.ts`

```ts
export const changelogKeys = {
  root: (org: OrgId) => ['changelog', org] as const,
  list: (org: OrgId) => ['changelog', org, 'list'] as const,
};
```

### `useChangelog.ts`

`useQuery` keyed by `changelogKeys.list(orgId)`, using the org-scoped client from
runtime. Returns `{ releases, isLoading, error }`. Maps a 404 to an empty
`releases: []` so "endpoint not built yet" reads as empty, not error.

## UI

### `ChangelogPage.tsx`

- `usePreloadNamespaces(['changelog'])`; gate render on `ready`.
- `ModulePage` with `title={t('changelog.title')}`,
  `subtitle={t('changelog.subtitle')}`, `icon={changelogPageIcon()}`.
- States:
  - **loading** → existing skeleton/spinner pattern used by other module pages.
  - **error** → inline error block consistent with other modules.
  - **empty** (`releases.length === 0`) → centered empty state
    (`t('changelog.emptyTitle')` / `t('changelog.emptyBody')`).
  - **list** → `<ChangelogTimeline releases={...} />`.

### `ChangelogTimeline.tsx`

- A single container with a left vertical rail (a `border-l` / pseudo line on a
  flex column). Maps releases to `ChangelogReleaseItem`.

### `ChangelogReleaseItem.tsx`

- Timeline dot aligned to the rail, then the release header:
  version (semibold) + formatted date (`Intl.DateTimeFormat(undefined,
{ dateStyle: 'medium' })`, matching `SupportTicketThread`), optional `title`.
- Below: the list of change items, each a row with a `ChangeBadge` + text.
- Borderless white tile on the tinted wash per the v3 surface aesthetic; no
  brand-purple accents.

### `ChangeBadge.tsx`

- Thin wrapper: `ChangeType` -> base-ui `Badge variant` + localized label
  (`t('changelog.type.added' | 'improved' | 'fixed')`).

## Registration / wiring

1. **`src/lib/org-profiles/types.ts`** — add `'changelog'` to `OrgModuleId`.
2. **`src/lib/appNavModules.ts`** — new `APP_NAV_MODULES` entry:
   ```ts
   {
     id: 'changelog',
     path: '/changelog',
     label: 'Changelog',
     labelKey: 'navigation.changelog',
     icon: HistoryIcon,
     section: 'modules',
     loadPage: () => import('@/modules/changelog/ChangelogPage'),
     pageExport: 'ChangelogPage',
   }
   ```
   (No `permission` / `superadminOnly`.)
3. **`src/lib/modulePageIcons.tsx`** — add
   `export const changelogPageIcon = () => modulePageIcon(HistoryIcon);`.
4. **Org profiles** — add `'changelog'` to `enabledModules` in the relevant preset
   profiles so it appears in the sidebar.
5. **i18n**
   - New namespace `changelog.json` in `packages/i18n/locales/en` and
     `packages/i18n/locales/de` with keys: `title`, `subtitle`, `emptyTitle`,
     `emptyBody`, `errorTitle`, `loading`, `type.added`, `type.improved`,
     `type.fixed`.
   - Add `navigation.changelog` to `navigation.json` (en + de).
   - Run the i18n codegen (regenerates `generated-namespaces.ts`).

## Backend dependency (out of FE scope)

The osiris `GET /changelog` endpoint **does not exist yet**. Expected contract:

```
GET /changelog
200 -> { "releases": [
  { "version": "3.4.0", "date": "2026-06-17", "title": "…?",
    "items": [ { "type": "added", "text": "…" }, … ] }, …
] }
```

Until it ships, the module shows the empty state. No backend work is performed in
this module; this section documents the contract the client targets.

## UI-system adherence checklist

- Borderless white tiles on tinted wash; transparent tinted accents only.
- No brand-purple accents (purple is reserved for a single page-entry CTA, which
  this read-only page does not have).
- base-ui `Badge`, typography, and `ModulePage` header orb.
- i18n-gated rendering (`usePreloadNamespaces`), all strings via `t()`.
- No native `confirm`/`alert` dialogs (none needed here — read-only page).

## Testing

- `changelogClient.test.ts` — parser tolerates good/partial/malformed payloads;
  builds correct URL; maps non-OK to typed error.
- `useChangelog.test.tsx` — pre-seeded react-query harness (established pattern):
  success populates releases; 404 → empty; error surfaces.
- `ChangelogPage.test.tsx` — renders loading, empty, error, and list states;
  releases ordered newest-first; badges localized.

## Out of scope

- Filtering / search.
- Per-user "unread / what's new" tracking.
- Markdown rendering inside change items (plain text only).
- The backend endpoint implementation.
