# Showcase Global Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Component Showcase into a frontend-first tuning surface — a right-hand slide-over settings drawer (theme, locale, density, design tokens) reachable from every section, plus a grouped/filterable section nav.

**Architecture:** A single global override layer. `ComponentShowcasePage` owns the long-lived hooks (`useDesignTokenOverrides`, `useDensity`) so overrides stay applied while the Radix-based drawer (which unmounts its content when closed) is shut. The drawer and the extracted `TokenEditorPanel` are controlled presentational components. Tokens write CSS custom properties at `:root`; density sets `data-density` on `<html>` mapped to a root `font-size`; theme/locale flow through the existing `useUserPreferences` provider. The section behind the drawer is the live preview, so the dedicated Design tokens section is removed.

**Tech Stack:** React 19, TypeScript, Tailwind (rem-based spacing), base-ui (`Drawer`, `Tabs`, `SettingsLayout`, `Button`, `Input`, `Switch`, `CollapsibleSection`), Vitest. base-ui tests use `@testing-library/react`; apps/web tests use pure-function unit tests + source-string assertions (no RTL in apps/web).

---

## File Structure

**Create:**

- `apps/web/src/lib/density/density.ts` — pure density helpers (types, storage, DOM apply/clear)
- `apps/web/src/lib/density/density.test.ts` — unit tests for the pure helpers
- `apps/web/src/lib/density/useDensity.ts` — React hook wrapping the helpers
- `apps/web/src/modules/showcase/components/TokenEditorPanel.tsx` — presentational token editor (search + groups + actions), controlled by a `DesignTokenOverridesController`
- `apps/web/src/modules/showcase/components/ShowcaseSettingsDrawer.tsx` — the slide-over drawer (Appearance + Tokens tabs, footer reset) + local density segmented control

**Modify:**

- `packages/base-ui/src/components/settings-layout.tsx` — add optional grouping + filter (backward compatible) and export two pure helpers
- `packages/base-ui/src/components/settings-layout.test.tsx` — NEW test file (base-ui has RTL)
- `apps/web/src/lib/design-tokens/useDesignTokenOverrides.ts` — export `DesignTokenOverridesController` type
- `apps/web/src/styles/globals.css` — density font-size rules
- `apps/web/src/modules/showcase/shared.tsx` — drop `'design-tokens'`; add `group` to nav items + export group order
- `apps/web/src/modules/showcase/ComponentShowcasePage.tsx` — own hooks, mount drawer + gear, grouped/filterable nav, remove design-tokens special-cases
- `apps/web/src/modules/showcase/showcaseLayout.test.ts` — replace the design-tokens special-case test

**Delete:**

- `apps/web/src/modules/showcase/sections/DesignTokensSection.tsx`

---

## Task 1: Density mechanism

**Files:**

- Create: `apps/web/src/lib/density/density.ts`
- Test: `apps/web/src/lib/density/density.test.ts`
- Create: `apps/web/src/lib/density/useDensity.ts`
- Modify: `apps/web/src/styles/globals.css`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/density/density.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

import {
  applyDensityToDom,
  clearDensityFromDom,
  DEFAULT_DENSITY,
  DENSITY_STORAGE_KEY,
  isDensity,
  readStoredDensity,
} from './density';

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-density');
});

describe('isDensity', () => {
  it('accepts the three known values and rejects anything else', () => {
    expect(isDensity('compact')).toBe(true);
    expect(isDensity('comfortable')).toBe(true);
    expect(isDensity('spacious')).toBe(true);
    expect(isDensity('cozy')).toBe(false);
    expect(isDensity(null)).toBe(false);
  });
});

describe('readStoredDensity', () => {
  it('returns null when nothing valid is stored', () => {
    expect(readStoredDensity(window.localStorage)).toBeNull();
    window.localStorage.setItem(DENSITY_STORAGE_KEY, 'cozy');
    expect(readStoredDensity(window.localStorage)).toBeNull();
  });

  it('returns the stored density when valid', () => {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, 'compact');
    expect(readStoredDensity(window.localStorage)).toBe('compact');
  });
});

describe('applyDensityToDom / clearDensityFromDom', () => {
  it('sets and removes the data-density attribute on the root', () => {
    applyDensityToDom(document.documentElement, 'spacious');
    expect(document.documentElement.getAttribute('data-density')).toBe('spacious');
    clearDensityFromDom(document.documentElement);
    expect(document.documentElement.hasAttribute('data-density')).toBe(false);
  });
});

