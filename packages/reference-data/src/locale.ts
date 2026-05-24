/** DACH + common neighbours shown first in compact pickers. */
export const DACH_COUNTRY_CODES = ['AT', 'DE', 'CH', 'IT', 'FR', 'NL'] as const;

/** Default phone picker order (includes common international codes). */
export const PHONE_PRIORITY_CODES = ['AT', 'DE', 'CH', 'IT', 'FR', 'NL', 'GB', 'US'] as const;

export type ReferenceDataMode = 'dach' | 'all';

const LOCALE_MAP: Record<string, string> = {
  de: 'de-AT',
  en: 'en-GB',
  fr: 'fr-FR',
};

/** Map short app locale keys to BCP 47 tags for Intl formatters. */
export function toDisplayLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? locale;
}

export function prioritizeCodes(all: readonly string[], priority: readonly string[]): string[] {
  const available = new Set(all);
  const prioritized = priority.filter((code) => available.has(code));
  const rest = all.filter((code) => !priority.includes(code));
  return [...prioritized, ...rest];
}
