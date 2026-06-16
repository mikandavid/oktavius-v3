# Account Dropdown Redesign — "Account Panel"

**Date:** 2026-06-16
**Branch:** FE
**Scope:** Frontend-only restyle of the navbar account dropdown. No backend, no behavior changes beyond how preferences are surfaced.

## Problem

The navbar account menu (`HeaderAccountMenu`) is functional but plain: a clickable profile text-block, a `Settings` link, three nested submenus (Organisation / Language / Design), and `Sign out`. It does not echo the crafted look of the Settings page and the preference switchers are buried one level deep behind submenus.

## Goal

Reshape the dropdown **contents** into a designed "Account panel" that mirrors the Settings page visual language, surfaces theme/language as inline controls, and respects the V3 design system. The navbar trigger button is unchanged.

## Design-system constraints (must hold)

- Floating panel keeps `border` + `shadow-elevated` (overlays are the one place borders/shadows are allowed). Content tiles inside stay borderless.
- **Brand purple stays reserved** for the single page-entry-point CTA. No purple in this panel — pills, toggles, and accents use neutral `muted` tokens.
- Use `@/lib/icons` only; semantic tokens only (`bg-muted/60`, `text-muted-foreground`, `rounded-card`/`rounded-md`, etc.); no raw palette colors, no `bg-white`, no `text-gray-*`.
- Reuse existing `@oktavius/base-ui` primitives; do not hand-roll menu/popover behavior.

## Panel structure (top → bottom)

1. **Profile header** — `md`/`lg` Avatar + full name + email (truncating). Clicking the header still navigates to `/settings?section=account` (preserves current affordance).
2. **Identity pills** — a row of neutral muted pills: org name + role (e.g. `Texterous` · `Owner`). Rendered only when the data exists. Falls back gracefully (no org → omit org pill; no role → omit role pill).
3. **Separator.**
4. **`Preferences` label** — small uppercase `.label`-style section heading.
5. **Theme row** — `Theme` on the left, a **segmented toggle** on the right with the three `UI_THEME_OPTIONS` (Light ☀ / Dark ☾ / System ⚙). Selecting calls `setTheme`. Active segment highlighted (white chip + subtle shadow).
6. **Language row** — `Language` on the left, a **segmented toggle** with the two `UI_LOCALE_OPTIONS` (DE / EN). Selecting calls `setLocale` + `setLanguage` (same dual call the current `LanguageMenuSection` makes).
7. **Organisation row** —
   - **Multiple orgs:** a tappable row that opens the existing org sub-popover (`DropdownMenuSub`) listing orgs with active checkmark + switch behavior. Right-aligned hint shows the active org name; chevron present.
   - **Single org:** static label (active org name as muted hint), no chevron, not interactive.
   - **No orgs:** row omitted.
8. **Separator.**
9. **`Settings`** menu item → `navigate('/settings')` (unchanged).
10. **`Sign out`** menu item, destructive styling, disabled when no `signOut` handler (unchanged behavior).

## Components & boundaries

- **`HeaderAccountMenu.tsx`** — stays the orchestrator: pulls runtime data, renders `DropdownMenu` + trigger (unchanged) + the new `DropdownMenuContent` body.
- **`AccountMenuSections.tsx`** — refactor:
  - Keep `OrganizationMenuSection` (sub-popover) for the multi-org case; add the single-org static rendering.
  - Replace `LanguageMenuSection` and `DesignMenuSection` (submenu-based) with **segmented-toggle row** components. Introduce a small reusable `SegmentedToggle` building block (label + options + active value + onChange) used by both Theme and Language rows, plus a `PreferenceRow` wrapper (`label left, control right`) consistent with the SettingsRow idiom.
  - A `ProfileHeader` sub-component (avatar + name + email, clickable) and an `IdentityPills` sub-component for clarity.
- The `SegmentedToggle` is presentation-only (no preference knowledge) so it is independently testable. The Theme/Language rows wire it to `useUserPreferences`.

### `SegmentedToggle` interface (sketch)

```tsx
type SegmentedToggleProps<T extends string> = {
  value: T;
  options: ReadonlyArray<{ value: T; label: string; icon?: ReactNode }>;
  onChange: (value: T) => void;
  ariaLabel: string;
};
```

Styling: `inline-flex gap-0.5 rounded-md bg-muted p-0.5`; each segment a small button, active = `bg-card shadow-sm text-foreground`, inactive = `text-muted-foreground hover:text-foreground`. Keyboard: arrow-key navigation within the group, `aria-pressed`/radiogroup semantics.

## Accessibility

- Profile header: keep it a `DropdownMenuItem` so it is keyboard-reachable and announces as the account/settings entry.
- Segmented toggles: `role="radiogroup"` with `role="radio"` segments (or `aria-pressed` buttons), labelled via `ariaLabel`; arrow keys move selection; not a focus trap.
- Org sub-popover, Settings, Sign out: unchanged a11y from current `DropdownMenuItem`/`DropdownMenuSub` primitives.

## Out of scope

- Navbar trigger button restyle.
- Any backend / preferences persistence change (same `useUserPreferences` calls).
- Org-card direction (rejected in favor of inline row).
- New theme options or locales.

## Testing

- **`SegmentedToggle`** unit test: renders options, highlights `value`, calls `onChange` on click and on arrow-key + selection, exposes correct ARIA.
- **`HeaderAccountMenu`** (existing test harness, pre-seeded react-query / runtime mock): renders profile header, pills present/absent by data, theme & language toggles reflect and update preferences, organisation row is a sub-popover with >1 org and static with exactly 1 org, sign out disabled without handler.
- Verify no design-system bans introduced (no purple, no raw palette, icons from `@/lib/icons`).

## Acceptance

- Panel matches direction "B · Account panel (refined)" approved in brainstorming.
- All existing account-menu behaviors preserved (navigation targets, org switch, sign out, theme/language effects).
- Existing and new tests green; lint/TS clean.