describe('DEFAULT_DENSITY', () => {
  it('is comfortable', () => {
    expect(DEFAULT_DENSITY).toBe('comfortable');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- density`
Expected: FAIL — `Cannot find module './density'`.

- [ ] **Step 3: Write the pure helpers**

Create `apps/web/src/lib/density/density.ts`:

```ts
import { safeStorageGet } from '@/lib/storage/safeStorage';

export type Density = 'compact' | 'comfortable' | 'spacious';

export const DENSITIES: readonly Density[] = ['compact', 'comfortable', 'spacious'];
export const DEFAULT_DENSITY: Density = 'comfortable';
export const DENSITY_STORAGE_KEY = 'oktavius.showcase.density';

export function isDensity(value: unknown): value is Density {
  return typeof value === 'string' && (DENSITIES as readonly string[]).includes(value);
}

export function readStoredDensity(storage: Storage | null): Density | null {
  const raw = safeStorageGet(storage, DENSITY_STORAGE_KEY);
  return isDensity(raw) ? raw : null;
}

export function applyDensityToDom(root: HTMLElement, density: Density): void {
  root.setAttribute('data-density', density);
}

export function clearDensityFromDom(root: HTMLElement): void {
  root.removeAttribute('data-density');
}
```

> Verify `safeStorageGet(storage, key)` signature in `apps/web/src/lib/storage/safeStorage.ts` matches `(storage: Storage | null, key: string) => string | null`. It is already used this way in `useDesignTokenOverrides.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- density`
Expected: PASS (all cases).

- [ ] **Step 5: Write the hook**

Create `apps/web/src/lib/density/useDensity.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';

import { getWindowStorage, safeStorageRemove, safeStorageSet } from '@/lib/storage/safeStorage';

import {
  applyDensityToDom,
  clearDensityFromDom,
  DEFAULT_DENSITY,
  type Density,
  DENSITY_STORAGE_KEY,
  readStoredDensity,
} from './density';

export type DensityController = {
  density: Density;
  setDensity: (value: Density) => void;
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void;
};

export function useDensity(): DensityController {
  const [density, setDensity] = useState<Density>(
    () => readStoredDensity(getWindowStorage('localStorage')) ?? DEFAULT_DENSITY,
  );
  const [persist, setPersist] = useState<boolean>(
    () => readStoredDensity(getWindowStorage('localStorage')) !== null,
  );

  useEffect(() => {
    const root = document.documentElement;
    applyDensityToDom(root, density);
    if (persist) {
      safeStorageSet(getWindowStorage('localStorage'), DENSITY_STORAGE_KEY, density);
    } else {
      safeStorageRemove(getWindowStorage('localStorage'), DENSITY_STORAGE_KEY);
    }
    return () => {
      clearDensityFromDom(root);
    };
  }, [density, persist]);

  const reset = useCallback(() => setDensity(DEFAULT_DENSITY), []);

  return { density, setDensity, persist, setPersist, reset };
}
```

> Confirm `getWindowStorage`, `safeStorageSet`, `safeStorageRemove` exports exist in `safeStorage.ts` (they are imported the same way in `useDesignTokenOverrides.ts`).

- [ ] **Step 6: Add density CSS**

Append to the end of `apps/web/src/styles/globals.css`:

```css
/* Density: scales rem-based spacing + type uniformly via the root font-size.
   Set by useDensity() on <html> as data-density. */
:root[data-density='compact'] {
  font-size: 15px;
}
:root[data-density='comfortable'] {
  font-size: 16px;
}
:root[data-density='spacious'] {
  font-size: 17px;
}
```

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/density apps/web/src/styles/globals.css
git commit -m "feat(showcase): density mechanism via root font-size"
```

---

## Task 2: Grouping + filter for SettingsLayout (base-ui)

**Files:**

- Modify: `packages/base-ui/src/components/settings-layout.tsx`
- Test: `packages/base-ui/src/components/settings-layout.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/base-ui/src/components/settings-layout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  filterSettingsNavItems,
  groupSettingsNavItems,
  SettingsLayout,
  type SettingsNavItem,
} from './settings-layout';

const items: SettingsNavItem[] = [
  { key: 'a', label: 'Buttons', description: 'clickable', group: 'Foundations' },
  { key: 'b', label: 'Tables', description: 'data grid', group: 'Components' },
  { key: 'c', label: 'Kanban', description: 'board', group: 'Patterns' },
];

describe('filterSettingsNavItems', () => {
  it('matches label and description case-insensitively', () => {
    expect(filterSettingsNavItems(items, 'GRID').map((i) => i.key)).toEqual(['b']);
    expect(filterSettingsNavItems(items, '').map((i) => i.key)).toEqual(['a', 'b', 'c']);
  });
});

describe('groupSettingsNavItems', () => {
  it('orders groups by groupOrder, then appends any remaining', () => {
    const groups = groupSettingsNavItems(items, ['Components', 'Foundations']);
    expect(groups.map((g) => g.group)).toEqual(['Components', 'Foundations', 'Patterns']);
    expect(groups[0]?.items.map((i) => i.key)).toEqual(['b']);
  });
});

describe('SettingsLayout grouping + filter', () => {
  it('renders group headers when items carry a group', () => {
    render(
      <SettingsLayout
        items={items}
        activeKey="a"
        onSelect={() => {}}
        groupOrder={['Foundations', 'Components', 'Patterns']}
      >
        content
      </SettingsLayout>,
    );
    // Group headers render once (desktop nav only).
    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
  });

  it('filters items as the user types when filterable', async () => {
    const user = userEvent.setup();
    render(
      <SettingsLayout items={items} activeKey="a" onSelect={() => {}} filterable>
        content
      </SettingsLayout>,
    );
    const input = screen.getByPlaceholderText('Filter sections…');
    await user.type(input, 'kan');
    // Item labels appear in both desktop + mobile nav, so use getAllByText.
    expect(screen.getAllByText('Kanban').length).toBeGreaterThan(0);
    expect(screen.queryByText('Buttons')).not.toBeInTheDocument();
  });

  it('renders a flat list with no filter input when neither group nor filterable is used', () => {
    const flat: SettingsNavItem[] = [
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Beta' },
    ];
    render(
      <SettingsLayout items={flat} activeKey="a" onSelect={() => {}}>
        content
      </SettingsLayout>,
    );
    expect(screen.queryByPlaceholderText('Filter sections…')).not.toBeInTheDocument();
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/base-ui test -- settings-layout`
Expected: FAIL — `filterSettingsNavItems` / `groupSettingsNavItems` not exported.

- [ ] **Step 3: Add the pure helpers and extend the props**

In `packages/base-ui/src/components/settings-layout.tsx`, add `useState` to the React import and replace the interface + helpers region. The `SettingsNavItem` interface gains `group`; `SettingsLayoutProps` gains `filterable`, `groupOrder`, `filterPlaceholder`. Add the two exported helpers above the component:

```tsx
import { useState, type ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface SettingsNavItem {
  key: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  /** Optional bucket label; when any item has one, the nav renders group headers. */
  group?: string;
}

export interface SettingsLayoutProps {
  items: SettingsNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  children: ReactNode;
  className?: string;
  /** Applied to the main content panel — use overflow-hidden when children manage their own scroll (e.g. SplitView). */
  contentClassName?: string;
  /** Show a filter box above the nav that narrows items by label/description. */
  filterable?: boolean;
  /** Placeholder for the filter box. */
  filterPlaceholder?: string;
  /** Order of group headers; groups not listed are appended in first-seen order. */
  groupOrder?: string[];
}

export function filterSettingsNavItems(items: SettingsNavItem[], query: string): SettingsNavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      (item.description?.toLowerCase().includes(q) ?? false),
  );
}

export function groupSettingsNavItems(
  items: SettingsNavItem[],
  groupOrder?: string[],
): Array<{ group: string | null; items: SettingsNavItem[] }> {
  const buckets = new Map<string | null, SettingsNavItem[]>();
  for (const item of items) {
    const key = item.group ?? null;
    const existing = buckets.get(key);
    if (existing) existing.push(item);
    else buckets.set(key, [item]);
  }
  const orderedKeys: Array<string | null> = [];
  if (groupOrder) {
    for (const g of groupOrder) if (buckets.has(g)) orderedKeys.push(g);
  }
  for (const key of buckets.keys()) if (!orderedKeys.includes(key)) orderedKeys.push(key);
  return orderedKeys.map((group) => ({ group, items: buckets.get(group) ?? [] }));
}
```

- [ ] **Step 4: Rewrite the component body**

Replace the `SettingsLayout` function (the `export function SettingsLayout({...}) { return (...) }` block) with:

```tsx
/**
 * Two-column settings layout: nav sidebar on left, content on right.
 * Desktop: each column scrolls independently. Mobile: horizontal section tabs + scrolling content.
 * Optionally renders a filter box and/or group headers.
 */
export function SettingsLayout({
  items,
  activeKey,
  onSelect,
  children,
  className,
  contentClassName,
  filterable = false,
  filterPlaceholder = 'Filter sections…',
  groupOrder,
}: SettingsLayoutProps) {
  const [query, setQuery] = useState('');
  const visibleItems = filterable ? filterSettingsNavItems(items, query) : items;
  const hasGroups = visibleItems.some((item) => item.group);
  const groups = groupSettingsNavItems(visibleItems, groupOrder);

  const navButtonClass = (isActive: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
      isActive
        ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
    );

  const renderNavButton = (item: SettingsNavItem) => {
    const isActive = item.key === activeKey;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onSelect(item.key)}
        className={navButtonClass(isActive)}
      >
        {item.icon ? (
          <span
            className={cn('shrink-0', isActive ? 'text-sidebar-primary' : 'text-muted-foreground')}
          >
            {item.icon}
          </span>
        ) : null}
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-8', className)}>
      {/* Desktop section nav */}
      <nav
        aria-label="Section navigation"
        className="hidden min-h-0 w-52 shrink-0 flex-col gap-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] md:flex"
      >
        {filterable ? (
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={filterPlaceholder}
            className="mb-1 h-8 shrink-0 rounded-md border border-border bg-muted/40 px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        ) : null}
        {hasGroups
          ? groups.map(({ group, items: groupItems }) =>
              groupItems.length === 0 ? null : (
                <div key={group ?? '_'} className="space-y-1">
                  {group ? (
                    <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {group}
                    </p>
                  ) : null}
                  {groupItems.map(renderNavButton)}
                </div>
              ),
            )
          : visibleItems.map(renderNavButton)}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {/* Mobile section nav — flat, filtered, no group headers */}
        <div className="flex shrink-0 gap-1 overflow-x-auto pb-1 md:hidden">
          {visibleItems.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-card bg-card p-5 [scrollbar-gutter:stable]',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
```

> Note: the original `import type { ReactNode } from 'react';` line is replaced by the combined `import { useState, type ReactNode } from 'react';` in Step 3. Leave the rest of the file (`SettingsSection`, `SettingsRow`, etc.) untouched.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @oktavius/base-ui test -- settings-layout`
Expected: PASS (all cases, including the flat regression).

- [ ] **Step 6: Typecheck base-ui**

Run: `pnpm --filter @oktavius/base-ui typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/base-ui/src/components/settings-layout.tsx packages/base-ui/src/components/settings-layout.test.tsx
git commit -m "feat(base-ui): optional grouping + filter for SettingsLayout"
```

---

## Task 3: Extract TokenEditorPanel

**Files:**

- Modify: `apps/web/src/lib/design-tokens/useDesignTokenOverrides.ts` (export controller type)
- Create: `apps/web/src/modules/showcase/components/TokenEditorPanel.tsx`

- [ ] **Step 1: Export the controller type**

At the bottom of `apps/web/src/lib/design-tokens/useDesignTokenOverrides.ts`, after the `useDesignTokenOverrides` function, add:

```ts
export type DesignTokenOverridesController = ReturnType<typeof useDesignTokenOverrides>;
```

- [ ] **Step 2: Create the panel**

Create `apps/web/src/modules/showcase/components/TokenEditorPanel.tsx`. This lifts the sidebar editor out of `DesignTokensSection` (search box + collapsible token groups + per-token `TokenEditor` + the action row), made controlled via a `DesignTokenOverridesController` prop. It does NOT include the `SplitView` or any live preview.

```tsx
import { Button, CollapsibleSection, Input, SettingsRow, Switch } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import {
  getEditableTokens,
  getEditableTokensBySection,
  readBaseTokenFromStylesheet,
} from '@/lib/design-tokens/tokenRegistry';
import type { DesignTokenOverridesController } from '@/lib/design-tokens/useDesignTokenOverrides';
import { appToast } from '@/lib/toast';
import { useUserPreferences } from '@/lib/userPreferences';
import { TokenEditor } from '@/modules/showcase/components/TokenEditor';

const EDITABLE_TOKENS = getEditableTokens();
const EDITABLE_SECTIONS = getEditableTokensBySection();

export function TokenEditorPanel({ controller }: { controller: DesignTokenOverridesController }) {
  const { theme } = useUserPreferences();
  const {
    overrides,
    setOverride,
    resetToken,
    resetAll,
    exportCss,
    overrideCount,
    persist,
    setPersist,
  } = controller;
  const [search, setSearch] = useState('');

  const defaults = useMemo(() => {
    void theme;
    const map: Record<string, string> = {};
    for (const token of EDITABLE_TOKENS) {
      map[token.key] = readBaseTokenFromStylesheet(token.key);
    }
    return map;
  }, [theme]);

  const visibleTokens = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;
    return EDITABLE_TOKENS.filter(
      (token) =>
        token.key.includes(query) ||
        token.label.toLowerCase().includes(query) ||
        token.description?.toLowerCase().includes(query),
    );
  }, [search]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return EDITABLE_SECTIONS;
    return EDITABLE_SECTIONS.map((section) => ({
      ...section,
      tokens: section.tokens.filter(
        (token) =>
          token.key.includes(query) ||
          token.label.toLowerCase().includes(query) ||
          token.description?.toLowerCase().includes(query),
      ),
    })).filter((section) => section.tokens.length > 0);
  }, [search]);

  const handleCopyCss = async () => {
    if (!exportCss) {
      appToast.info('No overrides to copy yet.');
      return;
    }
    await navigator.clipboard.writeText(exportCss);
    appToast.success('CSS overrides copied. Paste into globals.css :root or .dark.');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={resetAll} disabled={overrideCount === 0}>
          Reset all ({overrideCount})
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopyCss} disabled={overrideCount === 0}>
          Copy CSS
        </Button>
        <SettingsRow
          label="Remember edits"
          description="Save overrides to localStorage."
          className="ml-auto max-w-xs border-0 py-0"
        >
          <Switch checked={persist} onCheckedChange={setPersist} />
        </SettingsRow>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search tokens…"
        className="h-8 text-sm"
      />

      <div className="space-y-3">
        {visibleTokens ? (
          visibleTokens.length > 0 ? (
            visibleTokens.map((token) => (
              <TokenEditor
                key={token.key}
                token={token}
                value={overrides[token.key]}
                defaultValue={defaults[token.key] ?? ''}
                onChange={(value) => setOverride(token.key, value)}
                onReset={() => resetToken(token.key)}
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No tokens match.</p>
          )
        ) : (
          filteredSections.map((section) => (
            <CollapsibleSection
              key={section.id}
              title={section.label}
              badge={String(section.tokens.length)}
              defaultOpen={section.defaultOpen}
              variant="plain"
            >
              <p className="mb-2 text-xs text-muted-foreground">{section.description}</p>
              <div className="space-y-2">
                {section.tokens.map((token) => (
                  <TokenEditor
                    key={token.key}
                    token={token}
                    value={overrides[token.key]}
                    defaultValue={defaults[token.key] ?? ''}
                    onChange={(value) => setOverride(token.key, value)}
                    onReset={() => resetToken(token.key)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS (the panel is not yet imported anywhere, but it must compile).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/design-tokens/useDesignTokenOverrides.ts apps/web/src/modules/showcase/components/TokenEditorPanel.tsx
git commit -m "refactor(showcase): extract controlled TokenEditorPanel"
```

---

## Task 4: ShowcaseSettingsDrawer

**Files:**

- Create: `apps/web/src/modules/showcase/components/ShowcaseSettingsDrawer.tsx`

- [ ] **Step 1: Create the drawer**

Create `apps/web/src/modules/showcase/components/ShowcaseSettingsDrawer.tsx`. Controlled `open`/`onOpenChange`; density via props (page-owned); theme/locale read from `useUserPreferences` directly; tokens via the controller; footer `Reset everything`.

```tsx
import {
  Button,
  cn,
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  SettingsRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';

import { type Density, DENSITIES } from '@/lib/density/density';
import type { DesignTokenOverridesController } from '@/lib/design-tokens/useDesignTokenOverrides';
import { useUserPreferences } from '@/lib/userPreferences';

import { TokenEditorPanel } from './TokenEditorPanel';

const DENSITY_LABELS: Record<Density, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
};

function DensitySegmented({
  value,
  onChange,
}: {
  value: Density;
  onChange: (value: Density) => void;
}) {
  return (
    <div className="inline-flex rounded-control border border-border p-0.5">
      {DENSITIES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-[0.4rem] px-3 py-1 text-xs font-medium transition-colors',
            value === option
              ? 'bg-sidebar-primary/10 text-sidebar-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {DENSITY_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

export type ShowcaseSettingsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokens: DesignTokenOverridesController;
  density: Density;
  onDensityChange: (value: Density) => void;
  densityPersist: boolean;
  onDensityPersistChange: (value: boolean) => void;
  onResetEverything: () => void;
};

export function ShowcaseSettingsDrawer({
  open,
  onOpenChange,
  tokens,
  density,
  onDensityChange,
  densityPersist,
  onDensityPersistChange,
  onResetEverything,
}: ShowcaseSettingsDrawerProps) {
  const { theme, setTheme, locale, setLocale } = useUserPreferences();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        side="right"
        className="flex w-[min(32rem,94vw)] max-w-[94vw] flex-col gap-0 p-0"
      >
        <DrawerHeader className="border-b border-border px-4 py-3">
          <DrawerTitle>Showcase settings</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="appearance" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-3 shrink-0">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent
            value="appearance"
            className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3"
          >
            <SettingsRow label="Theme" description="Light, dark, or follow the system.">
              <div className="inline-flex gap-1">
                {(['light', 'dark', 'system'] as const).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={theme === option ? 'secondary' : 'ghost'}
                    onClick={() => setTheme(option)}
                  >
                    {option[0]?.toUpperCase()}
                    {option.slice(1)}
                  </Button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow label="Language" description="UI locale.">
              <div className="inline-flex gap-1">
                {(['en', 'de'] as const).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={locale === option ? 'secondary' : 'ghost'}
                    onClick={() => setLocale(option)}
                  >
                    {option.toUpperCase()}
                  </Button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow label="Density" description="Scales spacing and type across the app.">
              <DensitySegmented value={density} onChange={onDensityChange} />
            </SettingsRow>

            <SettingsRow
              label="Remember density"
              description="Save the density choice to localStorage."
            >
              <Button
                size="sm"
                variant={densityPersist ? 'secondary' : 'ghost'}
                onClick={() => onDensityPersistChange(!densityPersist)}
              >
                {densityPersist ? 'On' : 'Off'}
              </Button>
            </SettingsRow>
          </TabsContent>

          <TabsContent value="tokens" className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <TokenEditorPanel controller={tokens} />
          </TabsContent>
        </Tabs>

        <DrawerFooter className="border-t border-border">
          <Button variant="outline" onClick={onResetEverything}>
            Reset everything
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

> Verify `useUserPreferences()` exposes `theme`, `setTheme`, `locale`, `setLocale` (confirmed in `userPreferences.tsx`). Verify `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `SettingsRow`, `Drawer*` are exported from `@oktavius/base-ui` (all confirmed). If `TabsTrigger` requires no extra props beyond `value`, the above is correct.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/showcase/components/ShowcaseSettingsDrawer.tsx
git commit -m "feat(showcase): global settings drawer (appearance + tokens)"
```

---

## Task 5: Wire the page — grouped nav, gear, drawer; remove design-tokens wiring

**Files:**

- Modify: `apps/web/src/modules/showcase/shared.tsx`
- Modify: `apps/web/src/modules/showcase/ComponentShowcasePage.tsx`
- Modify: `apps/web/src/modules/showcase/showcaseLayout.test.ts`

- [ ] **Step 1: Update shared.tsx — remove design-tokens, add groups**

In `apps/web/src/modules/showcase/shared.tsx`:

1. Remove `'design-tokens'` from the `ShowcaseSectionId` union.
2. Add a `group` field to each `SHOWCASE_NAV` entry and remove the `design-tokens` entry. Add a group-order export. Replace the `SHOWCASE_NAV` declaration with the version below (note the new `group` on every item and the added `ShowcaseGroup` type + `SHOWCASE_GROUP_ORDER`):

```tsx
export type ShowcaseGroup = 'Foundations' | 'Components' | 'Patterns' | 'ERP';

export const SHOWCASE_GROUP_ORDER: ShowcaseGroup[] = [
  'Foundations',
  'Components',
  'Patterns',
  'ERP',
];

export const SHOWCASE_NAV: Array<{
  key: ShowcaseSectionId;
  label: string;
  description: string;
  group: ShowcaseGroup;
}> = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'How to use this gallery',
    group: 'Foundations',
  },
  {
    key: 'foundations',
    label: 'Foundations',
    description: 'Buttons, badges, status, typography',
    group: 'Foundations',
  },
  {
    key: 'layouts',
    label: 'Layouts',
    description: 'Layout primitives (Stack, Cluster, Split, Sidebar, Grid) + page templates',
    group: 'Foundations',
  },
  {
    key: 'inputs',
    label: 'Inputs',
    description: 'All control primitives and states',
    group: 'Components',
  },
  { key: 'forms', label: 'Forms', description: 'EntityForm field registry', group: 'Components' },
  {
    key: 'feedback',
    label: 'Feedback',
    description: 'Toasts, banners, empty & loading states',
    group: 'Components',
  },
  {
    key: 'errors',
    label: 'Errors',
    description: 'Module and section error boundaries with retry fallbacks',
    group: 'Components',
  },
  {
    key: 'dialogs',
    label: 'Dialogs',
    description: 'Modals, confirms, menus, wizards',
    group: 'Components',
  },
  { key: 'data', label: 'Data', description: 'Tables, stats, lists, export', group: 'Components' },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Settings page factory and generic catalog blocks',
    group: 'Components',
  },
  {
    key: 'responsive-detail',
    label: 'Responsive detail',
    description: 'URL-backed master-detail layouts that collapse below md',
    group: 'Patterns',
  },
  {
    key: 'detail-layout',
    label: 'Detail & layout',
    description: 'DetailView, SplitView, tabs, settings',
    group: 'Patterns',
  },
  {
    key: 'workflow',
    label: 'Workflow',
    description: 'Tasks, approvals, comments, mentions',
    group: 'Patterns',
  },
  {
    key: 'agent',
    label: 'Agent',
    description: 'Chat shell, message list, result cards, settings',
    group: 'Patterns',
  },
  {
    key: 'documents',
    label: 'Documents',
    description: 'Preview, PDF panel, templates, attachments',
    group: 'Patterns',
  },
  {
    key: 'calendar-charts',
    label: 'Calendar & charts',
    description: 'Scheduling, KPI charts, report builder',
    group: 'Patterns',
  },
  {
    key: 'patterns',
    label: 'ERP patterns',
    description: 'Kanban, stepper, tree, maps, import',
    group: 'ERP',
  },
  {
    key: 'comms-ops',
    label: 'Comms & ops',
    description: 'Time tracking, group chat, knowledge base, doc processing, notifications',
    group: 'ERP',
  },
];
```

The resulting `ShowcaseSectionId` union (design-tokens removed):

```tsx
export type ShowcaseSectionId =
  | 'overview'
  | 'foundations'
  | 'layouts'
  | 'inputs'
  | 'forms'
  | 'feedback'
  | 'errors'
  | 'dialogs'
  | 'data'
  | 'settings'
  | 'responsive-detail'
  | 'detail-layout'
  | 'workflow'
  | 'agent'
  | 'documents'
  | 'calendar-charts'
  | 'patterns'
  | 'comms-ops';
```

Leave `ShowcaseBlock` unchanged.

- [ ] **Step 2: Rewrite ComponentShowcasePage.tsx**

Replace the entire file with the version below. Changes from the original: removes the `DesignTokensSection` import + its `case`; removes all `activeSection === 'design-tokens'` special-cases; owns `useDesignTokenOverrides(true)` and `useDensity()`; adds a gear button in `ModulePage` `actions`; mounts `ShowcaseSettingsDrawer`; passes `groupOrder` + `filterable` to the nav.

```tsx
import { Button } from '@oktavius/base-ui';
import { useState } from 'react';

import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { ModulePage } from '@/components/common/PageLayout';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';
import { useDensity } from '@/lib/density/useDensity';
import { useDesignTokenOverrides } from '@/lib/design-tokens/useDesignTokenOverrides';
import { SettingsIcon } from '@/lib/icons';
import { showcasePageIcon } from '@/lib/modulePageIcons';

import { ShowcaseSettingsDrawer } from './components/ShowcaseSettingsDrawer';
import { AgentSection } from './sections/AgentSection';
import { CalendarChartsSection } from './sections/CalendarChartsSection';
import { CommsOpsSection } from './sections/CommsOpsSection';
import { DataSection } from './sections/DataSection';
import { DetailLayoutSection } from './sections/DetailLayoutSection';
import { DialogsSection } from './sections/DialogsSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { ErrorsSection } from './sections/ErrorsSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { FormsSection } from './sections/FormsSection';
import { FoundationsSection } from './sections/FoundationsSection';
import { InputsSection } from './sections/InputsSection';
import { LayoutsSection } from './sections/LayoutsSection';
import { OverviewSection } from './sections/OverviewSection';
import { PatternsSection } from './sections/PatternsSection';
import { ResponsiveDetailSection } from './sections/ResponsiveDetailSection';
import { SettingsShowcaseSection } from './sections/SettingsSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { SHOWCASE_GROUP_ORDER, SHOWCASE_NAV, type ShowcaseSectionId } from './shared';

function ShowcaseSectionContent({ section }: { section: ShowcaseSectionId }) {
  switch (section) {
    case 'overview':
      return <OverviewSection />;
    case 'foundations':
      return <FoundationsSection />;
    case 'layouts':
      return <LayoutsSection />;
    case 'inputs':
      return <InputsSection />;
    case 'forms':
      return <FormsSection />;
    case 'feedback':
      return <FeedbackSection />;
    case 'errors':
      return <ErrorsSection />;
    case 'dialogs':
      return <DialogsSection />;
    case 'data':
      return <DataSection />;
    case 'settings':
      return <SettingsShowcaseSection />;
    case 'responsive-detail':
      return <ResponsiveDetailSection />;
    case 'detail-layout':
      return <DetailLayoutSection />;
    case 'workflow':
      return <WorkflowSection />;
    case 'agent':
      return <AgentSection />;
    case 'documents':
      return <DocumentsSection />;
    case 'calendar-charts':
      return <CalendarChartsSection />;
    case 'patterns':
      return <PatternsSection />;
    case 'comms-ops':
      return <CommsOpsSection />;
    default:
      return null;
  }
}

export function ComponentShowcasePage() {
  const [activeSection, setActiveSection] = useState<ShowcaseSectionId>('overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeMeta = SHOWCASE_NAV.find((item) => item.key === activeSection);

  // Owned at the page level so overrides persist while the drawer (which unmounts
  // its content when closed) is shut.
  const tokens = useDesignTokenOverrides(true);
  const density = useDensity();

  const handleResetEverything = () => {
    tokens.resetAll();
    density.reset();
  };

  return (
    <ModulePage
      title="Component showcase"
      subtitle="Structured gallery of every UI primitive, block, and ERP pattern — all interactive"
      icon={showcasePageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open showcase settings"
          onClick={() => setSettingsOpen(true)}
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      }
    >
      <AppSectionNavLayout
        items={SHOWCASE_NAV.map((item) => ({
          key: item.key,
          label: item.label,
          description: item.description,
          group: item.group,
        }))}
        groupOrder={SHOWCASE_GROUP_ORDER}
        filterable
        activeKey={activeSection}
        onSelect={(key) => setActiveSection(key as ShowcaseSectionId)}
      >
        <div className="flex flex-col gap-4">
          {activeMeta ? (
            <p className="shrink-0 text-sm text-muted-foreground">{activeMeta.description}</p>
          ) : null}
          <div>
            <ShowcaseSectionContent section={activeSection} />
          </div>
        </div>
      </AppSectionNavLayout>

      <ShowcaseSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tokens={tokens}
        density={density.density}
        onDensityChange={density.setDensity}
        densityPersist={density.persist}
        onDensityPersistChange={density.setPersist}
        onResetEverything={handleResetEverything}
      />
    </ModulePage>
  );
}
```

> Confirm `SettingsIcon` is exported from `@/lib/icons` (it is — `Gear as SettingsIcon`). Confirm `ModulePage` accepts an `actions` prop (it does, via `PageHeaderProps`).

- [ ] **Step 3: Update showcaseLayout.test.ts**

In `apps/web/src/modules/showcase/showcaseLayout.test.ts`, replace the first test (`'constrains the design-token section so its split panes can scroll'`) with a test asserting the design-tokens section is gone and the drawer/grouping are wired:

```ts
it('removes the design-tokens section and wires the global settings drawer', () => {
  const shared = readFileSync(join(process.cwd(), 'src/modules/showcase/shared.tsx'), 'utf8');
  const page = readFileSync(
    join(process.cwd(), 'src/modules/showcase/ComponentShowcasePage.tsx'),
    'utf8',
  );

  // design-tokens fully removed
  expect(shared).not.toContain("key: 'design-tokens'");
  expect(page).not.toContain("case 'design-tokens':");
  expect(page).not.toContain("activeSection === 'design-tokens'");

  // global settings drawer + grouped, filterable nav wired
  expect(page).toContain('<ShowcaseSettingsDrawer');
  expect(page).toContain('groupOrder={SHOWCASE_GROUP_ORDER}');
  expect(page).toContain('filterable');
  expect(shared).toContain('SHOWCASE_GROUP_ORDER');
});
```

Leave the other tests in the file unchanged.

- [ ] **Step 4: Run the showcase + density + settings-layout tests**

Run: `pnpm --filter @oktavius/web test -- showcase`
Expected: PASS (updated first test + all unchanged tests).

- [ ] **Step 5: Typecheck the workspace**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS. (At this point `DesignTokensSection.tsx` still exists but is no longer imported — that is fine; it is deleted in Task 6.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/showcase/shared.tsx apps/web/src/modules/showcase/ComponentShowcasePage.tsx apps/web/src/modules/showcase/showcaseLayout.test.ts
git commit -m "feat(showcase): grouped/filterable nav + mount settings drawer"
```

---

## Task 6: Delete the Design tokens section

**Files:**

- Delete: `apps/web/src/modules/showcase/sections/DesignTokensSection.tsx`

- [ ] **Step 1: Confirm nothing imports it**

Run: `grep -rn "DesignTokensSection" apps/web/src`
Expected: no matches (Task 5 removed the import + case).

- [ ] **Step 2: Delete the file**

```bash
git rm apps/web/src/modules/showcase/sections/DesignTokensSection.tsx
```

- [ ] **Step 3: Typecheck + test + lint**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web test -- showcase && pnpm --filter @oktavius/web lint`
Expected: all PASS (no dangling imports, no unused-symbol lint errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(showcase): remove dedicated Design tokens section"
```

---

## Final verification

- [ ] **Full workspace gate**

Run: `pnpm -r typecheck && pnpm -r test && pnpm -r lint`
Expected: all PASS.

- [ ] **Manual smoke (frontend)**

Run the web app, open the Component showcase:

1. Gear button (top-right) opens the right drawer.
2. Appearance tab: toggling theme/locale/density updates the section behind the drawer live; density visibly tightens/loosens spacing + type.
3. Tokens tab: editing a token updates the live section; Copy CSS / Reset all work; "Remember edits" persists across reload.
4. Close the drawer — token + density overrides remain applied (proves page-level ownership).
5. Nav shows group headers (Foundations · Components · Patterns · ERP) and the filter box narrows sections.
6. "Reset everything" clears tokens + density back to defaults.

---

## Notes for the implementer

- **DRY:** `TokenEditorPanel` reuses the exact filtering/defaults logic from the old `DesignTokensSection`; do not duplicate it elsewhere.
- **Page-level hook ownership is load-bearing:** do not move `useDesignTokenOverrides`/`useDensity` into the drawer — the Radix drawer unmounts content on close and the cleanup would clear overrides.
- **Backward compatibility:** the `SettingsLayout` changes are additive; existing real settings pages pass no `group`/`filterable` and must render exactly as before (covered by the flat-list regression test).
- **No new dependencies:** density uses pure helpers + a thin hook (apps/web has no RTL); the only rendering test is in base-ui, which already has RTL.
