import { Combobox } from '@oktavius/base-ui';

import { useI18n, useTranslation } from '@/core/i18n';
import { UI_LOCALE_OPTIONS, useUserPreferences, type UiLocale } from '@/lib/userPreferences';
import { appToast } from '@/lib/toast';

type LanguageSelectorProps = {
  className?: string;
};

/** Standalone locale picker for settings pages — mirrors header account menu options. */
export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale } = useUserPreferences();
  const { setLanguage } = useI18n();
  const { t } = useTranslation();

  return (
    <Combobox
      value={locale}
      onChange={(value) => {
        if (!value) return;
        const next = value as UiLocale;
        setLocale(next);
        void setLanguage(next);
        appToast.success(t('settings.languageUpdated', undefined, 'Language updated.'));
      }}
      options={UI_LOCALE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      className={className ?? 'w-[200px]'}
      aria-label={t('settings.interfaceLanguage', undefined, 'Interface language')}
    />
  );
}
