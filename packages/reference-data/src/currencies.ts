import { countries } from 'countries-list';

import { toDisplayLocale } from './locale';

export const CURRENCY_CODES = [
  ...new Set(Object.values(countries).flatMap((country) => country.currency)),
].sort();

export interface CurrencyOption {
  value: string;
  label: string;
  keywords?: string[];
}

export function getCurrencyDisplayName(code: string, locale = 'en-GB'): string {
  const normalized = code.toUpperCase();
  try {
    return (
      new Intl.DisplayNames([toDisplayLocale(locale)], { type: 'currency' }).of(normalized) ??
      normalized
    );
  } catch {
    return normalized;
  }
}

export function buildCurrencyOptions(locale = 'en-GB'): CurrencyOption[] {
  const displayLocale = toDisplayLocale(locale);

  return CURRENCY_CODES.map((code) => {
    const name = getCurrencyDisplayName(code, displayLocale);
    return {
      value: code,
      label: `${code} — ${name}`,
      keywords: [code, name],
    };
  }).sort((left, right) => left.label.localeCompare(right.label, displayLocale));
}

export const DEFAULT_CURRENCY_OPTIONS = buildCurrencyOptions('de-AT');
