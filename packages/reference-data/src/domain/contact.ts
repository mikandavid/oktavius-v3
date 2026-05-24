import type { VocabularyDefinition } from './types';

export const PARTY_ROLES = [
  'primary_contact',
  'billing_contact',
  'technical_contact',
  'account_manager',
  'legal',
  'other',
] as const;
export type PartyRole = (typeof PARTY_ROLES)[number];

export const PARTY_ROLE_VOCABULARY = {
  codes: PARTY_ROLES,
  labels: {
    primary_contact: { de: 'Hauptansprechperson', en: 'Primary contact', fr: 'Contact principal' },
    billing_contact: { de: 'Rechnungskontakt', en: 'Billing contact', fr: 'Contact facturation' },
    technical_contact: {
      de: 'Technischer Kontakt',
      en: 'Technical contact',
      fr: 'Contact technique',
    },
    account_manager: { de: 'Kundenbetreuer', en: 'Account manager', fr: 'Gestionnaire de compte' },
    legal: { de: 'Rechtlich', en: 'Legal', fr: 'Juridique' },
    other: { de: 'Sonstige', en: 'Other', fr: 'Autre' },
  },
  aliases: {
    primary_contact: ['primary contact', 'primary', 'hauptansprechperson', 'hauptkontakt'],
    billing_contact: ['billing contact', 'billing', 'rechnungskontakt', 'rechnung'],
    technical_contact: [
      'technical contact',
      'technical',
      'technical lead',
      'technischer kontakt',
    ],
    account_manager: ['account manager', 'kundenbetreuer', 'betreuer'],
    legal: ['legal', 'rechtlich', 'juristisch'],
    other: ['other', 'sonstige'],
  },
  allowCustom: true,
} satisfies VocabularyDefinition<PartyRole>;
