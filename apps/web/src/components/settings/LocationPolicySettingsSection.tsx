import { MultiSelect, SettingsRow, SettingsSection, Switch } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import type { OsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { INPUT_WIDTH, SettingsAutosaveFooter } from './settingsForm';
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
    <SettingsSection
      title={s('locationsTitle', 'Locations')}
      description={s(
        'locationsDescription',
        'Manage organization locations and control where location-owned data is created and visible.',
      )}
      className="border-b border-border/50 pb-5"
    >
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
        align="start"
      >
        <div className={INPUT_WIDTH}>
          <MultiSelect
            options={SHARED_MODULE_OPTIONS}
            value={settings.locations.sharedModules}
            onChange={(value) => updateLocations('sharedModules', value)}
            placeholder={s('sharedLocationModulesPlaceholder', 'Select modules…')}
            searchPlaceholder={s('sharedLocationModulesSearch', 'Search modules…')}
          />
        </div>
      </SettingsRow>
      <SettingsAutosaveFooter
        saving={saving}
        savedAt={savedAt}
        savingLabel={t('common.saving', undefined, 'Saving…')}
        savedLabel={s('saved', 'Saved')}
      />
    </SettingsSection>
  );
}
