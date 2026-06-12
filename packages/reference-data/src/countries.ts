import { countries, getCountryCode } from 'countries-list';

import {
  DACH_COUNTRY_CODES,
  prioritizeCodes,
  toDisplayLocale,
  type ReferenceDataMode,
} from './locale';

export const COUNTRY_CODES = Object.keys(countries)
  .filter((code) => /^[A-Z]{2}$/.test(code))
  .sort();

export type CountryCode = (typeof COUNTRY_CODES)[number];

export interface CountryMetadata {
  code: string;
  name: string;
  native: string;
  phone: number[];
  currency: string[];
  continent: string;
  capital: string;
}

export interface CountryOption {
  value: string;
  label: string;
  /** Extra search text (native name, alternate locale, ISO code). */
  description?: string;
}

const COUNTRY_METADATA_BY_CODE = new Map<string, CountryMetadata>(
  Object.entries(countries).map(([code, country]) => [
    code,
    {
      code,
      name: country.name,
      native: country.native,
      phone: country.phone,
      currency: country.currency,
      continent: country.continent,
      capital: country.capital,
    },
  ]),
);

const COUNTRY_ALIAS_TO_CODE = new Map<string, string>();

for (const code of COUNTRY_CODES) {
  const country = COUNTRY_METADATA_BY_CODE.get(code);
  const normalizedCode = normalizeLookupValue(code);
  COUNTRY_ALIAS_TO_CODE.set(normalizedCode, code);
  if (!country) continue;
  for (const alias of [country.name, country.native]) {
    const normalizedAlias = normalizeLookupValue(alias);
    if (normalizedAlias) {
      COUNTRY_ALIAS_TO_CODE.set(normalizedAlias, code);
    }
  }
}

function normalizeLookupValue(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[./-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function getCountryMetadata(code: string | null | undefined): CountryMetadata | undefined {
  if (!code) return undefined;
  return COUNTRY_METADATA_BY_CODE.get(code.toUpperCase());
}

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return typeof value === 'string' && COUNTRY_METADATA_BY_CODE.has(value.toUpperCase());
}

export function normalizeCountryCode(value: string | null | undefined): CountryCode | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const upper = trimmed.toUpperCase();
  if (COUNTRY_METADATA_BY_CODE.has(upper)) {
    return upper as CountryCode;
  }

  const fromPackage = getCountryCode(trimmed);
  if (fromPackage && COUNTRY_METADATA_BY_CODE.has(fromPackage)) {
    return fromPackage as CountryCode;
  }

  const aliasMatch = COUNTRY_ALIAS_TO_CODE.get(normalizeLookupValue(trimmed));
  return aliasMatch && COUNTRY_METADATA_BY_CODE.has(aliasMatch)
    ? (aliasMatch as CountryCode)
    : undefined;
}

export function getCountryDisplayName(code: string, locale = 'en-GB'): string {
  const normalized = code.toUpperCase();
  try {
    return (
      new Intl.DisplayNames([toDisplayLocale(locale)], { type: 'region' }).of(normalized) ??
      normalized
    );
  } catch {
    return getCountryMetadata(normalized)?.name ?? normalized;
  }
}

export function buildCountryOptions(
  locale = 'en-GB',
  mode: ReferenceDataMode = 'all',
): CountryOption[] {
  const displayLocale = toDisplayLocale(locale);
  const alternateLocale = displayLocale.startsWith('de') ? 'en-GB' : 'de-AT';
  const orderedCodes =
    mode === 'dach' ? prioritizeCodes(COUNTRY_CODES, DACH_COUNTRY_CODES) : COUNTRY_CODES;

  const prioritized = new Set<string>(mode === 'dach' ? DACH_COUNTRY_CODES : []);
  const prioritizedOptions: CountryOption[] = [];
  const restOptions: CountryOption[] = [];

  for (const code of orderedCodes) {
    const meta = getCountryMetadata(code);
    const label = getCountryDisplayName(code, displayLocale);
    const alternateLabel = getCountryDisplayName(code, alternateLocale);
    const option: CountryOption = {
      value: code,
      label,
      description: [code, meta?.name, meta?.native, alternateLabel].filter(Boolean).join(' · '),
    };

    if (prioritized.has(code)) {
      prioritizedOptions.push(option);
    } else {
      restOptions.push(option);
    }
  }

  restOptions.sort((left, right) => left.label.localeCompare(right.label, displayLocale));
  return [...prioritizedOptions, ...restOptions];
}

export const DEFAULT_ADDRESS_COUNTRY_OPTIONS = buildCountryOptions('de-AT', 'dach');

export function getPrimaryDialCode(code: string): string | undefined {
  const phone = getCountryMetadata(code)?.phone;
  if (!phone?.length) return undefined;
  return `+${phone[0]}`;
}
