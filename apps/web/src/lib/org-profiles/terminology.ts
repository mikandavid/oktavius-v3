import type { UiLocale } from '@/lib/userPreferences';

import type { OrgIndustryKey, OrgProfile, OrgTerminology } from './types';

const FALLBACK_LOCALE: UiLocale = 'en';

const TERMINOLOGY_BY_INDUSTRY: Record<OrgIndustryKey, Record<UiLocale, OrgTerminology>> = {
  generic: {
    en: {
      cases: 'Cases',
      casesSingular: 'Case',
      clients: 'Clients',
      clientsSingular: 'Client',
      products: 'Products',
      orders: 'Orders',
      projects: 'Projects',
      documents: 'Documents',
      dashboard: 'Dashboard',
    },
    de: {
      cases: 'Fälle',
      casesSingular: 'Fall',
      clients: 'Kontakte',
      clientsSingular: 'Kontakt',
      products: 'Produkte',
      orders: 'Aufträge',
      projects: 'Projekte',
      documents: 'Ablage',
      dashboard: 'Übersicht',
    },
    fr: {
      cases: 'Cas',
      casesSingular: 'Cas',
      clients: 'Clients',
      clientsSingular: 'Client',
      products: 'Produits',
      orders: 'Commandes',
      projects: 'Projets',
      documents: 'Documents',
      dashboard: 'Tableau de bord',
    },
  },
  funeral: {
    en: {
      cases: 'Cases',
      casesSingular: 'Case',
      clients: 'Contacts',
      clientsSingular: 'Contact',
      products: 'Products',
      orders: 'Sales',
      projects: 'Bereavement cases',
      documents: 'Storage',
      dashboard: 'Overview',
    },
    de: {
      cases: 'Sterbefälle',
      casesSingular: 'Sterbefall',
      clients: 'Kontakte',
      clientsSingular: 'Kontakt',
      products: 'Katalog',
      orders: 'Verkauf',
      projects: 'Trauerfälle',
      documents: 'Ablage',
      dashboard: 'Übersicht',
    },
    fr: {
      cases: 'Dossiers',
      casesSingular: 'Dossier',
      clients: 'Contacts',
      clientsSingular: 'Contact',
      products: 'Catalogue',
      orders: 'Ventes',
      projects: 'Dossiers de deuil',
      documents: 'Stockage',
      dashboard: 'Aperçu',
    },
  },
};

const warnedMissingKeys = new Set<string>();

function isKnownLocale(locale: string | undefined): locale is UiLocale {
  return locale === 'en' || locale === 'de' || locale === 'fr';
}

function normalizeLocale(locale: string | undefined): UiLocale {
  if (isKnownLocale(locale)) return locale;
  if (import.meta.env.DEV) {
    const key = `locale:${locale}`;
    if (!warnedMissingKeys.has(key)) {
      warnedMissingKeys.add(key);
      console.warn(
        `[i18n] Unknown locale "${locale}" requested for org terminology; falling back to "${FALLBACK_LOCALE}".`,
      );
    }
  }
  return FALLBACK_LOCALE;
}

function warnMissingTranslation(
  industryKey: OrgIndustryKey,
  locale: UiLocale,
  termKey: keyof OrgTerminology,
) {
  const key = `term:${industryKey}:${locale}:${termKey}`;
  if (warnedMissingKeys.has(key)) return;
  warnedMissingKeys.add(key);
  console.warn(
    `[i18n] Missing ${industryKey}/${locale} org terminology for "${termKey}". Falling back to ${FALLBACK_LOCALE}.`,
  );
}

function getFallbackTerminology(industryKey: OrgIndustryKey): OrgTerminology {
  return TERMINOLOGY_BY_INDUSTRY[industryKey][FALLBACK_LOCALE];
}

export function getLocalizedTerminology(
  profile: OrgProfile,
  locale: string | undefined,
): OrgTerminology {
  const language = normalizeLocale(locale);
  const catalog = TERMINOLOGY_BY_INDUSTRY[profile.industryKey];
  const fallback = getFallbackTerminology(profile.industryKey);
  const localized = catalog[language] ?? catalog[FALLBACK_LOCALE];

  const result: OrgTerminology = { ...fallback };
  if (!catalog[language]) {
    warnMissingTranslation(profile.industryKey, language, 'cases');
    return result;
  }

  for (const key of Object.keys(fallback) as Array<keyof OrgTerminology>) {
    const value = localized[key];
    if (!value) {
      warnMissingTranslation(profile.industryKey, language, key);
      continue;
    }
    result[key] = value;
  }

  return result;
}

export function getLocalizedOrgProfile(
  profile: OrgProfile,
  locale: string | undefined,
): OrgProfile {
  const terminology = getLocalizedTerminology(profile, locale);
  return { ...profile, terminology };
}
