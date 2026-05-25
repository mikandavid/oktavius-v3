import {
  COUNTRY_CODES,
  getCountryDisplayName,
  getPrimaryDialCode,
} from './countries';
import { PHONE_PRIORITY_CODES, prioritizeCodes, toDisplayLocale, type ReferenceDataMode } from './locale';

export interface PhoneCountry {
  code: string;
  dialCode: string;
  label: string;
}

function buildPhoneCountry(code: string, locale: string): PhoneCountry | undefined {
  const dialCode = getPrimaryDialCode(code);
  if (!dialCode) return undefined;

  const displayLocale = toDisplayLocale(locale);
  const countryName = getCountryDisplayName(code, displayLocale);
  return {
    code,
    dialCode,
    label: `${countryName} (${dialCode})`,
  };
}

export function buildPhoneCountries(
  locale = 'en-GB',
  mode: ReferenceDataMode = 'dach',
): PhoneCountry[] {
  const codesWithPhone = COUNTRY_CODES.filter((code) => getPrimaryDialCode(code));
  const orderedCodes =
    mode === 'dach'
      ? prioritizeCodes(codesWithPhone, PHONE_PRIORITY_CODES)
      : codesWithPhone;

  return orderedCodes
    .map((code) => buildPhoneCountry(code, locale))
    .filter((country): country is PhoneCountry => country !== undefined);
}

export function findPhoneCountryByCode(
  countries: PhoneCountry[],
  code: string | undefined,
): PhoneCountry | undefined {
  if (!code) return undefined;
  return countries.find((country) => country.code === code.toUpperCase());
}

export function findPhoneCountryByDialCode(
  countries: PhoneCountry[],
  dialCode: string | undefined,
): PhoneCountry | undefined {
  if (!dialCode) return undefined;
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return countries.find((country) => country.dialCode === normalized);
}

export function splitPhoneValue(value: string, countries: PhoneCountry[]) {
  const trimmed = value.trim();
  const fallback = countries[0];

  if (!trimmed) {
    return {
      countryCode: fallback?.code ?? 'AT',
      dialCode: fallback?.dialCode ?? '+43',
      local: '',
    };
  }

  const match = countries
    .slice()
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((country) => trimmed.startsWith(country.dialCode));

  if (match) {
    return {
      countryCode: match.code,
      dialCode: match.dialCode,
      local: trimmed.slice(match.dialCode.length).trim(),
    };
  }

  return {
    countryCode: fallback?.code ?? 'AT',
    dialCode: fallback?.dialCode ?? '+43',
    local: trimmed,
  };
}

/** Keep only digits and spacing in the local phone number part. */
export function sanitizePhoneLocalInput(local: string): string {
  return local.replace(/[^\d\s]/g, '');
}

export function formatPhoneValue(dialCode: string, local: string): string {
  const formattedLocal = sanitizePhoneLocalInput(local).replace(/\s+/g, ' ').trim();
  if (!formattedLocal) return '';
  return `${dialCode} ${formattedLocal}`.trim();
}

export const DEFAULT_PHONE_COUNTRIES = buildPhoneCountries('de-AT', 'dach');
