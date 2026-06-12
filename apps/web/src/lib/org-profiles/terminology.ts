import { presetFor } from './presets';
import type { OrgProfile, OrgTerminology } from './types';

const FALLBACK_LOCALE = 'en';

const warnedMissingKeys = new Set<string>();

function warnMissingTranslation(industryKey: string, locale: string, termKey: string) {
  const key = `term:${industryKey}:${locale}:${termKey}`;
  if (warnedMissingKeys.has(key)) return;
  warnedMissingKeys.add(key);
  console.warn(
    `[i18n] Missing ${industryKey}/${locale} org terminology for "${termKey}". Falling back to ${FALLBACK_LOCALE}.`,
  );
}

export function getLocalizedTerminology(
  profile: OrgProfile,
  locale: string | undefined,
): OrgTerminology {
  const preset = presetFor(profile.industryKey);
  const fallback = preset.terminologyByLocale[FALLBACK_LOCALE] ?? {};
  const localized = locale ? preset.terminologyByLocale[locale] : undefined;

  const result: OrgTerminology = { ...fallback };
  if (!localized) {
    if (locale && locale !== FALLBACK_LOCALE && import.meta.env.DEV) {
      const key = `locale:${profile.industryKey}:${locale}`;
      if (!warnedMissingKeys.has(key)) {
        warnedMissingKeys.add(key);
        console.warn(
          `[i18n] Unknown locale "${locale}" requested for org terminology; falling back to "${FALLBACK_LOCALE}".`,
        );
      }
    }
    return result;
  }

  for (const key of Object.keys(fallback)) {
    const value = localized[key];
    if (!value) {
      warnMissingTranslation(profile.industryKey, locale ?? FALLBACK_LOCALE, key);
      continue;
    }
    result[key] = value;
  }

  return result;
}

/**
 * Resolves everything locale- and preset-dependent on a profile: terminology,
 * brand title, and dashboard variant. Components consume only the result.
 */
export function getLocalizedOrgProfile(
  profile: OrgProfile,
  locale: string | undefined,
): OrgProfile {
  const preset = presetFor(profile.industryKey);
  return {
    ...profile,
    terminology: getLocalizedTerminology(profile, locale),
    brandTitle: profile.brandTitle ?? (preset.brandTitleFromOrgName ? profile.name : undefined),
    dashboardVariant: profile.dashboardVariant ?? preset.dashboardVariant,
    navPaths: profile.navPaths ?? preset.navPaths,
  };
}
