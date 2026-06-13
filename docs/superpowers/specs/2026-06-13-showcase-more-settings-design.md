# Showcase Settings — More Appearance Controls

Date: 2026-06-13
Status: Approved (pending spec review)
Builds on: `2026-06-13-showcase-global-settings-design.md`
Module: `apps/web/src/modules/showcase` + `apps/web/src/lib`

## Goal

Add two more controls to the showcase settings drawer's **Appearance** tab:

1. **Reduced motion** — a toggle that forces animations/transitions off app-wide.
2. **Friendly appearance controls** — a **Roundness** segmented control and a **Card shadow** segmented control that ride on the existing design-token override store (so they compose with the Tokens tab and persist/export with everything else).

Frontend-only, showcase-scoped. No backend.

## Out of scope

- Org-profile / industry-preset switching (still excluded).
- Token preset save/load.
- App-wide RTL/direction (no mechanism exists).
- Shadow controls beyond `--shadow-card`.

## Architecture

Two distinct mechanisms:

- **DOM-attribute prefs** (density, reduced motion): a persisted value mapped to an attribute on `<html>` + CSS. Density already does this; reduced motion is the same shape, so we extract a shared primitive (decision below).
- **Token-derived controls** (roundness, shadow): presentational controls that read/write the existing `useDesignTokenOverrides` controller. No new state — they call `setOverride` / `resetToken` on the page-owned `tokens` controller, so `tokens.resetAll()` (already in "Reset everything") clears them for free, and they export via the existing Copy CSS.

### Shared primitive: `useRootPref` (decision: option a)

Extract a generic hook that both `useDensity` and a new `useReducedMotion` build on, removing the duplicated "persisted root-attribute flag" logic.

`apps/web/src/lib/showcase-prefs/useRootPref.ts`:

```ts
export type RootPrefConfig<T> = {
  attribute: string; // e.g. 'data-density'
  storageKey: string; // e.g. 'oktavius.showcase.density'
  defaultValue: T;
  parse: (raw: string | null) => T | null; // validate stored string → T (null = invalid/absent)
  serialize: (value: T) => string; // T → storage string
  toAttribute: (value: T) => string | null; // T → attribute value; null removes the attribute
};

export type RootPrefController<T> = {
  value: T;
  setValue: (value: T) => void;
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void; // back to defaultValue
};

export function useRootPref<T>(config: RootPrefConfig<T>): RootPrefController<T>;
```

Behavior (identical to the current density hook, generalized):

- Initial `value` = `parse(stored)` ?? `defaultValue`; initial `persist` = `parse(stored) !== null`.
- Effect on `[value, persist]`: `const attr = toAttribute(value)`; if `attr === null` remove the attribute else `setAttribute`; if `persist` write `serialize(value)` to storage else remove the key; cleanup removes the attribute (on unmount).
- `reset()` sets `value = defaultValue`.

A pure helper `resolveInitialPref(raw, parse, defaultValue) → { value, persist }` is extracted and unit-tested (apps/web has no React testing-library; the hook body stays typecheck-gated, the pure helper is tested).

### `useDensity` refactor

`useDensity` (stays at `lib/density/useDensity.ts`) becomes a thin wrapper over `useRootPref`, preserving its public API `{ density, setDensity, persist, setPersist, reset }`:

```ts
const pref = useRootPref<Density>({
  attribute: 'data-density',
  storageKey: DENSITY_STORAGE_KEY,
  defaultValue: DEFAULT_DENSITY,
  parse: (raw) => (isDensity(raw) ? raw : null),
  serialize: (v) => v,
  toAttribute: (v) => v, // density always sets the attribute
});
return {
  density: pref.value,
  setDensity: pref.setValue,
  persist: pref.persist,
  setPersist: pref.setPersist,
  reset: pref.reset,
};
```

