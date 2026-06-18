# AI Agent Module (`agent-admin`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated top-level "AI Agent" module that consolidates all agent administration (settings, integrations, automations, heartbeat & queue), fully wired to the osiris backend, and fold the existing `/settings?section=ai` content into it.

**Architecture:** A new nav module at `/agent` reusing the existing `SettingsPageFactory` left-rail section pattern with `?section=` deep-linking and per-section permission gating. Data is fetched through new osiris client factories under `runtime/osiris/` (mirroring `storageClient.ts`) plus per-section react-query hook files under `modules/agent-admin/data/`. UI is ported faithfully from osiris, adapted to v3 conventions.

**Tech Stack:** React + TypeScript, `@tanstack/react-query`, `react-router-dom`, `@oktavius/base-ui`, `@oktavius/i18n`, Vitest + Testing Library, nuqs.

## Global Constraints

- **Design system** (`docs/ui-rules`): `Combobox` never `Select`; `appToast` (`.success`/`.fromApiError`) for all feedback; base-ui `SettingsSection`/`SettingsRow`/`Switch`/`Input`/`Textarea`; icons only from `@/lib/icons`; borderless white tiles on tinted wash; brand purple reserved (no purple buttons except a single page entry-point).
- **No native dialogs**: never `window.confirm`/`alert`/`prompt`. Destructive actions (disconnect, delete automation, kill heartbeat) use `ConfirmActionDialog`/`ConfirmPopover` from base-ui.
- **Data layer**: new clients follow the `storageClient.ts` template — `fetch` via `joinOsirisApiBaseUrl(options.baseUrl, path)`, `credentials: 'include'`, JSON body, `readErrorMessage(response, fallback)` on non-OK responses. Normalize snake_case OR camelCase keys (`v.foo_bar ?? v.fooBar`) using helpers from `@/runtime/osiris/osirisClientUtils`.
- **Org scoping**: hooks read `useOptionalOsirisRuntime()?.activeOrgId ?? null` and include it in every query key.
- **Mutations**: `onSuccess` invalidates the relevant query key; `onError: (error) => appToast.fromApiError(error, '<fallback>')`.
- **Permissions**: section gating via `canUsePermissionRequirement(permissionSubject, section.permission)`. New keys (`agent-admin.view`, `scheduler.view`, `scheduler.manage_own`, `scheduler.manage_org`) resolve `true` for superadmins automatically, so absent bootstrap keys degrade to superadmin-only (acceptable shipped behavior).
- **i18n**: new namespace `agent_admin` (snake_case file `agent_admin.json` in `packages/i18n/locales/{en,de}/`); reuse existing `scheduler` and `ai_usage` namespaces where they already have keys. After adding/renaming namespace files run `pnpm --filter @oktavius/i18n generate:namespaces`. Components call `usePreloadNamespaces([...])` and gate render on `ready`.
- **Commits**: branch is `FE` with concurrent agent streams — stage ONLY this module's files (`git add <explicit paths>`), commit fast, never `git add -A`.
- **Verification**: each task runs `pnpm --filter @oktavius/web test -- <testfile>` (Vitest) and must show the expected pass/fail before committing. Typecheck with `pnpm --filter @oktavius/web typecheck` at the end of each phase.

---

## File Structure

**New module** (`apps/web/src/modules/agent-admin/`):

- `AgentAdminPage.tsx` — page shell, section list, `?section=` deep-link, namespace preload.
- `agentSectionParam.ts` — `AGENT_SECTION_PARAM`, `resolveInitialAgentSection`.
- `sections/AgentSettingsSection.tsx` — relocated AI settings (usage + instructions).
- `sections/AgentIntegrationsSection.tsx` — integrations panel wrapper.
- `sections/AgentAutomationsSection.tsx` — automations list/detail/form router.
- `sections/AgentHeartbeatSection.tsx` — heartbeat control + activations queue.
- `data/agentAdminKeys.ts` — query-key factory.
- `data/useAgentIntegrations.ts`, `data/useScheduler.ts`, `data/useAgentActivations.ts` — react-query hooks.
- `components/...` — ported integration/automation/queue UI components.

**New runtime clients** (`apps/web/src/runtime/osiris/`):

- `agentIntegrationsClient.ts`, `schedulerClient.ts`, `agentActivationsClient.ts`.

**Shared hook** (`apps/web/src/components/settings/`):

- `useWorkspaceSettingsForm.ts` — extracted workspace-settings load + debounced autosave (consumed by both the new module and `SettingsPage`).

**Modified:**

- `apps/web/src/lib/appNavModules.ts` — add module entry.
- `apps/web/src/lib/org-profiles/types.ts` — add `'agent-admin'` to `OrgModuleId`.
- `apps/web/src/lib/org-profiles/profiles.ts` — add `'agent-admin'` to `DEFAULT_ORG_MODULES`.
- `apps/web/src/modules/settings/SettingsPage.tsx` — drop `ai` section, add redirect, consume shared hook.
- `packages/i18n/locales/{en,de}/agent_admin.json`, `navigation.json` — new keys.

---

# PHASE 1 — Module shell + Settings section

Deliverable: `/agent` exists, shows a left-rail with a working **Settings** section (relocated AI settings) wired to real workspace settings, `/settings?section=ai` redirects to it, and the old `ai` section is gone. Independently shippable.

### Task 1.1: Add `agent-admin` to module id types and default profile

**Files:**

- Modify: `apps/web/src/lib/org-profiles/types.ts:4-14`
- Modify: `apps/web/src/lib/org-profiles/profiles.ts:4-14`
- Test: `apps/web/src/lib/org-profiles/agentAdminModule.test.ts`

**Interfaces:**

- Produces: `OrgModuleId` now includes `'agent-admin'`; `DEFAULT_ORG_MODULES` contains `'agent-admin'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/org-profiles/agentAdminModule.test.ts
import { describe, expect, it } from 'vitest';

import { createDefaultOrgProfile } from './profiles';

describe('agent-admin module enablement', () => {
  it('enables agent-admin in the default org profile', () => {
    const profile = createDefaultOrgProfile('workspace');
    expect(profile.enabledModules).toContain('agent-admin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- agentAdminModule`
Expected: FAIL — `expected [ ... ] to contain 'agent-admin'`.

- [ ] **Step 3: Add the id to the union type**

In `apps/web/src/lib/org-profiles/types.ts`, add `'agent-admin'` to `OrgModuleId`:

```ts
export type OrgModuleId =
  | 'dashboard'
  | 'ai-chat'
  | 'agent-admin'
  | 'email'
  | 'calendar'
  | 'contacts'
  | 'storage'
  | 'settings'
  | 'showcase'
  | 'support'
  | 'changelog';
```

- [ ] **Step 4: Add to default modules**

In `apps/web/src/lib/org-profiles/profiles.ts`, add `'agent-admin'` to `DEFAULT_ORG_MODULES` (after `'ai-chat'`):

```ts
const DEFAULT_ORG_MODULES: OrgModuleId[] = [
  'dashboard',
  'contacts',
  'ai-chat',
  'agent-admin',
  'email',
  'calendar',
  'storage',
  'settings',
  'support',
  'changelog',
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- agentAdminModule`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/org-profiles/types.ts apps/web/src/lib/org-profiles/profiles.ts apps/web/src/lib/org-profiles/agentAdminModule.test.ts
git commit -m "feat(agent-admin): register module id in org profile types"
```

---

### Task 1.2: i18n — navigation label + agent_admin namespace

**Files:**

- Modify: `packages/i18n/locales/en/navigation.json`
- Modify: `packages/i18n/locales/de/navigation.json`
- Create: `packages/i18n/locales/en/agent_admin.json`
- Create: `packages/i18n/locales/de/agent_admin.json`
- Modify (generated): `packages/i18n/src/generated-namespaces.ts`

**Interfaces:**

- Produces: namespace `'agent_admin'` in `TranslationNamespace`; `navigation.agentAdmin` key.

- [ ] **Step 1: Add the nav label**

Add to `packages/i18n/locales/en/navigation.json`:

```json
  "agentAdmin": "AI Agent",
```

Add to `packages/i18n/locales/de/navigation.json`:

```json
  "agentAdmin": "KI-Agent",
```

- [ ] **Step 2: Create the en namespace file**

Create `packages/i18n/locales/en/agent_admin.json`:

```json
{
  "title": "AI Agent",
  "subtitle": "Settings, integrations, automations, and runtime for your AI agent",
  "sectionSettings": "Settings",
  "sectionIntegrations": "Integrations",
  "sectionAutomations": "Automations",
  "sectionHeartbeat": "Heartbeat & Queue",
  "groupConfiguration": "Configuration",
  "groupOperations": "Operations"
}
```

- [ ] **Step 3: Create the de namespace file**

Create `packages/i18n/locales/de/agent_admin.json`:

```json
{
  "title": "KI-Agent",
  "subtitle": "Einstellungen, Integrationen, Automatisierungen und Laufzeit für Ihren KI-Agenten",
  "sectionSettings": "Einstellungen",
  "sectionIntegrations": "Integrationen",
  "sectionAutomations": "Automatisierungen",
  "sectionHeartbeat": "Heartbeat & Warteschlange",
  "groupConfiguration": "Konfiguration",
  "groupOperations": "Betrieb"
}
```

- [ ] **Step 4: Regenerate the namespace union**

Run: `pnpm --filter @oktavius/i18n generate:namespaces`
Expected: `packages/i18n/src/generated-namespaces.ts` now lists `'agent_admin'` in `TranslationNamespace`.

- [ ] **Step 5: Validate translations**

Run: `pnpm --filter @oktavius/i18n validate`
Expected: PASS (en/de key parity for `agent_admin`).

- [ ] **Step 6: Commit**

```bash
git add packages/i18n/locales/en/navigation.json packages/i18n/locales/de/navigation.json packages/i18n/locales/en/agent_admin.json packages/i18n/locales/de/agent_admin.json packages/i18n/src/generated-namespaces.ts
git commit -m "feat(agent-admin): add agent_admin i18n namespace and nav label"
```

---

### Task 1.3: Extract `useWorkspaceSettingsForm` hook

Both `SettingsPage` and the new module's Settings section need workspace-settings load + debounced autosave. Extract it once (DRY).

**Files:**

- Create: `apps/web/src/components/settings/useWorkspaceSettingsForm.ts`
- Test: `apps/web/src/components/settings/useWorkspaceSettingsForm.test.tsx`

**Interfaces:**

- Produces:

  ```ts
  export type WorkspaceSettingsForm = {
    settings: OsirisWorkspaceSettings;
    onChange: (next: OsirisWorkspaceSettings) => void;
    saving: boolean;
    savedAt: number | null;
  };
  export function useWorkspaceSettingsForm(): WorkspaceSettingsForm;
  ```

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/components/settings/useWorkspaceSettingsForm.test.tsx
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWorkspaceSettingsForm } from './useWorkspaceSettingsForm';

describe('useWorkspaceSettingsForm', () => {
  it('exposes settings and marks dirty on change', () => {
    const { result } = renderHook(() => useWorkspaceSettingsForm());
    expect(result.current.settings.aiUsage).toBeDefined();
    expect(result.current.saving).toBe(false);
    act(() => {
      result.current.onChange({
        ...result.current.settings,
        aiUsage: { ...result.current.settings.aiUsage, hardLimitPercent: 90 },
      });
    });
    expect(result.current.settings.aiUsage.hardLimitPercent).toBe(90);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- useWorkspaceSettingsForm`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Move the workspace-settings state/load/save logic currently inline in `SettingsPage.tsx` (the `workspaceSettings`/`saveWorkspaceSettings`/`handleWorkspaceSettingsChange`/`useDebouncedAutosave` block around lines 258-304, plus the load effect ending around line 232) into this hook. Code:

