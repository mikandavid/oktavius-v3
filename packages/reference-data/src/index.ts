export {
  COUNTRY_CODES,
  DEFAULT_ADDRESS_COUNTRY_OPTIONS,
  buildCountryOptions,
  getCountryDisplayName,
  getCountryMetadata,
  getPrimaryDialCode,
  isCountryCode,
  normalizeCountryCode,
  type CountryCode,
  type CountryMetadata,
  type CountryOption,
} from './countries';

export {
  DEFAULT_PHONE_COUNTRIES,
  buildPhoneCountries,
  findPhoneCountryByCode,
  findPhoneCountryByDialCode,
  formatPhoneValue,
  sanitizePhoneLocalInput,
  splitPhoneValue,
  type PhoneCountry,
} from './phone';

export {
  getPostalCodeFormat,
  getPostalCodeInputMode,
  getPostalCodeMaxLength,
  sanitizePostalCodeInput,
  type PostalCodeFormat,
} from './postal-code';

export {
  CURRENCY_CODES,
  DEFAULT_CURRENCY_OPTIONS,
  buildCurrencyOptions,
  getCurrencyDisplayName,
  type CurrencyOption,
} from './currencies';

export {
  DACH_COUNTRY_CODES,
  PHONE_PRIORITY_CODES,
  prioritizeCodes,
  toDisplayLocale,
  type ReferenceDataMode,
} from './locale';

export {
  ACADEMIC_TITLES,
  ACADEMIC_TITLE_VOCABULARY,
  MARITAL_STATUSES,
  MARITAL_STATUS_VOCABULARY,
  RELIGIONS,
  RELIGION_VOCABULARY,
  SALUTATIONS,
  SALUTATION_VOCABULARY,
  type AcademicTitle,
  type MaritalStatus,
  type Religion,
  type Salutation,
} from './domain/person';

export {
  PARTY_ROLES,
  PARTY_ROLE_VOCABULARY,
  type PartyRole,
} from './domain/contact';

export {
  CLIENT_STATUSES,
  CLIENT_STATUS_BADGE_LABEL,
  CLIENT_STATUS_VOCABULARY,
  CLIENT_TYPES,
  CLIENT_TYPE_VOCABULARY,
  LEGACY_CLIENT_STATUS_TO_CODE,
  LEGACY_CLIENT_TYPE_TO_CODE,
  PAYMENT_TERMS,
  PAYMENT_TERMS_VOCABULARY,
  type ClientStatus,
  type ClientType,
  type PaymentTerms,
} from './domain/business';

export {
  VOCABULARY_REGISTRY,
  buildVocabularyOptions,
  coerceVocabularyValue,
  formatVocabularyDisplay,
  getVocabularyDefinition,
  getVocabularyLabel,
  isVocabularyCode,
  normalizeVocabularyCode,
} from './domain';

export type {
  CoercedVocabularyValue,
  VocabularyKey,
  VocabularyOption,
} from './domain/types';
