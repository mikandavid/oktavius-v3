# Account Dropdown Redesign ("Account Panel") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the navbar account dropdown into a designed "Account panel" — profile header, neutral identity pills, inline segmented Theme/Language toggles, and an inline Organisation row — without changing the navbar trigger or any backend behavior.

**Architecture:** Add a presentation-only `SegmentedToggle` primitive to `@oktavius/base-ui`. Refactor `AccountMenuSections.tsx` so Theme and Language become inline segmented-toggle rows (replacing the old submenu sections), add neutral `IdentityPills`, and add a single-org static branch to `OrganizationMenuSection`. Recompose `HeaderAccountMenu.tsx` to render the new ordered body. The trigger button is untouched.

**Tech Stack:** React 19, TypeScript, Tailwind v3, Radix-based `@oktavius/base-ui` dropdown primitives, Vitest. base-ui tests use `@testing-library/react`; apps/web tests use the `createRoot + act` harness (no RTL in apps/web).

---

## File Structure

- **Create:** `packages/base-ui/src/components/segmented-toggle.tsx` — generic `role="radiogroup"` segmented control (presentation-only, no domain knowledge).
- **Create:** `packages/base-ui/src/components/segmented-toggle.test.tsx` — RTL unit test.
- **Modify:** `packages/base-ui/src/index.ts` — export the new component.
- **Modify:** `apps/web/src/components/layout/AccountMenuSections.tsx` — replace `LanguageMenuSection`/`DesignMenuSection` submenus with `ThemeMenuRow`/`LanguageMenuRow` (built on `SegmentedToggle` via a shared `PreferenceRow`); add `IdentityPills`; add single-org static branch to `OrganizationMenuSection`.
- **Create:** `apps/web/src/components/layout/AccountMenuSections.test.tsx` — `createRoot + act` tests for `ThemeMenuRow`, `LanguageMenuRow`, `IdentityPills`, single-org `OrganizationMenuSection`.
- **Modify:** `apps/web/src/components/layout/HeaderAccountMenu.tsx` — recompose the dropdown body in the approved order.
- **Leave as-is:** `apps/web/src/components/layout/HeaderAccountMenu.orgSwitching.test.ts` (must stay green — it greps for `setActiveOrgId`, `onSelectOrg`, `signOut`, and asserts no `"Sign out unavailable"`).

---

## Task 1: `SegmentedToggle` primitive (base-ui)

**Files:**

- Create: `packages/base-ui/src/components/segmented-toggle.tsx`
- Test: `packages/base-ui/src/components/segmented-toggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/base-ui/src/components/segmented-toggle.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

import { SegmentedToggle } from './segmented-toggle';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

describe('SegmentedToggle', () => {
  it('exposes a labelled radiogroup with one radio per option', () => {
    render(
      <SegmentedToggle ariaLabel="Theme" value="system" options={OPTIONS} onChange={() => {}} />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the active option with aria-checked and the active surface class', () => {
    render(
      <SegmentedToggle ariaLabel="Theme" value="dark" options={OPTIONS} onChange={() => {}} />,
    );
    const dark = screen.getByRole('radio', { name: 'Dark' });
    expect(dark).toHaveAttribute('aria-checked', 'true');
    expect(dark.className).toContain('bg-card');
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the clicked value', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedToggle ariaLabel="Theme" value="system" options={OPTIONS} onChange={onChange} />,
    );
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Light' }));
    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('moves selection with arrow keys (wrapping)', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedToggle ariaLabel="Theme" value="system" options={OPTIONS} onChange={onChange} />,
    );
    const user = userEvent.setup();
    const active = screen.getByRole('radio', { name: 'System' });
    active.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('light'); // wraps past end
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('dark'); // wraps before start
  });

  it('uses option.ariaLabel for the accessible name when provided', () => {
    render(
      <SegmentedToggle
        ariaLabel="Language"
        value="en"
        options={[
          { value: 'de', label: 'DE', ariaLabel: 'Deutsch' },
          { value: 'en', label: 'EN', ariaLabel: 'English' },
        ]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/segmented-toggle.test.tsx`
Expected: FAIL — cannot resolve `./segmented-toggle`.

- [ ] **Step 3: Write the implementation**

Create `packages/base-ui/src/components/segmented-toggle.tsx`:

