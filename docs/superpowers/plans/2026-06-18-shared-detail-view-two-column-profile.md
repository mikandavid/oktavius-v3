# Shared DetailView — Two-Column Record Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the shared `DetailView` from a single stacked field-grid card into a two-column record profile (main content column + identity/key-facts rail), derived from props modules already pass, so every detail page in the app improves with zero per-module work.

**Architecture:** Add a compact rail-optimized `RecordKeyFacts` renderer to base-ui, then rewrite the body of `apps/web/src/components/common/DetailView.tsx` to partition fields into a main `SectionCard` (sectioned default fields) and a rail `SectionCard` (identity + primary fields + meta), laid out as two sibling tiles in a grid. The mapping defaults from `importance`; an opt-in `placement` prop overrides it. When the rail would be empty, the main tile renders full-width — identical to today, so nothing regresses.

**Tech Stack:** React 18, TypeScript, Tailwind, `@oktavius/base-ui` primitives, Vitest + `@testing-library/react`, pnpm workspaces (`@oktavius/web`, `@oktavius/base-ui`).

## Global Constraints

- No nested cards. The two columns are **sibling** `SectionCard` tiles in a grid, never a card inside a card.
- All in-card values map to a `CARD_CONTENT_TIERS` typography tier — never ad-hoc font sizes.
- No `any`, `as any`, `@ts-ignore`, or `@ts-expect-error`.
- `DetailView`'s public props stay **backward-compatible** — existing callers must not need edits to keep compiling (the `visualLayout` prop stays in the type).
- `DetailView` is presentational; introduce no new user-facing strings (no i18n keys needed).
- Commit hygiene: branch `FE` has concurrent agent streams with unrelated uncommitted deletions in `docs/superpowers/`. **Stage only the exact files named in each commit step** — never `git add -A` / `git add .`.
- Verification commands run from repo root `oktavius-v3/`: `pnpm -r test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

---

### Task 1: `RecordKeyFacts` rail primitive (base-ui)

A compact, vertically-stacked label/value renderer sized for the ~20rem rail. The existing `RecordInfoHero` is a 3-column grid (wrong for a narrow rail), so we add a sibling primitive in the same file. It is exported automatically via the existing `export * from './components/detail-field'` barrel line.

**Files:**

- Modify: `packages/base-ui/src/components/detail-field.tsx` (add `RecordKeyFacts`, after `RecordInfoMeta`)
- Test: `packages/base-ui/src/components/detail-field.test.tsx` (create)

**Interfaces:**

- Consumes: `CARD_CONTENT_TIERS`, `DetailFieldProps`, `cn` (all already in `detail-field.tsx`).
- Produces: `export function RecordKeyFacts({ fields, className }: { fields: DetailFieldProps[]; className?: string }): JSX.Element | null` — renders nothing for an empty list; caps at 8 items; renders each field's optional `icon` before a `label` (label tier) over `value` (body tier).

- [ ] **Step 1: Write the failing test**

Create `packages/base-ui/src/components/detail-field.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RecordKeyFacts } from './detail-field';

afterEach(() => {
  cleanup();
});

