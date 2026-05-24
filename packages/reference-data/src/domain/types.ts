export type AppLocale = 'de' | 'en' | 'fr';

export type LocalizedLabel = Record<AppLocale, string>;

export interface VocabularyOption {
  value: string;
  label: string;
  description?: string;
}

export interface VocabularyDefinition<TCode extends string = string> {
  codes: readonly TCode[];
  labels: Record<TCode, LocalizedLabel>;
  aliases?: Partial<Record<TCode, readonly string[]>>;
  /** When true, unknown raw values coerce to `other` (if present). */
  allowCustom?: boolean;
}

export type VocabularyKey =
  | 'salutation'
  | 'academicTitle'
  | 'maritalStatus'
  | 'religion'
  | 'partyRole'
  | 'clientType'
  | 'clientStatus'
  | 'paymentTerms';

export interface CoercedVocabularyValue<TCode extends string = string> {
  code: TCode | undefined;
  customValue?: string;
}