```tsx
import type { KeyboardEvent, ReactNode } from 'react';

import { buttonFocusClasses } from '../lib/controlStates';
import { cn } from '../lib/utils';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  /** Visible label (may be an abbreviation like "DE"). */
  label: string;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Accessible name when the visible label is an abbreviation/icon. */
  ariaLabel?: string;
}

export interface SegmentedToggleProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedToggleOption<T>>;
  onChange: (value: T) => void;
  /** Labels the whole control for assistive tech. */
  ariaLabel: string;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedToggleProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (direction === 0) {
      return;
    }
    event.preventDefault();
    const next = (index + direction + options.length) % options.length;
    onChange(options[next].value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5', className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.ariaLabel ?? option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'flex h-6 min-w-[1.75rem] items-center justify-center gap-1 rounded-[5px] px-2 text-xs font-medium transition-colors',
              buttonFocusClasses,
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/segmented-toggle.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Export from the package index**

In `packages/base-ui/src/index.ts`, add next to the other component exports (e.g. after the `icon-toggle` line):

```ts
export * from './components/segmented-toggle';
```

- [ ] **Step 6: Typecheck the package**

Run: `pnpm --filter @oktavius/base-ui exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/base-ui/src/components/segmented-toggle.tsx packages/base-ui/src/components/segmented-toggle.test.tsx packages/base-ui/src/index.ts
git commit -m "feat(base-ui): add SegmentedToggle primitive"
```

---

## Task 2: Theme & Language rows + `PreferenceRow` (AccountMenuSections)

**Files:**

- Modify: `apps/web/src/components/layout/AccountMenuSections.tsx`
- Test: `apps/web/src/components/layout/AccountMenuSections.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/layout/AccountMenuSections.test.tsx`:

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

const setTheme = vi.fn();
const setLocale = vi.fn();
const setLanguage = vi.fn();

vi.mock('@/lib/userPreferences', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/userPreferences')>();
  return {
    ...actual,
    useUserPreferences: () => ({
      theme: 'system',
      setTheme,
      themeLabel: 'System',
      locale: 'en',
      setLocale,
      localeLabel: 'English',
    }),
  };
});

vi.mock('@/core/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/i18n')>();
  return {
    ...actual,
    useI18n: () => ({ setLanguage }),
  };
});

import { LanguageMenuRow, ThemeMenuRow } from './AccountMenuSections';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

function renderRow(node: React.ReactNode) {
  act(() => {
    root.render(<TestI18nProvider>{node}</TestI18nProvider>);
  });
}

function clickRadio(name: string) {
  const radio = Array.from(container.querySelectorAll('[role="radio"]')).find(
    (el) => el.getAttribute('aria-label') === name,
  );
  if (!radio) {
    throw new Error(`radio not found: ${name}`);
  }
  act(() => {
    (radio as HTMLButtonElement).click();
  });
}

describe('ThemeMenuRow', () => {
  it('renders one radio per theme and calls setTheme on click', () => {
    renderRow(<ThemeMenuRow />);
    expect(container.querySelectorAll('[role="radio"]')).toHaveLength(3);
    clickRadio('Light');
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});

describe('LanguageMenuRow', () => {
  it('renders DE/EN radios and updates both locale and language on click', () => {
    renderRow(<LanguageMenuRow />);
    expect(container.querySelectorAll('[role="radio"]')).toHaveLength(2);
    clickRadio('Deutsch');
    expect(setLocale).toHaveBeenCalledWith('de');
    expect(setLanguage).toHaveBeenCalledWith('de');
  });
});
```

> Note: `option.ariaLabel` carries the full locale label (`LOCALE_LABELS.de` = "Deutsch", `LOCALE_LABELS.en` = "English"); the visible label is the uppercased code (`DE`/`EN`). The test queries by the accessible `aria-label`. If `LOCALE_LABELS` differs in this repo, query by whatever `UI_LOCALE_OPTIONS[n].label` resolves to — but per `userPreferences.tsx` the full label is the locale's display name.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/layout/AccountMenuSections.test.tsx`
Expected: FAIL — `LanguageMenuRow` / `ThemeMenuRow` are not exported.

- [ ] **Step 3: Add imports to AccountMenuSections.tsx**

In `apps/web/src/components/layout/AccountMenuSections.tsx`, update the base-ui import to include `SegmentedToggle` and keep the dropdown primitives:

```tsx
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  SegmentedToggle,
} from '@oktavius/base-ui';
```

Ensure the icon import line includes the theme icons (already present in `@/lib/icons`): `MoonIcon`, `SunIcon`, `SystemThemeIcon`. The existing import block already imports these — leave it.

