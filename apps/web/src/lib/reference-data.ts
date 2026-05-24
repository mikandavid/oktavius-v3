import {
  buildCountryOptions,
  buildCurrencyOptions,
  buildPhoneCountries,
  buildVocabularyOptions,
  formatVocabularyDisplay,
  getCurrencyDisplayName,
  getVocabularyLabel,
  type CountryOption,
  type CurrencyOption,
  type PhoneCountry,
  type ReferenceDataMode,
  type VocabularyKey,
  type VocabularyOption,
} from '@oktavius/reference-data';
import { useMemo } from 'react';

import { useUserPreferences } from '@/lib/userPreferences';

export {
  buildCountryOptions,
  buildCurrencyOptions,
  buildPhoneCountries,
  buildVocabularyOptions,
  formatVocabularyDisplay,
  getCountryDisplayName,
  getCurrencyDisplayName,
  getVocabularyLabel,
  normalizeCountryCode,
  coerceVocabularyValue,
  CLIENT_STATUS_BADGE_LABEL,
  LEGACY_CLIENT_STATUS_TO_CODE,
  LEGACY_CLIENT_TYPE_TO_CODE,
  type CountryOption,
  type CurrencyOption,
  type PhoneCountry,
  type ReferenceDataMode,
  type VocabularyKey,
  type VocabularyOption,
  type ClientStatus,
  type ClientType,
  type PartyRole,
  type Salutation,
} from '@oktavius/reference-data';

const VOCABULARY_KEYS = [
  'salutation',
  'academicTitle',
  'maritalStatus',
  'religion',
  'partyRole',
  'clientType',
  'clientStatus',
  'paymentTerms',
] as const satisfies readonly VocabularyKey[];

export type VocabularyOptionsMap = Record<VocabularyKey, VocabularyOption[]>;

export function useCountryOptions(mode: ReferenceDataMode = 'dach'): CountryOption[] {
  const { locale } = useUserPreferences();
  return useMemo(() => buildCountryOptions(locale, mode), [locale, mode]);
}

export function usePhoneCountries(mode: ReferenceDataMode = 'dach'): PhoneCountry[] {
  const { locale } = useUserPreferences();
  return useMemo(() => buildPhoneCountries(locale, mode), [locale, mode]);
}

export function useCurrencyOptions(): CurrencyOption[] {
  const { locale } = useUserPreferences();
  return useMemo(() => buildCurrencyOptions(locale), [locale]);
}

export function useCountryDisplayName(code: string | null | undefined): string {
  const { locale } = useUserPreferences();
  return useMemo(() => {
    if (!code) return '—';
    return (
      buildCountryOptions(locale, 'all').find((option) => option.value === code)?.label ?? code
    );
  }, [code, locale]);
}

export function useCurrencyDisplayName(code: string | null | undefined): string {
  const { locale } = useUserPreferences();
  return useMemo(() => {
    if (!code) return '—';
    return getCurrencyDisplayName(code, locale);
  }, [code, locale]);
}

export function useVocabularyOptions(key: VocabularyKey): VocabularyOption[] {
  const { locale } = useUserPreferences();
  return useMemo(() => buildVocabularyOptions(key, locale), [key, locale]);
}

export function useVocabularyOptionsMap(): VocabularyOptionsMap {
  const { locale } = useUserPreferences();
  return useMemo(
    () =>
      Object.fromEntries(
        VOCABULARY_KEYS.map((key) => [key, buildVocabularyOptions(key, locale)]),
      ) as VocabularyOptionsMap,
    [locale],
  );
}

export function useVocabularyLabel(key: VocabularyKey, code: string | null | undefined): string {
  const { locale } = useUserPreferences();
  return useMemo(() => getVocabularyLabel(key, code, locale), [code, key, locale]);
}

export function useVocabularyDisplay(
  key: VocabularyKey,
  code: string | null | undefined,
  customValue?: string | null,
): string {
  const { locale } = useUserPreferences();
  return useMemo(
    () => formatVocabularyDisplay(key, code, customValue, locale),
    [code, customValue, key, locale],
  );
}
