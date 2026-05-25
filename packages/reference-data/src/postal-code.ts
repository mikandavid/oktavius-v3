/** ISO 3166-1 alpha-2 codes that use digits-only postal codes. */
const NUMERIC_POSTAL_COUNTRIES = new Set([
  'AT',
  'DE',
  'CH',
  'LI',
  'BE',
  'DK',
  'NO',
  'SE',
  'FI',
  'FR',
  'ES',
  'IT',
  'PT',
  'PL',
  'CZ',
  'SK',
  'HU',
  'RO',
  'BG',
  'GR',
  'HR',
  'SI',
  'LT',
  'LV',
  'EE',
  'LU',
  'MT',
  'CY',
  'TR',
  'IN',
  'CN',
  'KR',
  'TW',
  'SG',
  'MY',
  'TH',
  'PH',
  'ID',
  'VN',
  'RU',
  'UA',
  'BY',
  'KZ',
  'SA',
  'AE',
  'IL',
  'ZA',
  'MX',
  'AR',
  'CL',
  'CO',
  'PE',
  'EG',
  'NG',
  'KE',
]);

/** Max input length per country (without formatting spaces/hyphens). */
const POSTAL_MAX_LENGTH: Record<string, number> = {
  AT: 4,
  DE: 5,
  CH: 4,
  LI: 4,
  US: 10,
  GB: 8,
  CA: 7,
  NL: 7,
  JP: 7,
  AU: 4,
  NZ: 4,
  FR: 5,
  ES: 5,
  IT: 5,
  PL: 6,
  CZ: 6,
  SK: 6,
  HU: 4,
  SE: 6,
  NO: 4,
  DK: 4,
  FI: 5,
  BE: 4,
  PT: 8,
};

export type PostalCodeFormat = 'numeric' | 'alphanumeric';

export function getPostalCodeFormat(countryCode?: string): PostalCodeFormat {
  const code = countryCode?.trim().toUpperCase() ?? '';
  if (!code) return 'alphanumeric';
  return NUMERIC_POSTAL_COUNTRIES.has(code) ? 'numeric' : 'alphanumeric';
}

export function getPostalCodeInputMode(countryCode?: string): 'numeric' | 'text' {
  return getPostalCodeFormat(countryCode) === 'numeric' ? 'numeric' : 'text';
}

export function getPostalCodeMaxLength(countryCode?: string): number | undefined {
  const code = countryCode?.trim().toUpperCase() ?? '';
  return code ? POSTAL_MAX_LENGTH[code] : undefined;
}

/** Strip characters that do not belong in a postal code for the selected country. */
export function sanitizePostalCodeInput(value: string, countryCode?: string): string {
  const format = getPostalCodeFormat(countryCode);
  let sanitized =
    format === 'numeric'
      ? value.replace(/\D/g, '')
      : value.replace(/[^A-Za-z0-9\s-]/g, '').toUpperCase();

  const maxLength = getPostalCodeMaxLength(countryCode);
  if (maxLength != null && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}
