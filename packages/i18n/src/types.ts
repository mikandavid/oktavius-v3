export type LanguageCode = 'de' | 'en';

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['de', 'en'];
export const DEFAULT_LANGUAGE: LanguageCode = 'de';
export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export type InterpolationParams = Record<string, string | number>;

export type TranslateFunction = (
  key: string,
  params?: InterpolationParams,
  defaultValue?: string,
) => string;

export type TranslationNamespace = string;

export interface I18nOverridesSource {
  industryKey?: string | null;
  organizationId?: string | null;
}
