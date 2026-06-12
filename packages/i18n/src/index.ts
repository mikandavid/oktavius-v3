export type { TranslationNamespace } from './generated-namespaces';
export { extractVars,interpolate } from './interpolate';
export {
  ALL_NAMESPACES,
  CORE_NAMESPACES,
  coreTranslations,
  LAZY_NAMESPACES,
  loadNamespace,
  loadNamespaces,
} from './translations';
export type {
  I18nOverridesSource,
  InterpolationParams,
  LanguageCode,
  TranslateFunction,
} from './types';
export { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE,SUPPORTED_LANGUAGES } from './types';
