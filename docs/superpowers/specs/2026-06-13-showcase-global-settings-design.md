# Showcase Global Settings — Design

Date: 2026-06-13
Status: Approved (pending spec review)
Module: `apps/web/src/modules/showcase`

## Goal

Rework the Component Showcase from a static gallery into a **frontend-first tuning surface**: a persistent global settings panel, reachable from every section, that lets you adjust the design system live and watch any section respond. Also make the ~18-section nav easier to browse via grouping + filter.

This is a frontend-only change. No backend, no runtime data dependencies.

## What's in scope

A single **global override layer** driven by a right-hand slide-over drawer, plus a grouped/filterable section nav. Controls in the drawer:

- **Design tokens** — relocated from the dedicated section (existing mechanism).
- **Theme & locale** — surfaced from existing user preferences.
- **Density** — new control.

## Out of scope

- Org-profile / industry-preset switching (explicitly excluded).
- Per-component "controls/props" playgrounds (Storybook-style).
- Turning density into a shipped app-wide user preference (showcase-scoped for now; see Density notes).

## Architecture

One global override layer. The drawer is a pure control surface that owns **no** preview — the section behind it is the live preview, because all overrides apply at the DOM root.

| Concern       | Mechanism                                                                                                          | Status                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| Design tokens | `useDesignTokenOverrides` — injects CSS custom properties at `:root`, opt-in localStorage persistence, `exportCss` | Exists; relocated only |
| Theme         | `useUserPreferences().theme` (`light`/`dark`/`system`)                                                             | Exists; surfaced       |
| Locale        | `useUserPreferences().locale` (`de`/`en`)                                                                          | Exists; surfaced       |
| Density       | new `useDensity` hook → `data-density` on `<html>` → CSS `font-size`                                               | New                    |

Because tokens already write to `:root` and theme/locale are already global context, "promoting to global" is mostly relocation — the page behind the drawer reflects changes for free.

## Components

### `ShowcaseSettingsDrawer`

- Mounted once by `ComponentShowcasePage`.
- Opened by a **gear button** placed in the page header.
- Built on base-ui `Drawer` (Radix dialog-based slide-over), sliding from the **right**. Content stays full-width when the drawer is closed.
- Two tabs:
  1. **Appearance** — theme (light/dark/system), locale (de/en), density (3-way segmented control).
  2. **Tokens** — the lifted token editor.
- Footer: a single **Reset everything** action clearing token overrides + density back to defaults.

### `TokenEditorPanel` (extracted)

- Pull the editor body out of the current `DesignTokensSection` into a reusable component: search box, `CollapsibleSection` token groups, per-token `TokenEditor`, and the action row (_Reset all (n)_ / _Copy CSS_ / _Remember edits_ switch).
- Reuses existing `useDesignTokenOverrides`, `getEditableTokensBySection`, `readBaseTokenFromStylesheet`, `tokenRegistry`. No behavior change — just no longer wrapped in a `SplitView` with a `LivePreview` (the preview is gone).

### `useDensity` hook + density CSS

- State: `'compact' | 'comfortable' | 'spacious'`, default `'comfortable'`.
- Applies `data-density` to `document.documentElement` (`<html>`).
- CSS in `globals.css` maps the attribute to a root `font-size`:
  - `compact` → `15px`
  - `comfortable` → `16px` (browser default; effectively the unset baseline)
  - `spacious` → `17px`
- Rationale: Tailwind spacing and type are rem-based and the root font-size is currently unset, so a single root `font-size` scales spacing **and** type uniformly with zero per-component changes.
- Persistence: opt-in localStorage, mirroring the token "Remember edits" pattern; key e.g. `oktavius.showcase.density`. Default (no stored value) = `comfortable`.
- Scope note: this sets `<html>` font-size, so the effect is visible app-wide while active. That is acceptable and desirable for a live density preview. It is **not** wired into `useUserPreferences` as a shipped preference in this iteration; it resets to comfortable when not persisted.

### Navigation rework

- Extend the shared base-ui `SettingsLayout` to **optionally** accept:
  - grouped items (items carry an optional `group` key; layout renders group headers), and
  - a filter input (live substring match on `label` + `description`).
- Backward-compatible: a flat `items` array with no groups and no filter flag renders exactly as today, so existing real settings pages are unaffected.
- `SHOWCASE_NAV` entries gain a `group` field, bucketed into: **Foundations · Components · Patterns · ERP**. Exact per-section assignment is an implementation detail for the plan; every current section maps to exactly one bucket.
- A filter box sits at the top of the showcase nav; typing filters the visible items (and hides empty groups).

## Data flow

```
ShowcaseSettingsDrawer (gear button → open)
  ├─ Appearance tab
  │    ├─ theme    → useUserPreferences().setTheme   → <html> class / data
  │    ├─ locale   → useUserPreferences().setLocale  → i18n context
  │    └─ density  → useDensity().set                → <html> data-density → font-size
  └─ Tokens tab
       └─ TokenEditorPanel → useDesignTokenOverrides → :root CSS custom props

Every showcase section renders normally and reflects the above with no per-section wiring.
```

## Removals & cleanup

- Delete `sections/DesignTokensSection.tsx`.
- Remove its `import`, its `case 'design-tokens'` in `ShowcaseSectionContent`, and its `SHOWCASE_NAV` entry + the `'design-tokens'` member of `ShowcaseSectionId`.
- Remove the `activeSection === 'design-tokens'` overflow/`min-h-0` special-cases in `ComponentShowcasePage` and `AppSectionNavLayout`'s `contentClassName` branch — the page layout simplifies to a single uniform path.
- Drop the reference visualizations (neutral ramp, surface stack, shell chrome, semantic swatches) per the "remove entirely" decision. The `components/TokenEditor.tsx` is retained (reused by `TokenEditorPanel`).
- Keep `useDesignTokenOverrides`, `tokenRegistry`, `tokenAliases`, `TokenControlEditors` — all reused by the panel.

## Testing

- `showcaseLayout.test.ts` updated to reflect the removed `design-tokens` section and the new nav grouping shape.
- New unit test for `useDensity`: setting density writes the expected `data-density` and the persistence opt-in round-trips through storage; default resolves to `comfortable`.
- New test for the extended `SettingsLayout`: grouped items render group headers; filter narrows visible items and hides empty groups; flat/no-filter usage is unchanged (regression guard for existing settings pages).
- Render smoke test: opening the drawer mounts Appearance + Tokens tabs; `Reset everything` clears overrides + density.

## Open implementation details (resolved in the plan, not blocking)

- Exact bucket assignment of each section.
- Whether the gear button sits in `ModulePage`'s header actions slot or in the section content header — to be chosen against existing `ModulePage` API.
- Segmented-control primitive for density (reuse an existing base-ui control vs. a small local segmented toggle).
