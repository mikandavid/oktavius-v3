import {
  Button,
  Combobox,
  type ComboboxOption,
  SettingsRow,
  SettingsSection,
  Switch,
  Textarea,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { DeleteIcon, PlusIcon } from '@/lib/icons';
import type { OsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { SettingsAutosaveFooter, SHORT_INPUT_WIDTH } from './settingsForm';

type AiSettingsSectionProps = {
  settings: OsirisWorkspaceSettings;
  saving: boolean;
  savedAt: number | null;
  onChange: (settings: OsirisWorkspaceSettings) => void;
};

const AI_USAGE_PERCENT_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** Percent dropdown options; always includes the active value so a stored off-step value stays selectable. */
function percentOptions(active: number): ComboboxOption[] {
  const values = AI_USAGE_PERCENT_STEPS.includes(active)
    ? AI_USAGE_PERCENT_STEPS
    : [...AI_USAGE_PERCENT_STEPS, active].sort((a, b) => a - b);
  return values.map((percent) => ({ value: String(percent), label: `${percent}%` }));
}

function createInstructionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `instruction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AiSettingsSection({ settings, saving, savedAt, onChange }: AiSettingsSectionProps) {
  const { t } = useTranslation();
  const s = (key: string, fallback: string) => t(`settings.${key}`, undefined, fallback);
  const [instructionDraft, setInstructionDraft] = useState('');

  const updateAiUsage = <Key extends keyof OsirisWorkspaceSettings['aiUsage']>(
    key: Key,
    value: OsirisWorkspaceSettings['aiUsage'][Key],
  ) => {
    onChange({
      ...settings,
      aiUsage: {
        ...settings.aiUsage,
        [key]: value,
      },
    });
  };

  const updateInstruction = (
    id: string,
    patch: Partial<OsirisWorkspaceSettings['agent']['customInstructions'][number]>,
  ) => {
    onChange({
      ...settings,
      agent: {
        ...settings.agent,
        customInstructions: settings.agent.customInstructions.map((instruction) =>
          instruction.id === id ? { ...instruction, ...patch } : instruction,
        ),
      },
    });
  };

  const addInstruction = () => {
    const content = instructionDraft.trim();
    if (!content) return;
    onChange({
      ...settings,
      agent: {
        ...settings.agent,
        customInstructions: [
          ...settings.agent.customInstructions,
          { id: createInstructionId(), content, enabled: true },
        ],
      },
    });
    setInstructionDraft('');
  };

  const deleteInstruction = (id: string) => {
    onChange({
      ...settings,
      agent: {
        ...settings.agent,
        customInstructions: settings.agent.customInstructions.filter(
          (instruction) => instruction.id !== id,
        ),
      },
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection title={s('aiUsageTitle', 'AI Usage Budget')}>
        <SettingsRow
          label={s('aiUsageWarningThresholdPercent', 'Warning threshold')}
          description={s(
            'aiUsageWarningThresholdDescription',
            'Notify users once usage reaches this share of the budget.',
          )}
        >
          <Combobox
            value={String(settings.aiUsage.warningThresholdPercent)}
            onChange={(value) => {
              if (value) updateAiUsage('warningThresholdPercent', Number(value));
            }}
            options={percentOptions(settings.aiUsage.warningThresholdPercent)}
            className={SHORT_INPUT_WIDTH}
          />
        </SettingsRow>
        <SettingsRow
          label={s('aiUsageHardLimitPercent', 'Hard limit')}
          description={s(
            'aiUsageHardLimitDescription',
            'Usage stops at this share of the budget unless overage is allowed.',
          )}
        >
          <Combobox
            value={String(settings.aiUsage.hardLimitPercent)}
            onChange={(value) => {
              if (value) updateAiUsage('hardLimitPercent', Number(value));
            }}
            options={percentOptions(settings.aiUsage.hardLimitPercent)}
            className={SHORT_INPUT_WIDTH}
          />
        </SettingsRow>
        <SettingsRow
          label={s('aiUsageOverageAllowed', 'Allow overage')}
          description={s(
            'aiUsageOverageAllowedDescription',
            'When enabled, AI usage continues after the hard threshold and additional estimated costs are shown instead of blocking users.',
          )}
        >
          <Switch
            checked={settings.aiUsage.overageAllowed}
            onCheckedChange={(checked) => updateAiUsage('overageAllowed', checked)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={s('agentInstructions', 'Agent Instructions')}
        className="border-t border-border/50 pt-6"
      >
        <div className="space-y-3">
          {settings.agent.customInstructions.length > 0 ? (
            settings.agent.customInstructions.map((instruction) => (
              <div key={instruction.id} className="rounded-md bg-muted/30 p-3">
                <div className="flex items-start gap-3">
                  <Switch
                    checked={instruction.enabled}
                    onCheckedChange={(enabled) => updateInstruction(instruction.id, { enabled })}
                    aria-label={s('agentInstructionToggle', 'Toggle agent instruction')}
                    className="mt-1"
                  />
                  <Textarea
                    value={instruction.content}
                    className="min-h-[64px] flex-1"
                    onChange={(event) =>
                      updateInstruction(instruction.id, { content: event.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteInstruction(instruction.id)}
                    aria-label={s('agentInstructionDelete', 'Delete agent instruction')}
                  >
                    <DeleteIcon size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {s('agentInstructionsEmpty', 'No org-wide agent instructions configured.')}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Textarea
              value={instructionDraft}
              className="min-h-[64px] flex-1"
              placeholder={s('agentInstructionAddPlaceholder', 'Add a new global instruction...')}
              onChange={(event) => setInstructionDraft(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={!instructionDraft.trim()}
              onClick={addInstruction}
            >
              <PlusIcon size={14} aria-hidden="true" />
              {t('common.add')}
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsAutosaveFooter
        saving={saving}
        savedAt={savedAt}
        savingLabel={t('common.saving', undefined, 'Saving…')}
        savedLabel={s('saved', 'Saved')}
      />
    </div>
  );
}
