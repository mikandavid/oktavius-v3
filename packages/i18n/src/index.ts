export type {
  LanguageCode,
  InterpolationParams,
  TranslateFunction,
  I18nOverridesSource,
} from './types';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from './types';
export { interpolate, extractVars } from './interpolate';
export {
  loadNamespace,
  loadNamespaces,
  coreTranslations,
  CORE_NAMESPACES,
  LAZY_NAMESPACES,
  ALL_NAMESPACES,
} from './translations';
export type { TranslationNamespace } from './generated-namespaces';
