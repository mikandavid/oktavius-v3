import { Combobox } from '@oktavius/base-ui';

import { UI_LOCALE_OPTIONS, useUserPreferences, type UiLocale } from '@/lib/userPreferences';
import { appToast } from '@/lib/toast';

type LanguageSelectorProps = {
  className?: string;
};

/** Standalone locale picker for settings pages — mirrors header account menu options. */
export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale } = useUserPreferences();

  return (
    <Combobox
      value={locale}
      onChange={(value) => {
        if (!value) return;
        setLocale(value as UiLocale);
        appToast.success('Language updated.');
      }}
      options={UI_LOCALE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      className={className ?? 'w-[200px]'}
      aria-label="Interface language"
    />
  );
}
