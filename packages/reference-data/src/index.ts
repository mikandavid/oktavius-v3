export {
  buildCountryOptions,
  COUNTRY_CODES,
  type CountryCode,
  type CountryMetadata,
  type CountryOption,
  DEFAULT_ADDRESS_COUNTRY_OPTIONS,
  getCountryDisplayName,
  getCountryMetadata,
  getPrimaryDialCode,
  isCountryCode,
  normalizeCountryCode,
} from './countries';
export {
  buildCurrencyOptions,
  CURRENCY_CODES,
  type CurrencyOption,
  DEFAULT_CURRENCY_OPTIONS,
  getCurrencyDisplayName,
} from './currencies';
export {
  buildVocabularyOptions,
  coerceVocabularyValue,
  formatVocabularyDisplay,
  getVocabularyDefinition,
  getVocabularyLabel,
  isVocabularyCode,
  normalizeVocabularyCode,
  VOCABULARY_REGISTRY,
} from './domain';
export {
  CLIENT_STATUS_BADGE_LABEL,
  CLIENT_STATUS_VOCABULARY,
  CLIENT_STATUSES,
  CLIENT_TYPE_VOCABULARY,
  CLIENT_TYPES,
  type ClientStatus,
  type ClientType,
  LEGACY_CLIENT_STATUS_TO_CODE,
  LEGACY_CLIENT_TYPE_TO_CODE,
  PAYMENT_TERMS,
  PAYMENT_TERMS_VOCABULARY,
  type PaymentTerms,
} from './domain/business';
export { PARTY_ROLE_VOCABULARY, PARTY_ROLES, type PartyRole } from './domain/contact';
export {
  ACADEMIC_TITLE_VOCABULARY,
  ACADEMIC_TITLES,
  type AcademicTitle,
  MARITAL_STATUS_VOCABULARY,
  MARITAL_STATUSES,
  type MaritalStatus,
  type Religion,
  RELIGION_VOCABULARY,
  RELIGIONS,
  type Salutation,
  SALUTATION_VOCABULARY,
  SALUTATIONS,
} from './domain/person';
export type { CoercedVocabularyValue, VocabularyKey, VocabularyOption } from './domain/types';
export {
  DACH_COUNTRY_CODES,
  PHONE_PRIORITY_CODES,
  prioritizeCodes,
  type ReferenceDataMode,
  toDisplayLocale,
} from './locale';
export {
  buildPhoneCountries,
  DEFAULT_PHONE_COUNTRIES,
  findPhoneCountryByCode,
  findPhoneCountryByDialCode,
  formatPhoneValue,
  type PhoneCountry,
  sanitizePhoneLocalInput,
  splitPhoneValue,
} from './phone';
export {
  getPostalCodeFormat,
  getPostalCodeInputMode,
  getPostalCodeMaxLength,
  type PostalCodeFormat,
  sanitizePostalCodeInput,
} from './postal-code';
