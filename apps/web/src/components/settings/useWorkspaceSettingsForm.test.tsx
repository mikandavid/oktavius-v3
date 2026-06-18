// apps/web/src/components/settings/useWorkspaceSettingsForm.test.tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';
import { createDefaultOsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { useWorkspaceSettingsForm, type WorkspaceSettingsForm } from './useWorkspaceSettingsForm';

const defaultSettings = createDefaultOsirisWorkspaceSettings();

const baseRuntime: OsirisRuntimeContextValue = {
  sessionStatus: 'authenticated',
  currentUser: {
    id: 'usr_1',
    email: 'test@example.test',
    fullName: 'Test User',
    isSuperadmin: false,
  },
  organizations: [{ id: 'org_1', name: 'Test Org', slug: 'test-org' }],
  memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
  activeOrgId: 'org_1',
  activeSiteId: null,
  permissions: ['org.manage'],
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: ['org.manage'] },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
  loadWorkspaceSettings: vi.fn(async () => defaultSettings),
  updateWorkspaceSettings: vi.fn(async (settings) => settings),
};

let captured: WorkspaceSettingsForm | null = null;

function Harness() {
  captured = useWorkspaceSettingsForm();
  return null;
}

function HarnessWithRuntime({ runtime }: { runtime: OsirisRuntimeContextValue }) {
  return (
    <OsirisRuntimeContext.Provider value={runtime}>
      <Harness />
    </OsirisRuntimeContext.Provider>
  );
}

describe('useWorkspaceSettingsForm', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    captured = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('exposes settings and marks dirty on change', async () => {
    await act(async () => {
      root.render(<HarnessWithRuntime runtime={baseRuntime} />);
    });

    expect(captured).not.toBeNull();
    expect(captured!.settings.aiUsage).toBeDefined();
    expect(captured!.saving).toBe(false);

    act(() => {
      captured!.onChange({
        ...captured!.settings,
        aiUsage: { ...captured!.settings.aiUsage, hardLimitPercent: 90 },
      });
    });

    expect(captured!.settings.aiUsage.hardLimitPercent).toBe(90);
  });

  it('loads settings from runtime on mount', async () => {
    const loadedSettings = createDefaultOsirisWorkspaceSettings({
      aiUsage: { hardLimitPercent: 75, warningThresholdPercent: 50, overageAllowed: false },
    });
    const runtime: OsirisRuntimeContextValue = {
      ...baseRuntime,
      loadWorkspaceSettings: vi.fn(async () => loadedSettings),
      updateWorkspaceSettings: vi.fn(async (settings) => settings),
      reload: vi.fn(async () => {}),
    };

    await act(async () => {
      root.render(<HarnessWithRuntime runtime={runtime} />);
    });

    expect(runtime.loadWorkspaceSettings).toHaveBeenCalledWith('org_1');
    expect(captured!.settings.aiUsage.hardLimitPercent).toBe(75);
  });

  it('autosaves after debounce when user edits', async () => {
    await act(async () => {
      root.render(<HarnessWithRuntime runtime={baseRuntime} />);
    });

    act(() => {
      captured!.onChange({
        ...captured!.settings,
        aiUsage: { ...captured!.settings.aiUsage, hardLimitPercent: 80 },
      });
    });

    expect(baseRuntime.updateWorkspaceSettings).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(baseRuntime.updateWorkspaceSettings).toHaveBeenCalledTimes(1);
    expect(baseRuntime.updateWorkspaceSettings).toHaveBeenCalledWith(
      expect.objectContaining({ aiUsage: expect.objectContaining({ hardLimitPercent: 80 }) }),
      'org_1',
    );
  });

  it('does not autosave if user has not edited', async () => {
    await act(async () => {
      root.render(<HarnessWithRuntime runtime={baseRuntime} />);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(baseRuntime.updateWorkspaceSettings).not.toHaveBeenCalled();
  });

  it('exposes savedAt after a successful save', async () => {
    await act(async () => {
      root.render(<HarnessWithRuntime runtime={baseRuntime} />);
    });

    expect(captured!.savedAt).toBeNull();

    act(() => {
      captured!.onChange({
        ...captured!.settings,
        aiUsage: { ...captured!.settings.aiUsage, hardLimitPercent: 55 },
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(captured!.savedAt).not.toBeNull();
  });
});