`density.ts` keeps `Density`, `DENSITIES`, `DEFAULT_DENSITY`, `DENSITY_STORAGE_KEY`, `isDensity`. The now-superseded `readStoredDensity` / `applyDensityToDom` / `clearDensityFromDom` (and their tests) are **removed**, since `useRootPref` owns that logic generically. (`density.test.ts` retains the `isDensity` / `DEFAULT_DENSITY` cases.)

### `useReducedMotion`

`apps/web/src/lib/showcase-prefs/useReducedMotion.ts` — wraps `useRootPref<boolean>`:

```ts
const REDUCED_MOTION_STORAGE_KEY = 'oktavius.showcase.reduced-motion';

export function useReducedMotion() {
  const pref = useRootPref<boolean>({
    attribute: 'data-reduced-motion',
    storageKey: REDUCED_MOTION_STORAGE_KEY,
    defaultValue: false,
    parse: (raw) => (raw === 'true' ? true : raw === 'false' ? false : null),
    serialize: (v) => String(v),
    toAttribute: (v) => (v ? 'true' : null), // omit the attribute when off
  });
  return {
    enabled: pref.value,
    setEnabled: pref.setValue,
    persist: pref.persist,
    setPersist: pref.setPersist,
    reset: pref.reset,
  };
}
```

### Reduced-motion CSS

Append to `globals.css`, mirroring the existing `@media (prefers-reduced-motion: reduce)` block (currently at line 358) so an explicit user toggle has the same effect regardless of OS setting:

```css
:root[data-reduced-motion='true'] *,
:root[data-reduced-motion='true'] *::before,
:root[data-reduced-motion='true'] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  scroll-behavior: auto !important;
  transition-duration: 0.01ms !important;
}
```

### Friendly token controls

`apps/web/src/modules/showcase/components/AppearanceTokenControls.tsx` — presentational, takes `{ controller: DesignTokenOverridesController }`. Renders two segmented controls. Pure mapping logic lives in `apps/web/src/modules/showcase/components/appearanceTokenScales.ts` (unit-tested):

**Roundness** — scales the four radius tokens together by a factor of their stylesheet base values:

```ts
export const RADIUS_TOKEN_KEYS = [
  'radius',
  'radius-card',
  'radius-control',
  'radius-badge',
] as const;
export const ROUNDNESS_PRESETS = [
  { id: 'square', label: 'Square', factor: 0 },
  { id: 'subtle', label: 'Subtle', factor: 0.5 },
  { id: 'default', label: 'Default', factor: 1 },
  { id: 'round', label: 'Round', factor: 1.6 },
] as const;

export function scaleRem(baseRem: string, factor: number): string; // '0.875rem',1.6 → '1.4rem'; factor 0 → '0rem'
export function roundnessOverridesFor(
  factor: number,
  bases: Record<string, string>,
): Record<string, string>;
export function activeRoundness(overrides, bases): RoundnessId | null; // matches a preset exactly, else null
```

- Clicking a preset: for `factor === 1` (Default), `resetToken` each of the 4 radius keys; otherwise `setOverride(key, scaleRem(base, factor))` for each. Bases come from `readBaseTokenFromStylesheet(key)`.
- Active highlight: `activeRoundness(overrides, bases)`; `null` (no highlight) when the Tokens tab made custom radius edits.

**Card shadow** — presets over `--shadow-card` (default `none`, so "Off" = reset):

```ts
export const SHADOW_CARD_PRESETS = [
  { id: 'off', label: 'Off', value: null }, // resetToken('shadow-card')
  { id: 'subtle', label: 'Subtle', value: '0 1px 2px 0 rgb(0 0 0 / 0.04)' },
  { id: 'medium', label: 'Medium', value: '0 2px 6px -1px rgb(0 0 0 / 0.08)' },
  { id: 'strong', label: 'Strong', value: '0 6px 16px -4px rgb(0 0 0 / 0.12)' },
] as const;

export function activeShadowCard(overrides): ShadowCardId | null; // 'off' when no override; the matching preset id; or null when a custom shadow-card edit doesn't match a preset
```

