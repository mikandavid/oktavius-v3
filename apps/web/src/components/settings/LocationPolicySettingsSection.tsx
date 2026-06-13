import { MultiSelect, SettingsRow, Switch } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import type { OsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { AutosaveStatus } from './AutosaveStatus';
import { SHARED_MODULE_OPTIONS } from './sharedModuleOptions';

type LocationPolicySettingsSectionProps = {
  settings: OsirisWorkspaceSettings;
  saving: boolean;
  savedAt: number | null;
  onChange: (settings: OsirisWorkspaceSettings) => void;
};

export function LocationPolicySettingsSection({
  settings,
  saving,
  savedAt,
  onChange,
}: LocationPolicySettingsSectionProps) {
  const { t } = useTranslation();
  const s = (key: string, fallback: string) => t(`settings.${key}`, undefined, fallback);

  const updateLocations = <Key extends keyof OsirisWorkspaceSettings['locations']>(
    key: Key,
    value: OsirisWorkspaceSettings['locations'][Key],
  ) => {
    onChange({
      ...settings,
      locations: {
        ...settings.locations,
        [key]: value,
      },
    });
  };

  return (
    <section className="space-y-2 border-b border-border/50 pb-5">
      <div>
        <h4 className="text-sm font-semibold text-foreground">
          {s('locationsTitle', 'Locations')}
        </h4>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {s(
            'locationsDescription',
            'Manage organization locations and control where location-owned data is created and visible.',
          )}
        </p>
      </div>
      <SettingsRow
        label={s('locationEnforcementEnabled', 'Location enforcement')}
        description={s(
          'locationEnforcementDescription',
          'When enabled, location-owned modules are filtered and validated against member location access.',
        )}
      >
        <Switch
          checked={settings.locations.enforcementEnabled}
          onCheckedChange={(checked) => updateLocations('enforcementEnabled', checked)}
        />
      </SettingsRow>
      <SettingsRow
        label={s('sharedLocationModules', 'Org-shared modules')}
        description={s(
          'sharedLocationModulesDescription',
          'Modules that stay organization-wide instead of being scoped to a location.',
        )}
        layout="stacked"
      >
        <MultiSelect
          options={SHARED_MODULE_OPTIONS}
          value={settings.locations.sharedModules}
          onChange={(value) => updateLocations('sharedModules', value)}
          placeholder={s('sharedLocationModulesPlaceholder', 'Select modules…')}
          searchPlaceholder={s('sharedLocationModulesSearch', 'Search modules…')}
        />
      </SettingsRow>
      <div className="flex min-h-[1.25rem] justify-end pt-2">
        <AutosaveStatus
          saving={saving}
          savedAt={savedAt}
          savingLabel={t('common.saving', undefined, 'Saving…')}
          savedLabel={s('saved', 'Saved')}
        />
      </div>
    </section>
  );
}
