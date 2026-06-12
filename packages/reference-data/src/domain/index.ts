import {
  CLIENT_STATUS_VOCABULARY,
  CLIENT_TYPE_VOCABULARY,
  PAYMENT_TERMS_VOCABULARY,
} from './business';
import { PARTY_ROLE_VOCABULARY } from './contact';
import {
  buildAliasMap,
  normalizeFromAliasMap,
  resolveAppLocale,
  resolveLocalizedLabel,
} from './normalize';
import {
  ACADEMIC_TITLE_VOCABULARY,
  MARITAL_STATUS_VOCABULARY,
  RELIGION_VOCABULARY,
  SALUTATION_VOCABULARY,
} from './person';
import type {
  CoercedVocabularyValue,
  VocabularyDefinition,
  VocabularyKey,
  VocabularyOption,
} from './types';

export const VOCABULARY_REGISTRY = {
  salutation: SALUTATION_VOCABULARY,
  academicTitle: ACADEMIC_TITLE_VOCABULARY,
  maritalStatus: MARITAL_STATUS_VOCABULARY,
  religion: RELIGION_VOCABULARY,
  partyRole: PARTY_ROLE_VOCABULARY,
  clientType: CLIENT_TYPE_VOCABULARY,
  clientStatus: CLIENT_STATUS_VOCABULARY,
  paymentTerms: PAYMENT_TERMS_VOCABULARY,
} as const satisfies Record<VocabularyKey, VocabularyDefinition>;

const ALIAS_MAPS = Object.fromEntries(
  Object.entries(VOCABULARY_REGISTRY).map(([key, definition]) => {
    const aliases = Object.entries(definition.aliases ?? {}).map(([code, values]) => ({
      code,
      aliases: values ?? [],
    }));
    return [key, buildAliasMap(aliases)];
  }),
) as Record<VocabularyKey, ReadonlyMap<string, string>>;

export function getVocabularyDefinition(key: VocabularyKey): VocabularyDefinition {
  return VOCABULARY_REGISTRY[key];
}

export function buildVocabularyOptions(key: VocabularyKey, locale = 'en'): VocabularyOption[] {
  const definition = getVocabularyDefinition(key);
  const appLocale = resolveAppLocale(locale);

  return definition.codes.map((code) => ({
    value: code,
    label: resolveLocalizedLabel(definition.labels, code, appLocale),
  }));
}

export function getVocabularyLabel(
  key: VocabularyKey,
  code: string | null | undefined,
  locale = 'en',
): string {
  if (!code) return '';
  const definition = getVocabularyDefinition(key);
  const appLocale = resolveAppLocale(locale);
  return resolveLocalizedLabel(definition.labels, code, appLocale) || code;
}

export function normalizeVocabularyCode(
  key: VocabularyKey,
  value: string | null | undefined,
): string | undefined {
  const definition = getVocabularyDefinition(key);
  const aliasMap = ALIAS_MAPS[key];
  return normalizeFromAliasMap(value, aliasMap, definition.codes);
}

export function isVocabularyCode(key: VocabularyKey, value: string | null | undefined): boolean {
  if (!value) return false;
  const definition = getVocabularyDefinition(key);
  return definition.codes.includes(value);
}

export function coerceVocabularyValue(
  key: VocabularyKey,
  value: string | null | undefined,
  customValue?: string | null,
): CoercedVocabularyValue {
  const definition = getVocabularyDefinition(key);
  const normalizedCustom = customValue?.trim() || undefined;
  const normalizedCode = normalizeVocabularyCode(key, value);

  if (normalizedCode) {
    return { code: normalizedCode, customValue: undefined };
  }

  const raw = value?.trim();
  if (!raw) {
    return { code: undefined, customValue: normalizedCustom };
  }

  if (definition.allowCustom && definition.codes.includes('other')) {
    return { code: 'other', customValue: normalizedCustom ?? raw };
  }

  return { code: undefined, customValue: normalizedCustom ?? raw };
}

export function formatVocabularyDisplay(
  key: VocabularyKey,
  code: string | null | undefined,
  customValue: string | null | undefined,
  locale = 'en',
): string {
  if (!code) return customValue?.trim() ?? '';
  if (code === 'other' && customValue?.trim()) return customValue.trim();
  return getVocabularyLabel(key, code, locale);
}
