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
