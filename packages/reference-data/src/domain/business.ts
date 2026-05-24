import type { VocabularyDefinition } from './types';

export const CLIENT_TYPES = ['company', 'individual'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_STATUSES = ['active', 'inactive', 'prospect', 'churned'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PAYMENT_TERMS = ['due_on_receipt', 'net_7', 'net_14', 'net_30', 'net_60'] as const;
export type PaymentTerms = (typeof PAYMENT_TERMS)[number];

export const CLIENT_TYPE_VOCABULARY = {
  codes: CLIENT_TYPES,
  labels: {
    company: { de: 'Unternehmen', en: 'Company', fr: 'Entreprise' },
    individual: { de: 'Privatperson', en: 'Individual', fr: 'Particulier' },
  },
  aliases: {
    company: ['company', 'unternehmen', 'firma', 'business'],
    individual: ['individual', 'privatperson', 'person', 'private'],
  },
} satisfies VocabularyDefinition<ClientType>;

export const CLIENT_STATUS_VOCABULARY = {
  codes: CLIENT_STATUSES,
  labels: {
    active: { de: 'Aktiv', en: 'Active', fr: 'Actif' },
    inactive: { de: 'Inaktiv', en: 'Inactive', fr: 'Inactif' },
    prospect: { de: 'Interessent', en: 'Prospect', fr: 'Prospect' },
    churned: { de: 'Abgewandert', en: 'Churned', fr: 'Perdu' },
  },
  aliases: {
    active: ['active', 'aktiv'],
    inactive: ['inactive', 'inaktiv'],
    prospect: ['prospect', 'interessent', 'lead'],
    churned: ['churned', 'abgewandert', 'lost'],
  },
} satisfies VocabularyDefinition<ClientStatus>;

export const PAYMENT_TERMS_VOCABULARY = {
  codes: PAYMENT_TERMS,
  labels: {
    due_on_receipt: { de: 'Sofort fällig', en: 'Due on receipt', fr: 'À réception' },
    net_7: { de: 'Netto 7 Tage', en: 'Net 7', fr: 'Net 7 jours' },
    net_14: { de: 'Netto 14 Tage', en: 'Net 14', fr: 'Net 14 jours' },
    net_30: { de: 'Netto 30 Tage', en: 'Net 30', fr: 'Net 30 jours' },
    net_60: { de: 'Netto 60 Tage', en: 'Net 60', fr: 'Net 60 jours' },
  },
  aliases: {
    due_on_receipt: ['due on receipt', 'sofort', 'sofort fallig', 'immediate'],
    net_7: ['net 7', 'netto 7', '7 days', '7 tage'],
    net_14: ['net 14', 'netto 14', '14 days', '14 tage'],
    net_30: ['net 30', 'netto 30', '30 days', '30 tage'],
    net_60: ['net 60', 'netto 60', '60 days', '60 tage'],
  },
} satisfies VocabularyDefinition<PaymentTerms>;

/** Map legacy Title Case client status labels to vocabulary codes. */
export const LEGACY_CLIENT_STATUS_TO_CODE: Record<string, ClientStatus> = {
  Active: 'active',
  Inactive: 'inactive',
  Prospect: 'prospect',
  Churned: 'churned',
};

/** Map legacy Title Case client type labels to vocabulary codes. */
export const LEGACY_CLIENT_TYPE_TO_CODE: Record<string, ClientType> = {
  Company: 'company',
  Individual: 'individual',
};

/** Status badge keys still use Title Case in the UI layer. */
export const CLIENT_STATUS_BADGE_LABEL: Record<ClientStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  prospect: 'Prospect',
  churned: 'Churned',
};
