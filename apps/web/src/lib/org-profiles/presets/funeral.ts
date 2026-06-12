import type { OrgProfilePreset } from './types';

export const FUNERAL_PRESET: OrgProfilePreset = {
  terminologyByLocale: {
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
  /** Sidebar links map onto the Osiris funeral module URLs. */
  navPaths: {
    cases: '/funeral/cases',
    products: '/catalog',
    orders: '/sales',
  },
  brandTitleFromOrgName: true,
  dashboardVariant: 'funeral',
};