describe('RecordKeyFacts', () => {
  it('renders each fact as a label over a value', () => {
    render(<RecordKeyFacts fields={[{ label: 'Email', value: 'a@b.co' }]} />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('a@b.co')).toBeTruthy();
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<RecordKeyFacts fields={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('caps at 8 items', () => {
    const fields = Array.from({ length: 12 }, (_, i) => ({
      label: `L${i}`,
      value: `V${i}`,
    }));
    render(<RecordKeyFacts fields={fields} />);
    expect(screen.queryByText('L7')).not.toBeNull();
    expect(screen.queryByText('L8')).toBeNull();
  });

  it('renders a leading icon when provided', () => {
    render(
      <RecordKeyFacts
        fields={[{ label: 'Phone', value: '+431', icon: <svg data-testid="icn" /> }]}
      />,
    );
    expect(screen.getByTestId('icn')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/base-ui test -- detail-field`
Expected: FAIL — `RecordKeyFacts` is not exported from `./detail-field`.

- [ ] **Step 3: Add the implementation**

In `packages/base-ui/src/components/detail-field.tsx`, add this function immediately after `RecordInfoMeta` (before `DetailFieldGrid`):

```tsx
/** Compact stacked label/value list for the detail rail. Max 8 items. */
export function RecordKeyFacts({
  fields,
  className,
}: {
  fields: DetailFieldProps[];
  className?: string;
}) {
  if (fields.length === 0) return null;

  const items = fields.slice(0, 8);

  return (
    <dl className={cn('space-y-3', className)}>
      {items.map((field, index) => (
        <div
          key={field.key ?? `${field.label}-${index}`}
          className="flex min-w-0 items-start gap-2.5"
        >
          {field.icon ? (
            <span className="mt-0.5 shrink-0 text-muted-foreground/70 [&_svg]:size-4">
              {field.icon}
            </span>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            <dt className={CARD_CONTENT_TIERS.label}>{field.label}</dt>
            <dd className={cn(CARD_CONTENT_TIERS.body, 'break-words')}>{field.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/base-ui test -- detail-field`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck the package**

Run: `pnpm --filter @oktavius/base-ui typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/base-ui/src/components/detail-field.tsx packages/base-ui/src/components/detail-field.test.tsx
git commit -m "feat(base-ui): add RecordKeyFacts rail primitive for detail profiles"
```

---

### Task 2: Two-column `DetailView` + `placement` override

Rewrite the body of the shared `DetailView`. Partition permission-filtered fields into rail vs main, render two sibling `SectionCard` tiles in a grid, and fall back to a single full-width card when the rail has no content.

**Files:**

- Modify: `apps/web/src/components/common/DetailView.tsx` (full body rewrite; props stay compatible)
- Test: `apps/web/src/components/common/DetailView.test.tsx` (add region/placement/degradation tests to the existing file)

**Interfaces:**

- Consumes: `RecordKeyFacts` (Task 1) from `@oktavius/base-ui`; existing `RecordIdentity`, `RecordInfoMeta`, `DetailFieldGrid`, `SectionCard`, `InlineEdit`, `type RecordVisualProps`, `type InlineEditProps`, `type DetailFieldProps as BaseDetailFieldProps`.
- Produces: `DetailView` (same export, same props) plus an extended `DetailFieldProps = BaseDetailFieldProps & { permission?: PermissionRequirement; inlineEdit?: Omit<InlineEditProps, 'className'>; placement?: 'main' | 'aside' }`. Two-column markup exposes `data-testid="detail-rail"` and `data-testid="detail-main"` on the grid item wrappers.

- [ ] **Step 1: Write the failing tests**

Add to the top of `apps/web/src/components/common/DetailView.test.tsx` (alongside the existing imports — keep the existing `renderToStaticMarkup` permission tests untouched):

```tsx
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

Then add this `describe` block at the end of the file:

```tsx
describe('DetailView two-column profile', () => {
  it('places primary fields in the rail and section fields in the main column', () => {
    render(
      <DetailView
        title="Acme"
        visual={{ kind: 'avatar', label: 'Acme' }}
        fields={[
          { label: 'Email', value: 'a@b.co', importance: 'primary' },
          { label: 'Street', value: 'Main 1', section: 'Address' },
        ]}
      />,
    );
    const rail = screen.getByTestId('detail-rail');
    const main = screen.getByTestId('detail-main');
    expect(within(rail).getByText('Email')).toBeTruthy();
    expect(within(rail).getByText('a@b.co')).toBeTruthy();
    expect(within(main).getByText('Street')).toBeTruthy();
    expect(within(main).getByText('Main 1')).toBeTruthy();
  });

  it('honors placement overrides over importance defaults', () => {
    render(
      <DetailView
        title="Acme"
        visual={{ kind: 'avatar', label: 'Acme' }}
        fields={[
          { label: 'Notes', value: 'Pulled aside', placement: 'aside' },
          { label: 'Email', value: 'pushed-main', importance: 'primary', placement: 'main' },
        ]}
      />,
    );
    expect(within(screen.getByTestId('detail-rail')).getByText('Pulled aside')).toBeTruthy();
    expect(within(screen.getByTestId('detail-main')).getByText('pushed-main')).toBeTruthy();
  });

  it('renders a single full-width column when there is no rail content', () => {
    render(
      <DetailView
        title="Acme"
        fields={[{ label: 'Street', value: 'Main 1', section: 'Address' }]}
      />,
    );
    expect(screen.queryByTestId('detail-rail')).toBeNull();
    expect(screen.getByText('Street')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @oktavius/web test -- DetailView`
Expected: FAIL — `detail-rail` / `detail-main` testids do not exist yet (the 3 new tests fail; the 4 existing permission tests still pass).

- [ ] **Step 3: Rewrite `DetailView.tsx`**

Replace the entire contents of `apps/web/src/components/common/DetailView.tsx` with:

```tsx
import {
  DetailFieldGrid,
  type DetailFieldProps as BaseDetailFieldProps,
  InlineEdit,
  type InlineEditProps,
  RecordIdentity,
  RecordInfoMeta,
  RecordKeyFacts,
  type RecordVisualProps,
  SectionCard,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type { PermissionRequirement } from '@/lib/permissions';
import { canUsePermissionRequirement, EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

export type DetailFieldProps = BaseDetailFieldProps & {
  /** Hide the field unless the active subject satisfies this requirement. */
  permission?: PermissionRequirement;
  /** Render this field value through the shared compact click-to-edit control. */
  inlineEdit?: Omit<InlineEditProps, 'className'>;
  /** Override which column this field lands in. Defaults: primary/meta → aside, default → main. */
  placement?: 'main' | 'aside';
};

/** Retained for backward compatibility; the visual now always anchors the rail. */
export type DetailViewVisualLayout = 'identity' | 'header';

function placementOf(field: DetailFieldProps): 'main' | 'aside' {
  if (field.placement) return field.placement;
  if (field.importance === 'primary' || field.importance === 'meta') return 'aside';
  return 'main';
}

export function DetailView({
  title,
  fields,
  subtitle,
  visual,
  identityTitle,
  identitySubtitle,
  identityMeta,
  identityTrailing,
}: {
  title: string;
  fields: DetailFieldProps[];
  subtitle?: ReactNode;
  /** Logo, avatar, or module icon — anchors the rail identity */
  visual?: RecordVisualProps;
  /** Retained for compatibility; no longer changes layout. */
  visualLayout?: DetailViewVisualLayout;
  /** When `visual` is set, overrides `title` for the rail identity line */
  identityTitle?: ReactNode;
  identitySubtitle?: ReactNode;
  identityMeta?: ReactNode;
  identityTrailing?: ReactNode;
}) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );
  const permittedFields = useMemo(
    () =>
      fields.filter((field) => canUsePermissionRequirement(permissionSubject, field.permission)),
    [fields, permissionSubject],
  );
  const displayFields = useMemo(
    () =>
      permittedFields.map((field) =>
        field.inlineEdit
          ? {
              ...field,
              value: <InlineEdit {...field.inlineEdit} />,
            }
          : field,
      ),
    [permittedFields],
  );

  const asideFields = displayFields.filter((field) => placementOf(field) === 'aside');
  const mainFields = displayFields.filter((field) => placementOf(field) === 'main');
  const keyFacts = asideFields.filter((field) => field.importance !== 'meta');
  const railMeta = asideFields.filter((field) => field.importance === 'meta');

  const groupedMain = mainFields.reduce(
    (sections, field) => {
      const key = field.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(field);
      return sections;
    },
    {} as Record<string, DetailFieldProps[]>,
  );

  const hasIdentity = Boolean(visual);
  const hasRail = hasIdentity || keyFacts.length > 0 || railMeta.length > 0;
  const hasMain = Object.keys(groupedMain).length > 0;

  const mainContent = (
    <div className="space-y-4">
      {Object.entries(groupedMain).map(([section, sectionFields], index) => (
        <section
          key={section}
          className={index === 0 ? 'space-y-3' : 'space-y-3 border-t border-border/70 pt-4'}
        >
          {section !== 'General' ? (
            <h3 className="text-xs font-semibold text-muted-foreground">{section}</h3>
          ) : null}
          <DetailFieldGrid fields={sectionFields} />
        </section>
      ))}
    </div>
  );

  const railContent = (
    <div className="space-y-4">
      {hasIdentity ? (
        <RecordIdentity
          visual={visual!}
          title={identityTitle ?? title}
          subtitle={identitySubtitle ?? subtitle}
          meta={identityMeta}
          trailing={identityTrailing}
        />
      ) : null}
      {keyFacts.length > 0 ? (
        <RecordKeyFacts
          fields={keyFacts}
          className={hasIdentity ? 'border-t border-border/50 pt-4' : undefined}
        />
      ) : null}
      {railMeta.length > 0 ? <RecordInfoMeta fields={railMeta} /> : null}
    </div>
  );

  // No rail content → single full-width card (unchanged from the prior layout).
  if (!hasRail) {
    return (
      <SectionCard title={title} meta={subtitle}>
        {mainContent}
      </SectionCard>
    );
  }

  // Rail content but no main sections → rail alone, full width.
  if (!hasMain) {
    return <SectionCard>{railContent}</SectionCard>;
  }

  // Two-column profile. Rail is first in DOM (mobile-top) and placed right on lg.
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div data-testid="detail-rail" className="lg:order-2">
        <SectionCard>{railContent}</SectionCard>
      </div>
      <div data-testid="detail-main" className="lg:order-1">
        <SectionCard>{mainContent}</SectionCard>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @oktavius/web test -- DetailView`
Expected: PASS — all 7 tests (4 existing permission tests + 3 new).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: no errors. (Existing callers passing `visualLayout` still compile — it remains in the prop type.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/common/DetailView.tsx apps/web/src/components/common/DetailView.test.tsx
git commit -m "feat(detail): two-column record profile DetailView with placement override"
```

---

### Task 3: Update showcase demo + verify full blast radius

Contacts inherits the new layout with no code change. The showcase `DetailView` demo currently advertises the old primitives and uses `visualLayout="header"`; update its label and add a degradation example. Then verify all four call sites compile, lint, test, and build, and browser-verify the visual result.

**Files:**

- Modify: `apps/web/src/modules/showcase/sections/DetailLayoutSection.tsx` (lines 77–108 region — the `DetailView` `ShowcaseBlock`)

**Interfaces:**

- Consumes: `DetailView` (Task 2). No new exports.

- [ ] **Step 1: Update the showcase DetailView block**

In `apps/web/src/modules/showcase/sections/DetailLayoutSection.tsx`, replace the `ShowcaseBlock` that wraps the `DetailView` (currently `meta="RecordInfoHero · DetailFieldGrid · RecordVisual"`, lines ~77–108) with:

```tsx
<ShowcaseBlock
  title="DetailView"
  meta="Two-column profile · RecordIdentity · RecordKeyFacts · DetailFieldGrid"
>
  <DetailView
    title="Client profile"
    visual={{ kind: 'icon', icon: <ProjectsIcon size={16} weight="duotone" /> }}
    identityTitle="Apex Technologies GmbH"
    identityTrailing={
      <StatusBadge status="active" label="Active" variantMap={{ active: 'success' }} />
    }
    fields={[
      { label: 'Company', value: inlineValue, importance: 'primary' },
      { label: 'Industry', value: 'Technology', section: 'Profile' },
      { label: 'Account manager', value: 'Anna Hofer', section: 'Profile' },
      {
        label: 'Status',
        value: <StatusBadge status="active" label="Active" variantMap={{ active: 'success' }} />,
        section: 'Commercial',
      },
      { label: 'Created', value: '10.01.2024', section: 'Meta', importance: 'meta' },
    ]}
  />
  <div className="mt-4">
    <p className="mb-2 text-xs font-medium text-muted-foreground">
      Single-column fallback — no identity / primary / meta
    </p>
    <DetailView
      title="Notes"
      fields={[
        { label: 'Summary', value: 'Renewal due Q3.', section: 'Notes' },
        { label: 'Owner', value: 'Anna Hofer', section: 'Notes' },
      ]}
    />
  </div>
  <div className="mt-4 border-t border-border/50 pt-4">
    <p className="mb-2 text-xs font-medium text-muted-foreground">InlineEdit — click to edit</p>
    <InlineEdit
      value={inlineValue}
      onSave={async (next) => {
        setInlineValue(next);
        appToast.success('Saved.');
      }}
    />
  </div>
</ShowcaseBlock>
```

(`RecordVisual` is still imported and used elsewhere in this file — the ResponsiveDetailLayout block — so leave its import alone.)

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: no errors.

- [ ] **Step 3: Full test suite (regression check across the blast radius)**

Run: `pnpm -r test`
Expected: PASS — including `DetailView`, `detail-field`, and the existing contacts tests (`ContactsListView`, `ContactFormView`). `EntityDetailWorkspaceTabs` and `DetailLayoutSection` have no dedicated tests but must not break any that import them.

- [ ] **Step 4: Lint**

Run: `pnpm lint`
Expected: no errors (watch for unused imports in `DetailView.tsx` — `RecordInfoHero` and `RecordVisual` must NOT be imported there anymore).

- [ ] **Step 5: Build + bundle budget**

Run: `pnpm build`
Expected: build succeeds, bundle budget passes.

- [ ] **Step 6: Browser-verify the three live surfaces**

Start the app (`pnpm dev`) and confirm visually:

- `/contacts?id=<a contact id>` — avatar + name + type badge and email/phone/mobile sit in the right rail; General/Address/Web/Classification/Notes render in the main column; on a narrow viewport the rail stacks on top.
- `/showcase` → DetailView block — the two-column profile renders, and the "Single-column fallback" example below it renders as one full-width card.
- Any page using `EntityDetailWorkspaceTabs` (a tabbed entity detail) — confirm the embedded `DetailView` renders correctly inside the tab. NOTE: this component previously relied on `visualLayout="header"` to show a compact icon beside the title; the visual now anchors the rail instead. Confirm this reads acceptably; if not, capture it as a follow-up (do not block this task).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/modules/showcase/sections/DetailLayoutSection.tsx
git commit -m "docs(showcase): demo two-column DetailView profile and single-column fallback"
```

---

## Self-Review

**Spec coverage:**

- Two-column main+rail layout → Task 2 (grid with two sibling `SectionCard` tiles).
- Zero per-module work / derived mapping → Task 2 (`placementOf` defaults from `importance`); Contacts unchanged (verified Task 3 Step 6).
- `placement` escape hatch → Task 2 (extended `DetailFieldProps`, override test).
- Graceful degradation to single column → Task 2 (`!hasRail` branch, degradation test).
- `RecordKeyFacts` rail primitive → Task 1.
- Responsive rail-on-top → Task 2 (DOM-order + `lg:order`); browser-verified Task 3 Step 6.
- Actions stay in `ModulePage` header → unchanged (no action UI added to `DetailView`).
- Blast-radius verification (contacts, EntityDetailWorkspaceTabs, showcase) → Task 3 Steps 3–6.
- No new i18n strings → `DetailView` is presentational; confirmed.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command shows expected output. The EntityDetailWorkspaceTabs follow-up note is an explicit, bounded verification instruction, not a deferred implementation.

**Type consistency:** `RecordKeyFacts({ fields, className })` defined in Task 1 is consumed with exactly those props in Task 2. Extended `DetailFieldProps` adds `placement?: 'main' | 'aside'`, used by `placementOf` and the override test with matching literals. `data-testid="detail-rail"`/`"detail-main"` produced in Task 2 are queried with the same strings in the Task 2 tests. `RecordInfoHero`/`RecordVisual` are intentionally dropped from `DetailView` imports (lint check, Task 3 Step 4).
