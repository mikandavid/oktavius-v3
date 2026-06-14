import { SettingsRow } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { AutosaveStatus } from './AutosaveStatus';

/** Standard control widths shared across all settings tabs. */
export const INPUT_WIDTH = 'w-full sm:w-[24rem]';
export const SHORT_INPUT_WIDTH = 'w-full sm:w-[12rem]';
export const CONTROL_WIDTH = 'w-full sm:w-[14rem]';

export type SettingsAutosaveFooterProps = {
  saving: boolean;
  savedAt: number | null;
  savingLabel?: string;
  savedLabel?: string;
};

/** Single, standard autosave footer for every settings section. */
export function SettingsAutosaveFooter({
  saving,
  savedAt,
  savingLabel,
  savedLabel,
}: SettingsAutosaveFooterProps) {
  return (
    <div className="flex min-h-[1.25rem] justify-end border-t border-border/50 pt-4">
      <AutosaveStatus
        saving={saving}
        savedAt={savedAt}
        savingLabel={savingLabel}
        savedLabel={savedLabel}
      />
    </div>
  );
}

/** One captioned input inside a PackedRow. The caption labels the control. */
export function PackedField({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{caption}</span>
      {children}
    </label>
  );
}

/** A SettingsRow whose control area holds two captioned inputs side-by-side. */
export function PackedRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <SettingsRow label={label} description={description} layout="stacked">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">{children}</div>
    </SettingsRow>
  );
}
