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
    // Loading (or switching orgs) disarms autosave until the next user edit.
    hasEditedRef.current = false;
    setHasEdited(false);
    setSavedAt(null);

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