- Clicking: `value === null` → `resetToken('shadow-card')`; else `setOverride('shadow-card', value)`.
- A `DensitySegmented`-style local segmented button group is reused/generalized for all three (density already has one in the drawer); extract a small `Segmented` building block in `AppearanceTokenControls.tsx` (or share the drawer's existing one) to avoid duplicating the button markup three times.

### Drawer + page wiring

- `ShowcaseSettingsDrawer` gains props `reducedMotion: boolean`, `onReducedMotionChange: (v) => void` (the reduced-motion persist toggle is folded into the existing "Remember density" pattern — see note). The Appearance tab adds: a **Reduced motion** `SettingsRow` (toggle button, `aria-pressed`), and `<AppearanceTokenControls controller={tokens} />` (Roundness + Card shadow rows).
- `ComponentShowcasePage` additionally owns `const reducedMotion = useReducedMotion();`, passes `reducedMotion={reducedMotion.enabled}` / `onReducedMotionChange={reducedMotion.setEnabled}`, and `handleResetEverything` additionally calls `reducedMotion.reset()` and `reducedMotion.setPersist(false)`.

> Persistence note: reduced motion follows the same opt-in persist model as density (each hook keeps its own `persist` state internally). In the UI, rather than adding a second "Remember…" row, the existing **"Remember density"** row is renamed to **"Remember appearance"** and its single switch drives `setPersist` for BOTH `density` and `reducedMotion` together; its checked state reflects `density.persist`. Roundness and card-shadow are token overrides, so they persist via the existing Tokens-tab "Remember edits" switch. Net: the Appearance tab has one persist switch ("Remember appearance" → density + reduced motion) and the Tokens tab keeps its own ("Remember edits" → token overrides, including roundness/shadow).

## Data flow

```
ComponentShowcasePage (owns hooks)
  ├─ tokens         = useDesignTokenOverrides(true)   → :root custom props
  ├─ density        = useDensity()                    → <html> data-density (via useRootPref)
  └─ reducedMotion  = useReducedMotion()              → <html> data-reduced-motion (via useRootPref)
        │
        ▼ props
ShowcaseSettingsDrawer › Appearance tab
  ├─ Theme / Language / Density (existing)
  ├─ Reduced motion toggle            → reducedMotion.setEnabled
  ├─ AppearanceTokenControls(tokens)  → tokens.setOverride/resetToken (radius*4, shadow-card)
  └─ "Remember appearance" switch     → density.setPersist + reducedMotion.setPersist
```

## Testing

- `useRootPref` pure helper `resolveInitialPref` — unit test (value+persist resolution across valid/invalid/absent stored values).
- `appearanceTokenScales` — unit tests: `scaleRem` (including factor 0 and rem parsing), `roundnessOverridesFor`, `activeRoundness` (exact match + null on custom edits), `activeShadowCard`.
- `density.test.ts` — trimmed to the retained pure helpers (`isDensity`, `DEFAULT_DENSITY`); removed-helper tests deleted.
- Source-string assertion in `showcaseLayout.test.ts` (or a sibling) that the drawer wires reduced motion + appearance controls — optional, matching the file's style.
- Reduced-motion CSS + hook behavior and the drawer UI are typecheck-gated + manual smoke (no RTL in apps/web).

## Manual smoke

1. Toggle **Reduced motion** → drawer/section animations stop; reload with "Remember appearance" on persists it.
2. **Roundness** Square/Round visibly changes card/control/badge corners live; "Default" clears the radius overrides; the matching preset highlights, custom Tokens-tab edits clear the highlight.
3. **Card shadow** Off/Subtle/Strong changes card elevation live; values appear in Copy CSS.
4. "Reset everything" returns density, reduced motion, roundness, shadow, and tokens to defaults and clears persisted prefs.

## Open implementation details (resolved in the plan)

- Exact placement/order of the new rows within the Appearance tab.
- Whether `Segmented` is extracted as a shared local building block or each control inlines its buttons (lean: extract one small `Segmented` to cover density + roundness + shadow).