```ts
// apps/web/src/components/settings/useWorkspaceSettingsForm.ts
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDebouncedAutosave } from '@/lib/hooks/useDebouncedAutosave';
import { appToast } from '@/lib/toast';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';
import {
  createDefaultOsirisWorkspaceSettings,
  type OsirisWorkspaceSettings,
} from '@/runtime/osiris/workspaceSettingsClient';

export type WorkspaceSettingsForm = {
  settings: OsirisWorkspaceSettings;
  onChange: (next: OsirisWorkspaceSettings) => void;
  saving: boolean;
  savedAt: number | null;
};

export function useWorkspaceSettingsForm(): WorkspaceSettingsForm {
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const [settings, setSettings] = useState<OsirisWorkspaceSettings>(() =>
    createDefaultOsirisWorkspaceSettings(),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!activeOrgId || !osirisRuntime?.loadWorkspaceSettings) return;
    void osirisRuntime
      .loadWorkspaceSettings(activeOrgId)
      .then((loaded) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch((error: unknown) => {
        appToast.fromApiError(error, 'Workspace settings could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [activeOrgId, osirisRuntime]);

  const onChange = useCallback((next: OsirisWorkspaceSettings) => {
    if (!hasEditedRef.current) {
      hasEditedRef.current = true;
      setHasEdited(true);
    }
    setSettings(next);
  }, []);

  const save = useCallback(
    async (toSave: OsirisWorkspaceSettings) => {
      if (!activeOrgId || !osirisRuntime?.updateWorkspaceSettings) return;
      setSaving(true);
      try {
        await osirisRuntime.updateWorkspaceSettings(toSave, activeOrgId);
        setSavedAt(Date.now());
      } catch (error) {
        appToast.fromApiError(error, 'Workspace settings could not be saved.');
      } finally {
        setSaving(false);
      }
    },
    [activeOrgId, osirisRuntime],
  );

  useDebouncedAutosave(settings, {
    onSave: save,
    enabled: hasEdited && Boolean(activeOrgId),
    delayMs: 1000,
  });

  return { settings, onChange, saving, savedAt };
}
```

> Note: confirm the runtime method names (`loadWorkspaceSettings`/`updateWorkspaceSettings`) match `useOsirisRuntime`'s exposed actions — they are the same ones `SettingsPage` already calls. If `SettingsPage` loads via a different path, mirror that exact call here.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- useWorkspaceSettingsForm`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/settings/useWorkspaceSettingsForm.ts apps/web/src/components/settings/useWorkspaceSettingsForm.test.tsx
git commit -m "refactor(settings): extract useWorkspaceSettingsForm hook"
```

---

### Task 1.4: Section param helper

**Files:**

- Create: `apps/web/src/modules/agent-admin/agentSectionParam.ts`
- Test: `apps/web/src/modules/agent-admin/agentSectionParam.test.ts`

**Interfaces:**

- Produces: `AGENT_SECTION_PARAM = 'section'`; `resolveInitialAgentSection(raw: string | null): string` (default `'settings'`).

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/modules/agent-admin/agentSectionParam.test.ts
import { describe, expect, it } from 'vitest';

import { resolveInitialAgentSection } from './agentSectionParam';

describe('resolveInitialAgentSection', () => {
  it('defaults to settings', () => {
    expect(resolveInitialAgentSection(null)).toBe('settings');
    expect(resolveInitialAgentSection('  ')).toBe('settings');
  });
  it('passes through a provided section', () => {
    expect(resolveInitialAgentSection('automations')).toBe('automations');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- agentSectionParam`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// apps/web/src/modules/agent-admin/agentSectionParam.ts
/** Query-string key used to deep-link a specific agent section (e.g. `/agent?section=automations`). */
export const AGENT_SECTION_PARAM = 'section';

const DEFAULT_AGENT_SECTION = 'settings';

export function resolveInitialAgentSection(rawSection: string | null): string {
  const trimmed = rawSection?.trim();
  return trimmed ? trimmed : DEFAULT_AGENT_SECTION;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- agentSectionParam`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/agentSectionParam.ts apps/web/src/modules/agent-admin/agentSectionParam.test.ts
git commit -m "feat(agent-admin): add section param helper"
```

---

### Task 1.5: Relocate AI settings into the module's Settings section

**Files:**

- Create: `apps/web/src/modules/agent-admin/sections/AgentSettingsSection.tsx`
- Test: `apps/web/src/modules/agent-admin/sections/AgentSettingsSection.test.tsx`

**Interfaces:**

- Consumes: `AiSettingsSection` (existing, unchanged), `useWorkspaceSettingsForm` (Task 1.3).
- Produces: `export function AgentSettingsSection(): JSX.Element` — no props (self-wires workspace settings).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentSettingsSection.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AgentSettingsSection } from './AgentSettingsSection';