- [ ] **Step 4: Add `PreferenceRow`, `ThemeMenuRow`, `LanguageMenuRow` and remove the old submenu sections**

In `AccountMenuSections.tsx`, **delete** the existing `LanguageMenuSection` and `DesignMenuSection` functions (lines for both `export function LanguageMenuSection` and `export function DesignMenuSection`), and also delete the now-unused `AccountSubmenu` and `AccountSubmenuOption` helpers **only if** nothing else references them (the `OrganizationMenuSection` still uses `AccountSubmenu` — see Task 3; keep `AccountSubmenu`/`AccountSubmenuOption` for now, they are removed/kept based on Task 3's final state. To stay safe, KEEP them in this task.)

Add the following near the top of the component definitions (after the imports):

```tsx
const THEME_ICON: Record<UiTheme, ReactNode> = {
  light: <SunIcon size={13} className="text-muted-foreground" />,
  dark: <MoonIcon size={13} className="text-muted-foreground" />,
  system: <SystemThemeIcon size={13} className="text-muted-foreground" />,
};

function PreferenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
      <span className="min-w-0 flex-1 truncate text-left text-foreground">{label}</span>
      {children}
    </div>
  );
}

export function ThemeMenuRow() {
  const { theme, setTheme } = useUserPreferences();
  return (
    <PreferenceRow label="Theme">
      <SegmentedToggle
        ariaLabel="Theme"
        value={theme}
        onChange={(value) => setTheme(value as UiTheme)}
        options={UI_THEME_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          icon: THEME_ICON[option.value],
          ariaLabel: option.label,
        }))}
      />
    </PreferenceRow>
  );
}

export function LanguageMenuRow() {
  const { locale, setLocale } = useUserPreferences();
  const { setLanguage } = useI18n();
  const { t } = useTranslation();
  const label = t('common.language', undefined, 'Language');
  return (
    <PreferenceRow label={label}>
      <SegmentedToggle
        ariaLabel={label}
        value={locale}
        onChange={(value) => {
          const next = value as UiLocale;
          setLocale(next);
          void setLanguage(next);
        }}
        options={UI_LOCALE_OPTIONS.map((option) => ({
          value: option.value,
          label: option.value.toUpperCase(),
          ariaLabel: option.label,
        }))}
      />
    </PreferenceRow>
  );
}
```

This uses already-imported symbols: `useUserPreferences`, `UI_THEME_OPTIONS`, `UI_LOCALE_OPTIONS`, `UiTheme`, `UiLocale` (from `@/lib/userPreferences`), `useI18n`, `useTranslation` (from `@/core/i18n`), and `ReactNode` (from `react`). The `ReactNode` type is already imported at the top (`import type { ReactNode } from 'react';`). `useI18n` is currently imported — confirm `useI18n` is in the existing `@/core/i18n` import line; it is (the file imports `useI18n, useTranslation`).

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/layout/AccountMenuSections.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/AccountMenuSections.tsx apps/web/src/components/layout/AccountMenuSections.test.tsx
git commit -m "feat(web): inline Theme & Language segmented rows in account menu"
```

---

## Task 3: `IdentityPills` + single-org branch (AccountMenuSections)

**Files:**

- Modify: `apps/web/src/components/layout/AccountMenuSections.tsx`
- Test: `apps/web/src/components/layout/AccountMenuSections.test.tsx` (extend)

- [ ] **Step 1: Add failing tests**

Append to `apps/web/src/components/layout/AccountMenuSections.test.tsx`:

```tsx
import { IdentityPills, OrganizationMenuSection } from './AccountMenuSections';

describe('IdentityPills', () => {
  it('renders org and role pills when both present', () => {
    renderRow(<IdentityPills orgName="Texterous" role="Owner" />);
    const text = container.textContent ?? '';
    expect(text).toContain('Texterous');
    expect(text).toContain('Owner');
  });

  it('renders nothing when both are absent', () => {
    renderRow(<IdentityPills orgName={null} role={null} />);
    expect(container.textContent).toBe('');
  });
});

describe('OrganizationMenuSection (single org)', () => {
  it('renders a static, non-interactive row for exactly one organization', () => {
    renderRow(
      <OrganizationMenuSection
        activeOrgId="org_1"
        organizations={[{ id: 'org_1', name: 'Texterous', slug: 'texterous' }]}
        onSelectOrg={() => {}}
      />,
    );
    expect(container.textContent).toContain('Texterous');
    // Static label: no submenu trigger button rendered.
    expect(container.querySelector('button')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/layout/AccountMenuSections.test.tsx`
Expected: FAIL — `IdentityPills` not exported; single-org case currently renders the `AccountSubmenu` trigger (a button), so the `querySelector('button')` assertion fails.

- [ ] **Step 3: Add `IdentityPills`**

In `AccountMenuSections.tsx`, add:

```tsx
function IdentityPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

export function IdentityPills({
  orgName,
  role,
}: {
  orgName?: string | null;
  role?: string | null;
}) {
  if (!orgName && !role) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5 px-2 pb-2 pt-1">
      {orgName ? <IdentityPill>{orgName}</IdentityPill> : null}
      {role ? <IdentityPill>{role}</IdentityPill> : null}
    </div>
  );
}
```

- [ ] **Step 4: Add the single-org static branch to `OrganizationMenuSection`**

In `OrganizationMenuSection`, immediately after the existing `if (organizations.length === 0) { return null; }` guard, add:

```tsx
if (organizations.length === 1) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
      <OrganizationLogo name={activeOrg?.name} logoUrl={activeOrg?.logoUrl} />
      <span className="min-w-0 flex-1 truncate text-left text-foreground">Organisation</span>
      <span className="min-w-0 max-w-[45%] truncate text-right text-xs text-muted-foreground">
        {activeOrg?.name}
      </span>
    </div>
  );
}
```

(The multi-org path below — `AccountSubmenu` with the org list — is unchanged.)

- [ ] **Step 5: Run to verify pass**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/layout/AccountMenuSections.test.tsx`
Expected: PASS (4 tests total).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/AccountMenuSections.tsx apps/web/src/components/layout/AccountMenuSections.test.tsx
git commit -m "feat(web): account identity pills and single-org static row"
```

---

## Task 4: Recompose `HeaderAccountMenu` body

**Files:**

- Modify: `apps/web/src/components/layout/HeaderAccountMenu.tsx`

- [ ] **Step 1: Update the imports from `./AccountMenuSections`**

Replace the existing import block:

```tsx
import {
  DesignMenuSection,
  LanguageMenuSection,
  OrganizationMenuSection,
} from './AccountMenuSections';
```

with:

```tsx
import {
  IdentityPills,
  LanguageMenuRow,
  OrganizationMenuSection,
  ThemeMenuRow,
} from './AccountMenuSections';
```

- [ ] **Step 2: Replace the dropdown body**

Replace the current `<DropdownMenuContent ...> ... </DropdownMenuContent>` block (the profile item, separator, Settings, the three sections, separator, Sign out) with the new ordered body:

```tsx
<DropdownMenuContent align="end" className="w-72">
  <DropdownMenuItem
    onSelect={() => navigate('/settings?section=account')}
    className="h-auto flex-col items-start gap-0.5 px-2 py-2 font-normal focus:bg-muted/50"
  >
    <span className="text-sm font-medium leading-tight text-foreground">{userLabel}</span>
    <span className="w-full truncate text-xs leading-tight text-muted-foreground">
      {currentUser.email ?? 'No email'}
    </span>
  </DropdownMenuItem>

  <IdentityPills orgName={activeOrg?.name ?? null} role={roleLabel} />

  <DropdownMenuSeparator />

  <div className="px-2 pb-1 pt-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
    Preferences
  </div>
  <ThemeMenuRow />
  <LanguageMenuRow />
  <OrganizationMenuSection
    activeOrgId={activeOrg?.id ?? activeOrgId}
    organizations={organizations}
    onSelectOrg={switchOrganization}
  />

  <DropdownMenuSeparator />

  <DropdownMenuItem onSelect={() => navigate('/settings')} className="gap-2">
    <SettingsIcon size={14} />
    Settings
  </DropdownMenuItem>

  <DropdownMenuItem
    disabled={!handleSignOut}
    onSelect={(event) => {
      if (!handleSignOut) {
        event.preventDefault();
        return;
      }
      handleSignOut();
    }}
    className="gap-2"
  >
    <SignOutIcon size={14} />
    Sign out
  </DropdownMenuItem>
</DropdownMenuContent>
```

Notes:

- The org/role that previously appeared as a third line in the profile item now lives in `IdentityPills`, so that line is removed from the profile `DropdownMenuItem`.
- `activeOrg`, `roleLabel`, `organizations`, `activeOrgId`, `switchOrganization`, `userLabel`, `currentUser`, `handleSignOut`, `navigate` are all already computed earlier in the component — no new data wiring needed.

- [ ] **Step 3: Typecheck + run the existing org-switching guard test**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors (the removed `DesignMenuSection`/`LanguageMenuSection` imports are gone; `ChevronDownIcon`, `SettingsIcon`, `SignOutIcon`, `UserIcon` still used).

Run: `pnpm --filter @oktavius/web exec vitest run src/components/layout/HeaderAccountMenu.orgSwitching.test.ts`
Expected: PASS — source still contains `setActiveOrgId`, `onSelectOrg`, `signOut`, and no `"Sign out unavailable"`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/HeaderAccountMenu.tsx
git commit -m "feat(web): recompose account dropdown into Account panel layout"
```

---

## Task 5: Cleanup, full verification

**Files:**

- Modify (only if dead code remains): `apps/web/src/components/layout/AccountMenuSections.tsx`

- [ ] **Step 1: Remove genuinely-dead helpers**

Confirm whether `AccountSubmenu` and `AccountSubmenuOption` are still referenced. After Task 2–3, `AccountSubmenu` is still used by the multi-org `OrganizationMenuSection`, but `AccountSubmenuOption` is only used by the deleted `LanguageMenuSection`/`DesignMenuSection`.

Run: `grep -n "AccountSubmenuOption" apps/web/src/components/layout/AccountMenuSections.tsx`

- If the only hit is its own definition, delete the `AccountSubmenuOption` function and any now-unused icon imports it required (`CheckIcon` is still used by the org list — keep it).

Run: `grep -n "DesignMenuSection\|LanguageMenuSection" apps/web/src/components/layout`
Expected: no matches (both removed; `HeaderAccountMenu` now imports `ThemeMenuRow`/`LanguageMenuRow`).

- [ ] **Step 2: Lint both packages**

Run: `pnpm --filter @oktavius/web exec eslint src/components/layout/HeaderAccountMenu.tsx src/components/layout/AccountMenuSections.tsx src/components/layout/AccountMenuSections.test.tsx`
Run: `pnpm --filter @oktavius/base-ui exec eslint src/components/segmented-toggle.tsx src/components/segmented-toggle.test.tsx`
Expected: clean (no errors). Fix any unused-import warnings surfaced by the refactor.

- [ ] **Step 3: Run the full test suites for both packages**

Run: `pnpm --filter @oktavius/base-ui test`
Run: `pnpm --filter @oktavius/web exec vitest run src/components/layout`
Expected: all green, including `segmented-toggle.test.tsx`, `AccountMenuSections.test.tsx`, `HeaderAccountMenu.orgSwitching.test.ts`.

- [ ] **Step 4: Typecheck the whole web app**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Design-system self-check (manual grep)**

Run: `grep -nE "bg-white|text-gray-|cta|#[0-9a-fA-F]{3,6}" apps/web/src/components/layout/AccountMenuSections.tsx packages/base-ui/src/components/segmented-toggle.tsx`
Expected: no matches (no raw palette, no `bg-white`, no purple `cta`, no hex colors). Pills/toggles use `bg-muted` / `bg-card` / `text-muted-foreground` only.

- [ ] **Step 6: Final commit (if Step 1 changed files)**

```bash
git add apps/web/src/components/layout/AccountMenuSections.tsx
git commit -m "chore(web): drop dead account submenu helpers"
```

---

## Self-Review Notes

- **Spec coverage:** Profile header (Task 4), neutral identity pills (Task 3), Preferences label (Task 4), Theme segmented toggle (Task 2), Language segmented toggle (Task 2), Organisation inline row multi/single/none (Task 3 + existing multi path + Task 4 wiring), Settings + Sign out unchanged (Task 4), `SegmentedToggle` reusable primitive (Task 1), a11y radiogroup + arrow keys (Task 1), trigger untouched (no task modifies the trigger). All covered.
- **Naming consistency:** New exports `ThemeMenuRow`, `LanguageMenuRow`, `IdentityPills` are referenced identically in Task 4's import. `SegmentedToggle` prop names (`value`, `options`, `onChange`, `ariaLabel`) match between Task 1 definition and Task 2 usage. Option fields (`value`, `label`, `icon`, `ariaLabel`) are consistent.
- **No placeholders:** every code step contains full code; every command has an expected result.
- **Purple-reserved rule:** verified by the Step 5 grep in Task 5.