describe('AgentSettingsSection', () => {
  it('renders the AI usage budget heading', () => {
    render(<AgentSettingsSection />);
    expect(screen.getByText(/AI Usage Budget/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AgentSettingsSection`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the wrapper**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentSettingsSection.tsx
import { AiSettingsSection } from '@/components/settings/AiSettingsSection';
import { useWorkspaceSettingsForm } from '@/components/settings/useWorkspaceSettingsForm';

export function AgentSettingsSection() {
  const { settings, onChange, saving, savedAt } = useWorkspaceSettingsForm();
  return (
    <AiSettingsSection settings={settings} saving={saving} savedAt={savedAt} onChange={onChange} />
  );
}
```

> `AiSettingsSection` stays where it is (`@/components/settings/AiSettingsSection`); we only stop rendering it from `SettingsPage` (Task 1.7). If the test environment lacks an i18n provider, wrap with the project's standard test render helper (see existing `*.test.tsx` under `components/settings/` for the wrapper, e.g. `renderWithProviders`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AgentSettingsSection`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/sections/AgentSettingsSection.tsx apps/web/src/modules/agent-admin/sections/AgentSettingsSection.test.tsx
git commit -m "feat(agent-admin): relocate AI settings into module Settings section"
```

---

### Task 1.6: Module page shell + nav registration

**Files:**

- Create: `apps/web/src/modules/agent-admin/AgentAdminPage.tsx`
- Modify: `apps/web/src/lib/appNavModules.ts:55-166` (add entry), `:4-15` (icon import)
- Test: `apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx`

**Interfaces:**

- Consumes: `SettingsPageFactory`, `SettingsSectionConfig`, `AgentSettingsSection`, `resolveInitialAgentSection`, `AGENT_SECTION_PARAM`.
- Produces: `export function AgentAdminPage(): JSX.Element`; nav module id `'agent-admin'` at `/agent`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AgentAdminPage } from './AgentAdminPage';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AgentAdminPage />
    </MemoryRouter>,
  );
}

describe('AgentAdminPage', () => {
  it('renders the Settings section by default', () => {
    renderAt('/agent');
    expect(screen.getByText(/AI Usage Budget/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AgentAdminPage`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the page shell**

```tsx
// apps/web/src/modules/agent-admin/AgentAdminPage.tsx
import { useSearchParams } from 'react-router-dom';

import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { ModulePage } from '@/components/common/PageLayout';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { useTranslation } from '@/core/i18n';
import { BrainIcon, RobotIcon } from '@/lib/icons';
import { AgentSettingsSection } from './sections/AgentSettingsSection';
import { AGENT_SECTION_PARAM, resolveInitialAgentSection } from './agentSectionParam';

export function AgentAdminPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = resolveInitialAgentSection(searchParams.get(AGENT_SECTION_PARAM));

  const setActiveSection = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(AGENT_SECTION_PARAM, key);
    setSearchParams(next, { replace: true });
  };

  const sections: SettingsSectionConfig[] = [
    {
      id: 'settings',
      group: t('agent_admin.groupConfiguration', undefined, 'Configuration'),
      label: t('agent_admin.sectionSettings', undefined, 'Settings'),
      icon: <BrainIcon size={16} weight="duotone" />,
      title: t('agent_admin.sectionSettings', undefined, 'Settings'),
      sectionDescription: 'Usage guardrails and org-wide instructions for AI-assisted work.',
      permission: 'org.manage',
      render: () => <AgentSettingsSection />,
    },
    // Integrations (Phase 2), Automations (Phase 3), Heartbeat & Queue (Phase 4)
    // are appended here in their respective phases.
  ];

  return (
    <ModulePage
      title={t('agent_admin.title', undefined, 'AI Agent')}
      subtitle={t('agent_admin.subtitle', undefined, 'Configuration and runtime for your AI agent')}
      icon={<RobotIcon size={20} weight="duotone" />}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <SettingsPageFactory
        sections={sections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
        groupOrder={[
          t('agent_admin.groupConfiguration', undefined, 'Configuration'),
          t('agent_admin.groupOperations', undefined, 'Operations'),
        ]}
      />
    </ModulePage>
  );
}
```

> If `RobotIcon` is not exported from `@/lib/icons`, pick the closest existing agent/bot icon (`BotIcon` is used by AI Chat) or add a `RobotIcon` alias in `@/lib/icons` following the existing Phosphor export pattern. Verify with `grep -n "RobotIcon\|BotIcon" apps/web/src/lib/icons*`.

- [ ] **Step 4: Register the nav module**

In `apps/web/src/lib/appNavModules.ts` add `RobotIcon` (or chosen icon) to the icon import block (lines 4-15), then add this entry to `APP_NAV_MODULES` (after the `ai-chat` entry, ~line 77):

```ts
  {
    id: 'agent-admin',
    path: '/agent',
    label: 'AI Agent',
    labelKey: 'navigation.agentAdmin',
    icon: RobotIcon,
    section: 'admin',
    permission: 'agent-admin.view',
    loadPage: () => import('@/modules/agent-admin/AgentAdminPage'),
    pageExport: 'AgentAdminPage',
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AgentAdminPage`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/agent-admin/AgentAdminPage.tsx apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx apps/web/src/lib/appNavModules.ts
git commit -m "feat(agent-admin): module page shell and nav registration"
```

---

### Task 1.7: Remove `ai` section from SettingsPage + redirect

**Files:**

- Modify: `apps/web/src/modules/settings/SettingsPage.tsx` (remove `ai` section block lines 476-492; add redirect; optionally consume `useWorkspaceSettingsForm`)
- Test: `apps/web/src/modules/settings/settingsAiRedirect.test.tsx`

**Interfaces:**

- Consumes: `resolveInitialSettingsSection`, `SETTINGS_SECTION_PARAM`.
- Produces: visiting `/settings?section=ai` renders a redirect to `/agent?section=settings`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/settings/settingsAiRedirect.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SettingsPage } from './SettingsPage';

describe('settings ai redirect', () => {
  it('redirects /settings?section=ai to the agent module', () => {
    render(
      <MemoryRouter initialEntries={['/settings?section=ai']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/agent" element={<div>Agent Module Loaded</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Agent Module Loaded')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- settingsAiRedirect`
Expected: FAIL — the AI settings section renders instead of redirecting.

- [ ] **Step 3: Add the redirect and remove the section**

Near the top of `SettingsPage`'s render (after `activeSection` is resolved), add:

```tsx
import { Navigate } from 'react-router-dom';
// ...
if (activeSection === 'ai') {
  return <Navigate to="/agent?section=settings" replace />;
}
```

Delete the entire `ai` section object from `settingsSections` (lines 476-492) and remove the now-unused `AiSettingsSection` import (line 13). Leave `BrainIcon` import if still used elsewhere; otherwise remove it.

> Optional cleanup (recommended, DRY): replace SettingsPage's inline `workspaceSettings`/`saveWorkspaceSettings`/`handleWorkspaceSettingsChange` block with `const { settings: workspaceSettings, onChange: handleWorkspaceSettingsChange, saving: isSavingWorkspaceSettings, savedAt: workspaceSettingsSavedAt } = useWorkspaceSettingsForm();`. Only do this if the variable names map cleanly; otherwise leave SettingsPage's logic intact (the extraction in Task 1.3 still serves the new module).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- settingsAiRedirect`
Expected: PASS.

- [ ] **Step 5: Typecheck + full settings tests**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web test -- settings`
Expected: PASS (no dangling references to the removed `ai` section).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/settings/SettingsPage.tsx apps/web/src/modules/settings/settingsAiRedirect.test.tsx
git commit -m "feat(agent-admin): redirect /settings?section=ai to agent module"
```

---

# PHASE 2 — Integrations section

Deliverable: `/agent?section=integrations` lists Pipedream connections + native integrations, with add/manage/health/reconnect/disconnect, wired to `/agent-integrations/*`.

### Task 2.1: `agentIntegrationsClient` + types

**Files:**

- Create: `apps/web/src/runtime/osiris/agentIntegrationsClient.ts`
- Test: `apps/web/src/runtime/osiris/agentIntegrationsClient.test.ts`

**Interfaces:**

- Produces: `createOsirisAgentIntegrationsClient({ baseUrl }?)` returning methods listed below, and all exported types (`AgentIntegrationKey`, `AgentIntegrationSummary`, `IntegrationConnection`, `IntegrationGrant`, `PipedreamApp`, `CreateConnectionInput`, `ConnectAgentIntegrationInput`, status unions).

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/runtime/osiris/agentIntegrationsClient.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisAgentIntegrationsClient } from './agentIntegrationsClient';

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })) as unknown as typeof fetch,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('agentIntegrationsClient', () => {
  it('lists connections from GET /agent-integrations/connections', async () => {
    mockFetchOnce({ connections: [{ id: 'c1', provider: 'pipedream', appKey: 'slack' }] });
    const client = createOsirisAgentIntegrationsClient({ baseUrl: '/v1' });
    const result = await client.listConnections();
    expect(result.connections[0]?.id).toBe('c1');
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      '/agent-integrations/connections',
    );
  });

  it('throws a readable error on non-ok', async () => {
    mockFetchOnce({ message: 'nope' }, false, 500);
    const client = createOsirisAgentIntegrationsClient({ baseUrl: '/v1' });
    await expect(client.listConnections()).rejects.toThrow(/nope|connections/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- agentIntegrationsClient`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

Use the shared helper pattern (identical to `storageClient.ts`'s `getJson`/`send`). Define types from the extracted osiris signatures, then methods that map 1:1 to endpoints:

```ts
// apps/web/src/runtime/osiris/agentIntegrationsClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import { readErrorMessage } from './osirisClientUtils';

export type AgentIntegrationKey = 'onoffice' | 'halo';
export type AgentIntegrationPermissionMode = 'read' | 'full';
export type AgentIntegrationConnectionStatus = 'not_connected' | 'connected' | 'error';

export interface AgentIntegrationSummary {
  key: AgentIntegrationKey;
  name: string;
  description: string;
  provider: string;
  docsUrl: string | null;
  capabilities: Record<string, unknown>;
  enabled: boolean;
  connectionStatus: AgentIntegrationConnectionStatus;
  permissionMode: AgentIntegrationPermissionMode;
  hasCredentials: boolean;
  baseUrl: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  updatedAt: string | null;
}

export interface ConnectAgentIntegrationInput {
  apiToken?: string;
  apiSecret?: string;
  permissionMode?: AgentIntegrationPermissionMode;
  baseUrl?: string | null;
  authorizationServer?: string;
  tenant?: string | null;
}

export type IntegrationConnectionStatus =
  | 'connecting'
  | 'syncing'
  | 'connected'
  | 'unhealthy'
  | 'reconnect_required'
  | 'disconnect_pending'
  | 'disconnected';

export interface IntegrationGrant {
  subjectType: 'all_members' | 'role' | 'custom_role' | 'user';
  subjectKey: string;
}

export interface IntegrationConnection {
  id: string;
  provider: 'pipedream' | 'onoffice' | 'halo';
  appKey: string;
  handle: string;
  displayName: string;
  ownerUserId: string | null;
  visibility: 'private' | 'shared';
  permissionMode: AgentIntegrationPermissionMode;
  status: IntegrationConnectionStatus;
  health: Record<string, unknown>;
  isOwner: boolean;
  canManage: boolean;
  grants: IntegrationGrant[];
  connectedAt: string | null;
  updatedAt: string;
}

export interface PipedreamApp {
  nameSlug: string;
  name: string;
  description?: string;
  imgSrc?: string;
  oauthAppId?: string;
}

export interface CreateConnectionInput {
  provider: 'pipedream';
  appKey: string;
  displayName: string;
  visibility: 'private' | 'shared';
  permissionMode: AgentIntegrationPermissionMode;
  grants: IntegrationGrant[];
}

export interface CreateConnectionResult {
  attemptToken: string;
  connectToken: string;
  externalUserId: string;
  expiresAt: string;
  oauthAppId?: string;
  projectEnvironment: 'development' | 'production';
}

export interface ReconnectResult extends CreateConnectionResult {
  providerAccountId: string;
  appKey: string;
}

export type OsirisAgentIntegrationsClientOptions = { baseUrl?: string };

export function createOsirisAgentIntegrationsClient(
  options: OsirisAgentIntegrationsClientOptions = {},
) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function send(
    path: string,
    method: string,
    body: unknown,
    fallback: string,
  ): Promise<unknown> {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    providerDiagnostics: () =>
      getJson('/agent-integrations/provider-diagnostics', 'Diagnostics unavailable.') as Promise<{
        pipedream: {
          enabled: boolean;
          configured: boolean;
          environment: string | null;
          projectId: string | null;
        };
      }>,
    listConnections: () =>
      getJson('/agent-integrations/connections', 'Connections could not be loaded.') as Promise<{
        connections: IntegrationConnection[];
      }>,
    searchApps: (query: string) =>
      getJson(
        `/agent-integrations/apps?q=${encodeURIComponent(query)}`,
        'App search failed.',
      ) as Promise<{ apps: PipedreamApp[] }>,
    createConnection: (input: CreateConnectionInput) =>
      send(
        '/agent-integrations/connections',
        'POST',
        input,
        'Connection failed.',
      ) as Promise<CreateConnectionResult>,
    finalizeConnection: (input: { attemptToken: string; accountId: string }) =>
      send(
        '/agent-integrations/connections/finalize',
        'POST',
        input,
        'Finalize failed.',
      ) as Promise<{ connection: IntegrationConnection }>,
    updateConnection: (
      connectionId: string,
      data: Partial<
        Pick<IntegrationConnection, 'displayName' | 'visibility' | 'permissionMode' | 'grants'>
      >,
    ) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}`,
        'PATCH',
        data,
        'Update failed.',
      ) as Promise<{ connection: IntegrationConnection }>,
    disconnectConnection: (connectionId: string) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}`,
        'DELETE',
        undefined,
        'Disconnect failed.',
      ) as Promise<void>,
    checkConnectionHealth: (connectionId: string) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}/health`,
        'POST',
        undefined,
        'Health check failed.',
      ) as Promise<{ connection: IntegrationConnection }>,
    reconnectConnection: (connectionId: string) =>
      send(
        `/agent-integrations/connections/${encodeURIComponent(connectionId)}/reconnect`,
        'POST',
        undefined,
        'Reconnect failed.',
      ) as Promise<ReconnectResult>,
    listNativeIntegrations: () =>
      getJson('/agent-integrations', 'Integrations could not be loaded.') as Promise<{
        integrations: AgentIntegrationSummary[];
      }>,
    connectNative: (key: AgentIntegrationKey, data: ConnectAgentIntegrationInput) =>
      send(
        `/agent-integrations/${encodeURIComponent(key)}`,
        'PUT',
        data,
        'Connect failed.',
      ) as Promise<{ integration: AgentIntegrationSummary }>,
    testNative: (key: AgentIntegrationKey) =>
      send(
        `/agent-integrations/${encodeURIComponent(key)}/test`,
        'POST',
        undefined,
        'Test failed.',
      ) as Promise<{ integration: AgentIntegrationSummary }>,
    disconnectNative: (key: AgentIntegrationKey) =>
      send(
        `/agent-integrations/${encodeURIComponent(key)}`,
        'DELETE',
        undefined,
        'Disconnect failed.',
      ) as Promise<{ integration: AgentIntegrationSummary }>,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- agentIntegrationsClient`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/runtime/osiris/agentIntegrationsClient.ts apps/web/src/runtime/osiris/agentIntegrationsClient.test.ts
git commit -m "feat(agent-admin): osiris agent-integrations client"
```

---

### Task 2.2: Query keys + integration hooks

**Files:**

- Create: `apps/web/src/modules/agent-admin/data/agentAdminKeys.ts`
- Create: `apps/web/src/modules/agent-admin/data/useAgentIntegrations.ts`
- Test: `apps/web/src/modules/agent-admin/data/useAgentIntegrations.test.tsx`

**Interfaces:**

- Produces: `agentAdminKeys` factory; hooks `useIntegrationConnections`, `useNativeIntegrations`, `useProviderDiagnostics`, `useSearchIntegrationApps`, and mutation hooks `useCreateIntegrationConnection`, `useFinalizeIntegrationConnection`, `useUpdateIntegrationConnection`, `useDisconnectIntegrationConnection`, `useCheckIntegrationConnectionHealth`, `useReconnectIntegrationConnection`, `useConnectNativeIntegration`, `useTestNativeIntegration`, `useDisconnectNativeIntegration`.

- [ ] **Step 1: Write the failing test** (pre-seeded QueryClient pattern)

```tsx
// apps/web/src/modules/agent-admin/data/useAgentIntegrations.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIntegrationConnections } from './useAgentIntegrations';

afterEach(() => vi.unstubAllGlobals());

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useIntegrationConnections', () => {
  it('fetches connections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ connections: [{ id: 'c1' }] }),
        text: async () => '{"connections":[{"id":"c1"}]}',
      })) as unknown as typeof fetch,
    );
    const { result } = renderHook(() => useIntegrationConnections(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.connections[0]?.id).toBe('c1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- useAgentIntegrations`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement keys**

```ts
// apps/web/src/modules/agent-admin/data/agentAdminKeys.ts
type OrgId = string | null;

export const agentAdminKeys = {
  root: (org: OrgId) => ['agent-admin', org] as const,
  connections: (org: OrgId) => ['agent-admin', org, 'connections'] as const,
  nativeIntegrations: (org: OrgId) => ['agent-admin', org, 'native-integrations'] as const,
  providerDiagnostics: (org: OrgId) => ['agent-admin', org, 'provider-diagnostics'] as const,
  appSearch: (org: OrgId, query: string) => ['agent-admin', org, 'app-search', query] as const,
  tasks: (org: OrgId) => ['agent-admin', org, 'tasks'] as const,
  task: (org: OrgId, taskId: string) => ['agent-admin', org, 'task', taskId] as const,
  taskRuns: (org: OrgId, taskId: string) => ['agent-admin', org, 'task-runs', taskId] as const,
  triggerMailboxes: (org: OrgId) => ['agent-admin', org, 'trigger-mailboxes'] as const,
  activations: (org: OrgId) => ['agent-admin', org, 'activations'] as const,
  activationRuns: (org: OrgId, taskId: string) =>
    ['agent-admin', org, 'activation-runs', taskId] as const,
  heartbeat: (org: OrgId) => ['agent-admin', org, 'heartbeat'] as const,
};
```

- [ ] **Step 4: Implement hooks**

```ts
// apps/web/src/modules/agent-admin/data/useAgentIntegrations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { appToast } from '@/lib/toast';
import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  createOsirisAgentIntegrationsClient,
  type AgentIntegrationKey,
  type ConnectAgentIntegrationInput,
  type CreateConnectionInput,
  type IntegrationConnection,
} from '@/runtime/osiris/agentIntegrationsClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { agentAdminKeys } from './agentAdminKeys';

function useClient() {
  return useMemo(
    () => createOsirisAgentIntegrationsClient({ baseUrl: resolveOsirisApiBaseUrl() }),
    [],
  );
}
function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useIntegrationConnections() {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.connections(org),
    queryFn: () => client.listConnections(),
  });
}

export function useNativeIntegrations(enabled = true) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.nativeIntegrations(org),
    queryFn: () => client.listNativeIntegrations(),
    enabled,
  });
}

export function useProviderDiagnostics() {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.providerDiagnostics(org),
    queryFn: () => client.providerDiagnostics(),
  });
}

export function useSearchIntegrationApps(query: string, enabled: boolean) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.appSearch(org, query),
    queryFn: () => client.searchApps(query),
    enabled: enabled && query.trim().length > 0,
  });
}

function useInvalidateIntegrations() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return () => {
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.connections(org) });
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.nativeIntegrations(org) });
  };
}

export function useCreateIntegrationConnection() {
  const client = useClient();
  return useMutation({
    mutationFn: (input: CreateConnectionInput) => client.createConnection(input),
    onError: (error) => appToast.fromApiError(error, 'Could not start the connection.'),
  });
}

export function useFinalizeIntegrationConnection() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (input: { attemptToken: string; accountId: string }) =>
      client.finalizeConnection(input),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not finalize the connection.'),
  });
}

export function useUpdateIntegrationConnection() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (input: {
      connectionId: string;
      data: Partial<
        Pick<IntegrationConnection, 'displayName' | 'visibility' | 'permissionMode' | 'grants'>
      >;
    }) => client.updateConnection(input.connectionId, input.data),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not update the connection.'),
  });
}

export function useDisconnectIntegrationConnection() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (connectionId: string) => client.disconnectConnection(connectionId),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not disconnect.'),
  });
}

export function useCheckIntegrationConnectionHealth() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (connectionId: string) => client.checkConnectionHealth(connectionId),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Health check failed.'),
  });
}

export function useReconnectIntegrationConnection() {
  const client = useClient();
  return useMutation({
    mutationFn: (connectionId: string) => client.reconnectConnection(connectionId),
    onError: (error) => appToast.fromApiError(error, 'Could not reconnect.'),
  });
}

export function useConnectNativeIntegration() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (input: { key: AgentIntegrationKey; data: ConnectAgentIntegrationInput }) =>
      client.connectNative(input.key, input.data),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not connect the integration.'),
  });
}

export function useTestNativeIntegration() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (key: AgentIntegrationKey) => client.testNative(key),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Integration test failed.'),
  });
}

export function useDisconnectNativeIntegration() {
  const client = useClient();
  const invalidate = useInvalidateIntegrations();
  return useMutation({
    mutationFn: (key: AgentIntegrationKey) => client.disconnectNative(key),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not disconnect the integration.'),
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- useAgentIntegrations`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/agent-admin/data/agentAdminKeys.ts apps/web/src/modules/agent-admin/data/useAgentIntegrations.ts apps/web/src/modules/agent-admin/data/useAgentIntegrations.test.tsx
git commit -m "feat(agent-admin): integration query keys and hooks"
```

---

### Task 2.3: Port integration UI components

**Files:**

- Create: `apps/web/src/modules/agent-admin/components/integrations/ConnectionRow.tsx`
- Create: `apps/web/src/modules/agent-admin/components/integrations/AddConnectionDialog.tsx`
- Create: `apps/web/src/modules/agent-admin/components/integrations/ManageConnectionDialog.tsx`
- Create: `apps/web/src/modules/agent-admin/components/integrations/NativeIntegrationForm.tsx`
- Create: `apps/web/src/modules/agent-admin/components/integrations/OrgAgentIntegrationsPanel.tsx`
- Test: `apps/web/src/modules/agent-admin/components/integrations/OrgAgentIntegrationsPanel.test.tsx`

**Source (faithful port):** `osiris_erp/apps/web/src/modules/settings/components/OrgAgentIntegrationsPanel.tsx` and `.../integrations/{ConnectionRow,AddConnectionDialog,ManageConnectionDialog,NativeIntegrationForm,connectionPresentation}.tsx`.

**Adaptation rules (apply to every ported file):**

1. Replace osiris hook imports with `@/modules/agent-admin/data/useAgentIntegrations` (names: `useIntegrationConnections`, `useNativeIntegrations`, `useCreateIntegrationConnection`, `useFinalizeIntegrationConnection`, `useUpdateIntegrationConnection`, `useDisconnectIntegrationConnection`, `useCheckIntegrationConnectionHealth`, `useReconnectIntegrationConnection`, `useConnectNativeIntegration`, `useTestNativeIntegration`, `useDisconnectNativeIntegration`). Note v3 renames vs osiris: `useConnectAgentIntegration`→`useConnectNativeIntegration`, `useTestAgentIntegration`→`useTestNativeIntegration`, `useDisconnectAgentIntegration`→`useDisconnectNativeIntegration`, `useOrgAgentIntegrations`→`useNativeIntegrations`, `useIntegrationProviderDiagnostics`→`useProviderDiagnostics`, `useSearchIntegrationApps` unchanged.
2. Types import from `@/runtime/osiris/agentIntegrationsClient`.
3. Replace any `Select` with `Combobox`; replace toast calls with `appToast`; replace `window.confirm` for disconnect with `ConfirmActionDialog`/`ConfirmPopover` from `@oktavius/base-ui`.
4. Icons from `@/lib/icons` only (map any osiris icon import to the v3 equivalent; grep `@/lib/icons` for the name).
5. Replace osiris org-users hook (`useOrgUsers`) with the v3 equivalent — grep `apps/web/src/**/useOrgUsers*` or members data hooks; if none exists, derive member options from `useOptionalOsirisRuntime()` membership data, or pass an empty list and TODO-log via `log()`-style comment (do NOT silently hide — render "no members" empty state).
6. Mutations call `.mutate`/`.mutateAsync`; await `mutateAsync` inside dialog submit so the dialog stays open on error (toast raised by hook's `onError`).
7. `isAdmin` is derived from `canUsePermissionRequirement(permissionSubject, 'org.manage')` using `useOptionalOsirisRuntime()?.permissionSubject`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/components/integrations/OrgAgentIntegrationsPanel.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OrgAgentIntegrationsPanel } from './OrgAgentIntegrationsPanel';

afterEach(() => vi.unstubAllGlobals());

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<OrgAgentIntegrationsPanel />, { wrapper: Wrapper });
}

describe('OrgAgentIntegrationsPanel', () => {
  it('renders a connection returned by the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        const body = String(input).includes('/connections')
          ? {
              connections: [
                {
                  id: 'c1',
                  displayName: 'Slack',
                  provider: 'pipedream',
                  appKey: 'slack',
                  visibility: 'private',
                  status: 'connected',
                  isOwner: true,
                  canManage: true,
                  grants: [],
                  updatedAt: '2026-01-01',
                },
              ],
            }
          : { integrations: [] };
        return {
          ok: true,
          status: 200,
          json: async () => body,
          text: async () => JSON.stringify(body),
        };
      }) as unknown as typeof fetch,
    );
    renderPanel();
    await waitFor(() => expect(screen.getByText('Slack')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- OrgAgentIntegrationsPanel`
Expected: FAIL — module not found.

- [ ] **Step 3: Port the five files**

Copy each osiris source file to its v3 path above and apply the adaptation rules. Read the osiris source with the Read tool first; do not invent UI — keep layout/copy faithful, only swap imports/primitives per the rules. Use base-ui `SettingsSection` wrappers so the panel matches the section visual style.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- OrgAgentIntegrationsPanel`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/agent-admin/components/integrations/
git commit -m "feat(agent-admin): port integration connection UI"
```

---

### Task 2.4: Wire Integrations section into the page

**Files:**

- Create: `apps/web/src/modules/agent-admin/sections/AgentIntegrationsSection.tsx`
- Modify: `apps/web/src/modules/agent-admin/AgentAdminPage.tsx` (append section)
- Test: extend `apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx`

**Interfaces:**

- Consumes: `OrgAgentIntegrationsPanel`.
- Produces: `AgentIntegrationsSection`; `/agent?section=integrations` renders the panel.

- [ ] **Step 1: Write the failing test** (add to AgentAdminPage.test.tsx)

```tsx
it('renders the integrations section when deep-linked', () => {
  renderAt('/agent?section=integrations');
  expect(screen.getByTestId('agent-integrations-section')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AgentAdminPage`
Expected: FAIL — testid not found.

- [ ] **Step 3: Implement the section**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentIntegrationsSection.tsx
import { OrgAgentIntegrationsPanel } from '../components/integrations/OrgAgentIntegrationsPanel';

export function AgentIntegrationsSection() {
  return (
    <div data-testid="agent-integrations-section">
      <OrgAgentIntegrationsPanel />
    </div>
  );
}
```

Append to the `sections` array in `AgentAdminPage.tsx` (import `EmailIcon`/`PlugIcon` from `@/lib/icons` — pick an existing plug/link icon; grep first):

```tsx
    {
      id: 'integrations',
      group: t('agent_admin.groupConfiguration', undefined, 'Configuration'),
      label: t('agent_admin.sectionIntegrations', undefined, 'Integrations'),
      icon: <PlugIcon size={16} weight="duotone" />,
      title: t('agent_admin.sectionIntegrations', undefined, 'Integrations'),
      sectionDescription: 'Connect external apps and native providers your agent can use.',
      permission: 'org.manage',
      render: () => <AgentIntegrationsSection />,
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AgentAdminPage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/sections/AgentIntegrationsSection.tsx apps/web/src/modules/agent-admin/AgentAdminPage.tsx apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx
git commit -m "feat(agent-admin): wire integrations section"
```

---

# PHASE 3 — Automations section

Deliverable: `/agent?section=automations` lists scheduled tasks, opens detail with run history, and create/edit form with triggers, wired to `/scheduler/*`. Sub-navigation within the section via an internal view-state (list | detail | form), NOT new router routes (keeps the module under one route).

### Task 3.1: `schedulerClient` + types

**Files:**

- Create: `apps/web/src/runtime/osiris/schedulerClient.ts`
- Test: `apps/web/src/runtime/osiris/schedulerClient.test.ts`

**Interfaces:**

- Produces: `createOsirisSchedulerClient({ baseUrl }?)` with methods `listTasks`, `getTask`, `listTaskRuns`, `triggerMailboxes`, `createTask`, `updateTask`, `pauseTask`, `resumeTask`, `runTaskNow`; and types `ScheduledTask`, `ScheduledTaskRun`, `ScheduleType`, `ScheduledTaskRunStatus`, `EmailTriggerConfig`, `HaloTriggerConfig`, `TriggerConfig`, `TriggerMailbox`, `CreateScheduledTaskPayload`, `RunTriggerContext`, `SchedulerPageResult<T>`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/runtime/osiris/schedulerClient.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisSchedulerClient } from './schedulerClient';

afterEach(() => vi.unstubAllGlobals());

function mockFetch(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })) as unknown as typeof fetch,
  );
}

describe('schedulerClient', () => {
  it('lists tasks from GET /scheduler', async () => {
    mockFetch({
      data: [{ id: 't1', name: 'Daily digest' }],
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    const client = createOsirisSchedulerClient({ baseUrl: '/v1' });
    const result = await client.listTasks();
    expect(result.data[0]?.id).toBe('t1');
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/scheduler');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- schedulerClient`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

```ts
// apps/web/src/runtime/osiris/schedulerClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import { readErrorMessage } from './osirisClientUtils';

export type ScheduleType = 'once' | 'interval' | 'cron' | 'event';
export type ScheduledTaskRunStatus =
  | 'claimed'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'dead_letter';
export type EmailTriggerAttachmentType = 'pdf' | 'word' | 'excel' | 'image';

export interface EmailTriggerConfig {
  kind: 'email_received';
  syncAccountId: string;
  senders: string[];
  keywords: string[];
  attachments: 'any' | EmailTriggerAttachmentType[] | null;
  rateLimitPerHour?: number;
}
export interface HaloTriggerConfig {
  kind: 'halo_ticket_created';
  priorityIds: number[];
  statusIds: number[];
  clientIds: number[];
  rateLimitPerHour?: number;
}
export type TriggerConfig = EmailTriggerConfig | HaloTriggerConfig;

export interface ScheduledTask {
  id: string;
  scope: 'org' | 'user' | 'system';
  ownerUserId: string | null;
  name: string;
  description: string | null;
  enabled: boolean;
  scheduleType: ScheduleType;
  scheduleExpression: string;
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  targetType: string;
  targetPayload: Record<string, unknown>;
  triggerConfig: TriggerConfig | null;
  createdAt: string;
  updatedAt: string;
}
export interface TriggerMailbox {
  id: string;
  userId: string;
  emailAddress: string | null;
  displayName: string | null;
  syncStatus: string | null;
}
export interface CreateScheduledTaskPayload {
  scope?: 'org' | 'user';
  name: string;
  description?: string | null;
  scheduleType: ScheduleType;
  scheduleExpression: string;
  timezone?: string;
  targetType: 'orchestration_event';
  targetPayload: { eventType: 'agent_activation'; prompt: string };
  triggerConfig?: TriggerConfig | null;
}
export interface RunTriggerContext {
  kind?: string;
  from?: string | null;
  subject?: string | null;
  mailbox?: string | null;
  ticketId?: number | null;
  summary?: string | null;
  clientName?: string | null;
}
export interface ScheduledTaskRun {
  id: string;
  taskId: string;
  scheduledFor: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: ScheduledTaskRunStatus;
  attemptCount: number;
  targetRef: string | null;
  conversationId: string | null;
  userError: string | null;
  metadata?: { trigger?: RunTriggerContext } & Record<string, unknown>;
  createdAt: string;
}
export interface SchedulerPageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore?: boolean;
}

export type OsirisSchedulerClientOptions = { baseUrl?: string };

export function createOsirisSchedulerClient(options: OsirisSchedulerClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);
  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }
  async function send(path: string, method: string, body: unknown, fallback: string) {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    listTasks: () =>
      getJson('/scheduler?page=1&pageSize=100', 'Automations could not be loaded.') as Promise<
        SchedulerPageResult<ScheduledTask>
      >,
    getTask: (taskId: string) =>
      getJson(
        `/scheduler/${encodeURIComponent(taskId)}`,
        'Automation could not be loaded.',
      ) as Promise<ScheduledTask>,
    listTaskRuns: (taskId: string, pageSize = 50) =>
      getJson(
        `/scheduler/runs?taskId=${encodeURIComponent(taskId)}&page=1&pageSize=${pageSize}`,
        'Run history could not be loaded.',
      ) as Promise<SchedulerPageResult<ScheduledTaskRun>>,
    triggerMailboxes: () =>
      getJson('/scheduler/trigger-mailboxes', 'Mailboxes could not be loaded.') as Promise<{
        data: TriggerMailbox[];
      }>,
    createTask: (payload: CreateScheduledTaskPayload) =>
      send(
        '/scheduler',
        'POST',
        payload,
        'Automation could not be created.',
      ) as Promise<ScheduledTask>,
    updateTask: (taskId: string, payload: Partial<CreateScheduledTaskPayload>) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}`,
        'PATCH',
        payload,
        'Automation could not be updated.',
      ) as Promise<ScheduledTask>,
    pauseTask: (taskId: string) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}/pause`,
        'POST',
        undefined,
        'Could not pause.',
      ) as Promise<ScheduledTask>,
    resumeTask: (taskId: string) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}/resume`,
        'POST',
        undefined,
        'Could not resume.',
      ) as Promise<ScheduledTask>,
    runTaskNow: (taskId: string) =>
      send(
        `/scheduler/${encodeURIComponent(taskId)}/run-now`,
        'POST',
        undefined,
        'Could not run now.',
      ) as Promise<unknown>,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- schedulerClient`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/runtime/osiris/schedulerClient.ts apps/web/src/runtime/osiris/schedulerClient.test.ts
git commit -m "feat(agent-admin): osiris scheduler client"
```

---

### Task 3.2: Scheduler hooks

**Files:**

- Create: `apps/web/src/modules/agent-admin/data/useScheduler.ts`
- Test: `apps/web/src/modules/agent-admin/data/useScheduler.test.tsx`

**Interfaces:**

- Consumes: `agentAdminKeys`, `createOsirisSchedulerClient`.
- Produces: `useScheduledTasks`, `useScheduledTask(taskId)`, `useScheduledTaskRuns(taskId, pageSize?)`, `useTriggerMailboxes(enabled?)`, `useCreateScheduledTask`, `useUpdateScheduledTask(taskId)`, `useTaskActions(taskId)` returning `{ pause, resume, runNow }`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/data/useScheduler.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useScheduledTasks } from './useScheduler';

afterEach(() => vi.unstubAllGlobals());

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useScheduledTasks', () => {
  it('loads tasks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 't1', name: 'X' }],
          total: 1,
          page: 1,
          pageSize: 100,
          totalPages: 1,
        }),
        text: async () => '',
      })) as unknown as typeof fetch,
    );
    const { result } = renderHook(() => useScheduledTasks(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0]?.id).toBe('t1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- useScheduler`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hooks**

```ts
// apps/web/src/modules/agent-admin/data/useScheduler.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { appToast } from '@/lib/toast';
import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  createOsirisSchedulerClient,
  type CreateScheduledTaskPayload,
} from '@/runtime/osiris/schedulerClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { agentAdminKeys } from './agentAdminKeys';

function useClient() {
  return useMemo(() => createOsirisSchedulerClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}
function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useScheduledTasks() {
  const client = useClient();
  const org = useOrgId();
  return useQuery({ queryKey: agentAdminKeys.tasks(org), queryFn: () => client.listTasks() });
}

export function useScheduledTask(taskId: string | undefined) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.task(org, taskId ?? ''),
    queryFn: () => client.getTask(taskId as string),
    enabled: Boolean(taskId),
  });
}

export function useScheduledTaskRuns(taskId: string | undefined, pageSize = 50) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.taskRuns(org, taskId ?? ''),
    queryFn: () => client.listTaskRuns(taskId as string, pageSize),
    enabled: Boolean(taskId),
  });
}

export function useTriggerMailboxes(enabled = true) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.triggerMailboxes(org),
    queryFn: () => client.triggerMailboxes(),
    enabled,
  });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return (taskId?: string) => {
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.tasks(org) });
    if (taskId) {
      void queryClient.invalidateQueries({ queryKey: agentAdminKeys.task(org, taskId) });
      void queryClient.invalidateQueries({ queryKey: agentAdminKeys.taskRuns(org, taskId) });
    }
  };
}

export function useCreateScheduledTask() {
  const client = useClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload: CreateScheduledTaskPayload) => client.createTask(payload),
    onSuccess: () => invalidate(),
    onError: (error) => appToast.fromApiError(error, 'Automation could not be created.'),
  });
}

export function useUpdateScheduledTask(taskId: string | undefined) {
  const client = useClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (payload: Partial<CreateScheduledTaskPayload>) =>
      client.updateTask(taskId as string, payload),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Automation could not be updated.'),
  });
}

export function useTaskActions(taskId: string | undefined) {
  const client = useClient();
  const invalidate = useInvalidateTasks();
  const pause = useMutation({
    mutationFn: () => client.pauseTask(taskId as string),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Could not pause the automation.'),
  });
  const resume = useMutation({
    mutationFn: () => client.resumeTask(taskId as string),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Could not resume the automation.'),
  });
  const runNow = useMutation({
    mutationFn: () => client.runTaskNow(taskId as string),
    onSuccess: () => invalidate(taskId),
    onError: (error) => appToast.fromApiError(error, 'Could not run the automation now.'),
  });
  return { pause, resume, runNow };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- useScheduler`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/data/useScheduler.ts apps/web/src/modules/agent-admin/data/useScheduler.test.tsx
git commit -m "feat(agent-admin): scheduler hooks"
```

---

### Task 3.3: Port automations list + detail + form components

**Files:**

- Create: `apps/web/src/modules/agent-admin/components/automations/AutomationsList.tsx`
- Create: `apps/web/src/modules/agent-admin/components/automations/AutomationDetail.tsx`
- Create: `apps/web/src/modules/agent-admin/components/automations/AutomationForm.tsx`
- Create: `apps/web/src/modules/agent-admin/components/automations/automationPresentation.ts`
- Test: `apps/web/src/modules/agent-admin/components/automations/AutomationsList.test.tsx`

**Source (faithful port):** `osiris_erp/apps/web/src/modules/automations/components/{AutomationsPage,AutomationDetailPage,AutomationFormPage,automationPresentation}.tsx`.

**Adaptation rules:**

1. These osiris components are router-driven pages (use `useNavigate`/route params). Convert to **prop-driven** components that the section orchestrates with internal state, NOT router routes:
   - `AutomationsList`: props `{ onOpen: (taskId: string) => void; onCreate: () => void }`. Uses `useScheduledTasks`.
   - `AutomationDetail`: props `{ taskId: string; onBack: () => void; onEdit: (taskId: string) => void }`. Uses `useScheduledTask`, `useScheduledTaskRuns`, `useTaskActions`.
   - `AutomationForm`: props `{ taskId: string | null; onDone: () => void; onCancel: () => void }`. Uses `useCreateScheduledTask`, `useUpdateScheduledTask(taskId)`, `useScheduledTask` (edit mode), `useTriggerMailboxes`.
2. Hooks import from `@/modules/agent-admin/data/useScheduler`; types from `@/runtime/osiris/schedulerClient`.
3. `Select`→`Combobox`; toasts→`appToast`; run-now/pause/resume confirmations and any delete via `ConfirmActionDialog`/`ConfirmPopover`.
4. Use `CrudTable` / list shell (`@/components/data/CrudListShell` or `CrudTable` from base-ui) for the task list and run-history table to match v3 list styling.
5. i18n: reuse the existing `scheduler` namespace keys where present (`usePreloadNamespaces(['scheduler', 'agent_admin'])`); add missing keys to `packages/i18n/locales/{en,de}/scheduler.json` and regenerate if needed.
6. Chat links: where osiris links a run to a conversation (`conversationId`), navigate to the v3 chat route (`/ai-chat`) — grep for the v3 conversation deep-link pattern; if none, render the conversation id as non-link text (no dead links).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/components/automations/AutomationsList.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AutomationsList } from './AutomationsList';

afterEach(() => vi.unstubAllGlobals());

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<AutomationsList onOpen={() => {}} onCreate={() => {}} />, { wrapper: Wrapper });
}

describe('AutomationsList', () => {
  it('shows a scheduled task name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 't1',
              name: 'Daily digest',
              scheduleType: 'cron',
              scheduleExpression: '0 8 * * *',
              enabled: true,
              nextRunAt: null,
              lastRunAt: null,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 100,
          totalPages: 1,
        }),
        text: async () => '',
      })) as unknown as typeof fetch,
    );
    renderList();
    await waitFor(() => expect(screen.getByText('Daily digest')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AutomationsList`
Expected: FAIL — module not found.

- [ ] **Step 3: Port the four files** per the adaptation rules (Read osiris sources first; keep layout/copy faithful).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AutomationsList`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/agent-admin/components/automations/
git commit -m "feat(agent-admin): port automations list, detail, and form"
```

---

### Task 3.4: Automations section orchestrator

**Files:**

- Create: `apps/web/src/modules/agent-admin/sections/AgentAutomationsSection.tsx`
- Test: `apps/web/src/modules/agent-admin/sections/AgentAutomationsSection.test.tsx`

**Interfaces:**

- Consumes: `AutomationsList`, `AutomationDetail`, `AutomationForm`.
- Produces: `AgentAutomationsSection` managing internal view state (`list` | `detail` | `form`).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentAutomationsSection.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgentAutomationsSection } from './AgentAutomationsSection';

afterEach(() => vi.unstubAllGlobals());

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<AgentAutomationsSection />, { wrapper: Wrapper });
}

describe('AgentAutomationsSection', () => {
  it('switches from list to detail when a task is opened', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        const body = String(input).includes('/runs')
          ? { data: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }
          : String(input).match(/\/scheduler\/t1$/)
            ? {
                id: 't1',
                name: 'Daily digest',
                scheduleType: 'cron',
                scheduleExpression: '0 8 * * *',
                enabled: true,
                scope: 'org',
                ownerUserId: null,
                description: null,
                timezone: 'UTC',
                nextRunAt: null,
                lastRunAt: null,
                targetType: 'orchestration_event',
                targetPayload: {},
                triggerConfig: null,
                createdAt: '',
                updatedAt: '',
              }
            : {
                data: [
                  {
                    id: 't1',
                    name: 'Daily digest',
                    scheduleType: 'cron',
                    scheduleExpression: '0 8 * * *',
                    enabled: true,
                    nextRunAt: null,
                    lastRunAt: null,
                  },
                ],
                total: 1,
                page: 1,
                pageSize: 100,
                totalPages: 1,
              };
        return { ok: true, status: 200, json: async () => body, text: async () => '' };
      }) as unknown as typeof fetch,
    );
    renderSection();
    await waitFor(() => expect(screen.getByText('Daily digest')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Daily digest'));
    await waitFor(() => expect(screen.getByTestId('automation-detail')).toBeInTheDocument());
  });
});
```

> Adjust the click target / `automation-detail` testid to match the ported components (add `data-testid="automation-detail"` to `AutomationDetail`'s root, and make the list row clickable calling `onOpen(task.id)`).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AgentAutomationsSection`
Expected: FAIL.

- [ ] **Step 3: Implement the orchestrator**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentAutomationsSection.tsx
import { useState } from 'react';

import { AutomationDetail } from '../components/automations/AutomationDetail';
import { AutomationForm } from '../components/automations/AutomationForm';
import { AutomationsList } from '../components/automations/AutomationsList';

type View =
  | { kind: 'list' }
  | { kind: 'detail'; taskId: string }
  | { kind: 'form'; taskId: string | null };

export function AgentAutomationsSection() {
  const [view, setView] = useState<View>({ kind: 'list' });

  if (view.kind === 'detail') {
    return (
      <AutomationDetail
        taskId={view.taskId}
        onBack={() => setView({ kind: 'list' })}
        onEdit={(taskId) => setView({ kind: 'form', taskId })}
      />
    );
  }
  if (view.kind === 'form') {
    return (
      <AutomationForm
        taskId={view.taskId}
        onDone={() => setView({ kind: 'list' })}
        onCancel={() => setView({ kind: 'list' })}
      />
    );
  }
  return (
    <AutomationsList
      onOpen={(taskId) => setView({ kind: 'detail', taskId })}
      onCreate={() => setView({ kind: 'form', taskId: null })}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AgentAutomationsSection`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/sections/AgentAutomationsSection.tsx apps/web/src/modules/agent-admin/sections/AgentAutomationsSection.test.tsx
git commit -m "feat(agent-admin): automations section orchestrator"
```

---

### Task 3.5: Wire Automations section into the page

**Files:**

- Modify: `apps/web/src/modules/agent-admin/AgentAdminPage.tsx`
- Test: extend `AgentAdminPage.test.tsx`

- [ ] **Step 1: Add the failing test**

```tsx
it('renders the automations section when deep-linked', async () => {
  // stub fetch to return an empty task list
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 1 }),
      text: async () => '',
    })) as unknown as typeof fetch,
  );
  renderAt('/agent?section=automations');
  expect(await screen.findByTestId('agent-automations-section')).toBeInTheDocument();
});
```

> Wrap `AgentAdminPage` test renders in a `QueryClientProvider` now that sections fetch data — update `renderAt` to include the provider.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AgentAdminPage`
Expected: FAIL.

- [ ] **Step 3: Append the section** (wrap `AgentAutomationsSection` in `<div data-testid="agent-automations-section">`):

```tsx
    {
      id: 'automations',
      group: t('agent_admin.groupOperations', undefined, 'Operations'),
      label: t('agent_admin.sectionAutomations', undefined, 'Automations'),
      icon: <CalendarIcon size={16} weight="duotone" />,
      title: t('agent_admin.sectionAutomations', undefined, 'Automations'),
      sectionDescription: 'Scheduled and triggered agent tasks.',
      permission: 'scheduler.view',
      render: () => (
        <div data-testid="agent-automations-section">
          <AgentAutomationsSection />
        </div>
      ),
    },
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AgentAdminPage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/AgentAdminPage.tsx apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx
git commit -m "feat(agent-admin): wire automations section"
```

---

# PHASE 4 — Heartbeat & Queue section

Deliverable: `/agent?section=heartbeat` shows heartbeat status with Activate/Kill, plus the scheduled-activations queue with runs, wired to `/scheduler/heartbeat/*` and the activations endpoints.

### Task 4.1: `agentActivationsClient` + types

**Files:**

- Create: `apps/web/src/runtime/osiris/agentActivationsClient.ts`
- Test: `apps/web/src/runtime/osiris/agentActivationsClient.test.ts`

**Interfaces:**

- Produces: `createOsirisAgentActivationsClient({ baseUrl }?)` with methods `listActivations(params?)`, `listActivationRuns(taskId, page?, pageSize?)`, `pauseActivation(id)`, `resumeActivation(id)`, `triggerActivationNow(id)`, `getHeartbeat()`, `activateHeartbeat(timezone)`, `killHeartbeat()`; and types `ScheduledAgentActivation`, `ScheduledAgentActivationRun`, `ScheduledActivationStatus`, plus helpers `deriveScheduledActivationStatus`, `isAgentHeartbeatRunning`, `mapScheduledTaskToActivation`.

> Endpoints (from osiris): list activations `GET /scheduler?page=1&pageSize=100&targetType=orchestration_event` (+ `ownerUserId` when not admin); runs `GET /scheduler/runs?taskId=&page=&pageSize=50`; pause/resume/run-now reuse `/scheduler/{id}/pause|resume|run-now`; heartbeat `GET /scheduler/heartbeat`, `POST /scheduler/heartbeat/activate` (body `{ timezone }`), `POST /scheduler/heartbeat/kill`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/runtime/osiris/agentActivationsClient.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createOsirisAgentActivationsClient,
  deriveScheduledActivationStatus,
} from './agentActivationsClient';

afterEach(() => vi.unstubAllGlobals());

describe('agentActivationsClient', () => {
  it('derives paused status when disabled', () => {
    expect(
      deriveScheduledActivationStatus({
        enabled: false,
        nextRunAt: null,
        scheduleType: 'cron',
        lastRunAt: null,
      }),
    ).toBe('paused');
  });

  it('activates heartbeat via POST with timezone body', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 'hb', isHeartbeat: true, enabled: true }),
      text: async () => '{}',
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const client = createOsirisAgentActivationsClient({ baseUrl: '/v1' });
    await client.activateHeartbeat('Europe/Vienna');
    expect(fetchMock.mock.calls[0][0]).toContain('/scheduler/heartbeat/activate');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ timezone: 'Europe/Vienna' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- agentActivationsClient`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

```ts
// apps/web/src/runtime/osiris/agentActivationsClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import { readErrorMessage } from './osirisClientUtils';

export type ScheduledActivationStatus = 'paused' | 'scheduled' | 'completed';

export interface ScheduledAgentActivation {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  scheduleType: 'once' | 'interval' | 'cron';
  scheduleExpression: string;
  timezone: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  targetPayload: Record<string, unknown>;
  customFields: Record<string, unknown>;
  prompt: string;
  isHeartbeat: boolean;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledAgentActivationRun {
  id: string;
  taskId: string;
  scheduledFor: string;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  targetRef: string | null;
  createdAt: string;
  conversationId: string | null;
  userError: string | null;
  isFailed: boolean;
}

export function deriveScheduledActivationStatus(
  task: Pick<ScheduledAgentActivation, 'enabled' | 'nextRunAt' | 'scheduleType' | 'lastRunAt'>,
): ScheduledActivationStatus {
  if (!task.enabled) return 'paused';
  if (task.scheduleType === 'once' && !task.nextRunAt && task.lastRunAt) return 'completed';
  return 'scheduled';
}

export function isAgentHeartbeatRunning(
  heartbeat: Pick<ScheduledAgentActivation, 'enabled' | 'nextRunAt' | 'scheduleType' | 'lastRunAt'>,
): boolean {
  return deriveScheduledActivationStatus(heartbeat) === 'scheduled';
}

export type OsirisAgentActivationsClientOptions = { baseUrl?: string };

export function createOsirisAgentActivationsClient(
  options: OsirisAgentActivationsClientOptions = {},
) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);
  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }
  async function send(path: string, method: string, body: unknown, fallback: string) {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    listActivations: (params?: { ownerUserId?: string | null }) => {
      const q = new URLSearchParams({
        page: '1',
        pageSize: '100',
        targetType: 'orchestration_event',
      });
      if (params?.ownerUserId) q.set('ownerUserId', params.ownerUserId);
      return getJson(`/scheduler?${q.toString()}`, 'Activations could not be loaded.') as Promise<{
        data: ScheduledAgentActivation[];
      }>;
    },
    listActivationRuns: (taskId: string, page = 1, pageSize = 50) =>
      getJson(
        `/scheduler/runs?taskId=${encodeURIComponent(taskId)}&page=${page}&pageSize=${pageSize}`,
        'Run history could not be loaded.',
      ) as Promise<{ data: ScheduledAgentActivationRun[]; page: number; hasMore?: boolean }>,
    pauseActivation: (id: string) =>
      send(
        `/scheduler/${encodeURIComponent(id)}/pause`,
        'POST',
        undefined,
        'Could not pause.',
      ) as Promise<ScheduledAgentActivation>,
    resumeActivation: (id: string) =>
      send(
        `/scheduler/${encodeURIComponent(id)}/resume`,
        'POST',
        undefined,
        'Could not resume.',
      ) as Promise<ScheduledAgentActivation>,
    triggerActivationNow: (id: string) =>
      send(
        `/scheduler/${encodeURIComponent(id)}/run-now`,
        'POST',
        undefined,
        'Could not trigger now.',
      ) as Promise<ScheduledAgentActivationRun>,
    getHeartbeat: () =>
      getJson(
        '/scheduler/heartbeat',
        'Heartbeat could not be loaded.',
      ) as Promise<ScheduledAgentActivation | null>,
    activateHeartbeat: (timezone: string) =>
      send(
        '/scheduler/heartbeat/activate',
        'POST',
        { timezone },
        'Could not activate heartbeat.',
      ) as Promise<ScheduledAgentActivation>,
    killHeartbeat: () =>
      send(
        '/scheduler/heartbeat/kill',
        'POST',
        undefined,
        'Could not stop heartbeat.',
      ) as Promise<ScheduledAgentActivation | null>,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- agentActivationsClient`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/runtime/osiris/agentActivationsClient.ts apps/web/src/runtime/osiris/agentActivationsClient.test.ts
git commit -m "feat(agent-admin): osiris agent-activations + heartbeat client"
```

---

### Task 4.2: Activation + heartbeat hooks

**Files:**

- Create: `apps/web/src/modules/agent-admin/data/useAgentActivations.ts`
- Test: `apps/web/src/modules/agent-admin/data/useAgentActivations.test.tsx`

**Interfaces:**

- Produces: `useScheduledAgentActivations(options?)`, `useScheduledActivationRuns(taskId)`, `usePauseActivation`, `useResumeActivation`, `useTriggerActivationNow`, `useAgentHeartbeat`, `useActivateAgentHeartbeat`, `useKillAgentHeartbeat`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/data/useAgentActivations.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useScheduledAgentActivations } from './useAgentActivations';

afterEach(() => vi.unstubAllGlobals());

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useScheduledAgentActivations', () => {
  it('loads activations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'a1',
              name: 'Morning sweep',
              isHeartbeat: false,
              enabled: true,
              scheduleType: 'cron',
              nextRunAt: null,
              lastRunAt: null,
            },
          ],
        }),
        text: async () => '',
      })) as unknown as typeof fetch,
    );
    const { result } = renderHook(() => useScheduledAgentActivations(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('Morning sweep');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- useAgentActivations`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hooks**

```ts
// apps/web/src/modules/agent-admin/data/useAgentActivations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { appToast } from '@/lib/toast';
import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { createOsirisAgentActivationsClient } from '@/runtime/osiris/agentActivationsClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { agentAdminKeys } from './agentAdminKeys';

function useClient() {
  return useMemo(
    () => createOsirisAgentActivationsClient({ baseUrl: resolveOsirisApiBaseUrl() }),
    [],
  );
}
function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useScheduledAgentActivations(options?: {
  enabled?: boolean;
  ownerUserId?: string | null;
}) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.activations(org),
    queryFn: () =>
      client.listActivations({ ownerUserId: options?.ownerUserId }).then((r) => r.data),
    enabled: options?.enabled ?? true,
  });
}

export function useScheduledActivationRuns(taskId: string | null) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.activationRuns(org, taskId ?? ''),
    queryFn: () => client.listActivationRuns(taskId as string).then((r) => r.data),
    enabled: Boolean(taskId),
  });
}

export function useAgentHeartbeat(options?: { enabled?: boolean }) {
  const client = useClient();
  const org = useOrgId();
  return useQuery({
    queryKey: agentAdminKeys.heartbeat(org),
    queryFn: () => client.getHeartbeat(),
    enabled: options?.enabled ?? true,
  });
}

function useInvalidateActivations() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return () => {
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.activations(org) });
    void queryClient.invalidateQueries({ queryKey: agentAdminKeys.heartbeat(org) });
  };
}

export function usePauseActivation() {
  const client = useClient();
  const invalidate = useInvalidateActivations();
  return useMutation({
    mutationFn: (id: string) => client.pauseActivation(id),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not pause the activation.'),
  });
}

export function useResumeActivation() {
  const client = useClient();
  const invalidate = useInvalidateActivations();
  return useMutation({
    mutationFn: (id: string) => client.resumeActivation(id),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not resume the activation.'),
  });
}

export function useTriggerActivationNow() {
  const client = useClient();
  const invalidate = useInvalidateActivations();
  return useMutation({
    mutationFn: (id: string) => client.triggerActivationNow(id),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not trigger the activation.'),
  });
}

export function useActivateAgentHeartbeat() {
  const client = useClient();
  const invalidate = useInvalidateActivations();
  const runtime = useOptionalOsirisRuntime();
  const timezone = runtime?.config?.timezone ?? 'UTC';
  return useMutation({
    mutationFn: () => client.activateHeartbeat(timezone),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not activate the heartbeat.'),
  });
}

export function useKillAgentHeartbeat() {
  const client = useClient();
  const invalidate = useInvalidateActivations();
  return useMutation({
    mutationFn: () => client.killHeartbeat(),
    onSuccess: invalidate,
    onError: (error) => appToast.fromApiError(error, 'Could not stop the heartbeat.'),
  });
}
```

> `runtime?.config?.timezone` may differ — grep `useOsirisRuntime` for how timezone is exposed; fall back to `'UTC'` or the workspace settings timezone if not on `config`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- useAgentActivations`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/agent-admin/data/useAgentActivations.ts apps/web/src/modules/agent-admin/data/useAgentActivations.test.tsx
git commit -m "feat(agent-admin): activation and heartbeat hooks"
```

---

### Task 4.3: Heartbeat & Queue section UI + wire into page

**Files:**

- Create: `apps/web/src/modules/agent-admin/components/queue/HeartbeatControl.tsx`
- Create: `apps/web/src/modules/agent-admin/components/queue/ScheduledActivationsPanel.tsx`
- Create: `apps/web/src/modules/agent-admin/sections/AgentHeartbeatSection.tsx`
- Modify: `apps/web/src/modules/agent-admin/AgentAdminPage.tsx`
- Test: `apps/web/src/modules/agent-admin/sections/AgentHeartbeatSection.test.tsx`

**Source (faithful port):** heartbeat control extracted from `osiris .../ai-chat-sidebar/AgentSettingsPopover.tsx` (heartbeat parts only); queue from `osiris .../agent/components/ScheduledAgentActivationsPanel.tsx`.

**Adaptation rules:**

1. `HeartbeatControl`: uses `useAgentHeartbeat`, `useActivateAgentHeartbeat`, `useKillAgentHeartbeat`. Renders a status indicator (use base-ui `StatusDot`) + a button whose label/variant depends on state: no heartbeat → "Activate heartbeat"; running → "Kill heartbeat" (destructive) behind a `ConfirmPopover`/`ConfirmActionDialog`; paused → "Resume" (calls activate). Show pending spinner via the mutation `isPending`.
2. `ScheduledActivationsPanel`: prop-driven (`{ currentUserId?: string | null; showOwnerLabel?: boolean }`), uses `useScheduledAgentActivations`, `useScheduledActivationRuns`, `usePauseActivation`, `useResumeActivation`, `useTriggerActivationNow`. Renders the activations list with `deriveScheduledActivationStatus` badges, next-run/schedule, and an expandable run history per recurring activation. Drop the osiris master/detail `selectedId`/`onSelect` router coupling in favor of internal expand state.
3. No native confirms; `Select`→`Combobox`; toasts→`appToast`; icons from `@/lib/icons`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentHeartbeatSection.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgentHeartbeatSection } from './AgentHeartbeatSection';

afterEach(() => vi.unstubAllGlobals());

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<AgentHeartbeatSection />, { wrapper: Wrapper });
}

describe('AgentHeartbeatSection', () => {
  it('shows activate control when no heartbeat exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        const body = String(input).includes('/heartbeat') ? null : { data: [] };
        return {
          ok: true,
          status: 200,
          json: async () => body,
          text: async () => (body === null ? '' : JSON.stringify(body)),
        };
      }) as unknown as typeof fetch,
    );
    renderSection();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /activate heartbeat/i })).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test -- AgentHeartbeatSection`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the two components + section**

```tsx
// apps/web/src/modules/agent-admin/sections/AgentHeartbeatSection.tsx
import { HeartbeatControl } from '../components/queue/HeartbeatControl';
import { ScheduledActivationsPanel } from '../components/queue/ScheduledActivationsPanel';

export function AgentHeartbeatSection() {
  return (
    <div className="space-y-6" data-testid="agent-heartbeat-section">
      <HeartbeatControl />
      <ScheduledActivationsPanel />
    </div>
  );
}
```

Implement `HeartbeatControl.tsx` and `ScheduledActivationsPanel.tsx` per the adaptation rules (Read the osiris sources first). `HeartbeatControl` must render a button labelled "Activate heartbeat" when `useAgentHeartbeat().data` is null.

Append the section to `AgentAdminPage.tsx`:

```tsx
    {
      id: 'heartbeat',
      group: t('agent_admin.groupOperations', undefined, 'Operations'),
      label: t('agent_admin.sectionHeartbeat', undefined, 'Heartbeat & Queue'),
      icon: <ActivityIcon size={16} weight="duotone" />,
      title: t('agent_admin.sectionHeartbeat', undefined, 'Heartbeat & Queue'),
      sectionDescription: 'Agent heartbeat and the queue of scheduled agent runs.',
      permission: 'scheduler.manage_own',
      render: () => <AgentHeartbeatSection />,
    },
```

> Use an existing pulse/activity icon from `@/lib/icons` (`ActivityIcon` or similar — grep first).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test -- AgentHeartbeatSection`
Expected: PASS.

- [ ] **Step 5: Typecheck + full module test sweep**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web test -- agent-admin`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/agent-admin/components/queue/ apps/web/src/modules/agent-admin/sections/AgentHeartbeatSection.tsx apps/web/src/modules/agent-admin/sections/AgentHeartbeatSection.test.tsx apps/web/src/modules/agent-admin/AgentAdminPage.tsx
git commit -m "feat(agent-admin): heartbeat control and scheduled-activations queue"
```

---

## Final verification (after all phases)

- [ ] Run `pnpm --filter @oktavius/web typecheck` → PASS.
- [ ] Run `pnpm --filter @oktavius/web lint` → PASS (no `Select`, no `window.confirm`, icons only from `@/lib/icons`).
- [ ] Run `pnpm --filter @oktavius/web test -- agent-admin` → all PASS.
- [ ] Run `pnpm --filter @oktavius/i18n validate` → PASS.
- [ ] Manual smoke (optional, `/run` skill): visit `/agent`, switch sections via `?section=`, confirm `/settings?section=ai` redirects, confirm a non-superadmin without `scheduler.*` sees only the permitted sections.

## Open items to confirm during implementation

- **Permission keys**: verify whether the v3 bootstrap emits `scheduler.view`/`scheduler.manage_own`/`scheduler.manage_org`/`agent-admin.view`. If absent, sections degrade to superadmin-only (acceptable). Note this in the PR description.
- **Org-users source** for integration grants (Task 2.3 rule 5) — locate the v3 member-options hook.
- **Conversation deep-link** for run→chat links (Task 3.3 rule 6).
- **Runtime timezone** accessor for heartbeat activate (Task 4.2).
