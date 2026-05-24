import type { VocabularyDefinition } from './types';

export const SALUTATIONS = ['mr', 'mrs', 'mx'] as const;
export type Salutation = (typeof SALUTATIONS)[number];

export const SALUTATION_VOCABULARY = {
  codes: SALUTATIONS,
  labels: {
    mr: { de: 'Herr', en: 'Mr', fr: 'M.' },
    mrs: { de: 'Frau', en: 'Mrs / Ms', fr: 'Mme' },
    mx: { de: 'Divers', en: 'Mx', fr: 'Mx' },
  },
  aliases: {
    mr: ['mr', 'mr.', 'mister', 'herr'],
    mrs: ['mrs', 'mrs.', 'ms', 'ms.', 'miss', 'frau'],
    mx: ['mx', 'mx.', 'divers', 'diverse'],
  },
} satisfies VocabularyDefinition<Salutation>;

export const ACADEMIC_TITLES = [
  'dr',
  'dr_med',
  'prof',
  'prof_dr',
  'mag',
  'ing',
  'dipl_ing',
  'ba',
  'bsc',
  'ma',
  'msc',
  'mba',
  'other',
] as const;
export type AcademicTitle = (typeof ACADEMIC_TITLES)[number];

export const ACADEMIC_TITLE_VOCABULARY = {
  codes: ACADEMIC_TITLES,
  labels: {
    dr: { de: 'Dr.', en: 'Dr.', fr: 'Dr' },
    dr_med: { de: 'Dr. med.', en: 'Dr. med.', fr: 'Dr med.' },
    prof: { de: 'Prof.', en: 'Prof.', fr: 'Prof.' },
    prof_dr: { de: 'Prof. Dr.', en: 'Prof. Dr.', fr: 'Prof. Dr.' },
    mag: { de: 'Mag.', en: 'Mag.', fr: 'Mag.' },
    ing: { de: 'Ing.', en: 'Ing.', fr: 'Ing.' },
    dipl_ing: { de: 'Dipl.-Ing.', en: 'Dipl.-Ing.', fr: 'Dipl.-Ing.' },
    ba: { de: 'BA', en: 'BA', fr: 'BA' },
    bsc: { de: 'BSc', en: 'BSc', fr: 'BSc' },
    ma: { de: 'MA', en: 'MA', fr: 'MA' },
    msc: { de: 'MSc', en: 'MSc', fr: 'MSc' },
    mba: { de: 'MBA', en: 'MBA', fr: 'MBA' },
    other: { de: 'Sonstige', en: 'Other', fr: 'Autre' },
  },
  aliases: {
    dr: ['dr', 'dr.', 'doktor'],
    dr_med: ['dr med', 'dr. med.', 'dr med.', 'dr. med', 'doktor med'],
    prof: ['prof', 'prof.', 'professor'],
    prof_dr: ['prof dr', 'prof. dr.', 'prof dr.', 'prof. dr'],
    mag: ['mag', 'mag.', 'magister', 'magistra'],
    ing: ['ing', 'ing.', 'ingenieur'],
    dipl_ing: ['dipl ing', 'dipl. ing.', 'dipl ing.', 'diplom ingenieur'],
    ba: ['ba', 'b.a.', 'bachelor of arts'],
    bsc: ['bsc', 'b.sc.', 'bachelor of science'],
    ma: ['ma', 'm.a.', 'master of arts'],
    msc: ['msc', 'm.sc.', 'master of science'],
    mba: ['mba', 'm.b.a.'],
    other: ['other', 'sonstige', 'andere'],
  },
  allowCustom: true,
} satisfies VocabularyDefinition<AcademicTitle>;

export const MARITAL_STATUSES = [
  'single',
  'married',
  'widowed',
  'divorced',
  'separated',
  'civil_partnership',
  'civil_partnership_dissolved',
  'civil_partnership_widowed',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const MARITAL_STATUS_VOCABULARY = {
  codes: MARITAL_STATUSES,
  labels: {
    single: { de: 'Ledig', en: 'Single', fr: 'Célibataire' },
    married: { de: 'Verheiratet', en: 'Married', fr: 'Marié(e)' },
    widowed: { de: 'Verwitwet', en: 'Widowed', fr: 'Veuf / Veuve' },
    divorced: { de: 'Geschieden', en: 'Divorced', fr: 'Divorcé(e)' },
    separated: { de: 'Getrennt lebend', en: 'Separated', fr: 'Séparé(e)' },
    civil_partnership: {
      de: 'Eingetragene Partnerschaft',
      en: 'Civil partnership',
      fr: 'Pacs / Partenariat enregistré',
    },
    civil_partnership_dissolved: {
      de: 'Aufgelöste Partnerschaft',
      en: 'Civil partnership dissolved',
      fr: 'Partenariat dissous',
    },
    civil_partnership_widowed: {
      de: 'Verwitwete Partnerschaft',
      en: 'Civil partnership widowed',
      fr: 'Partenariat — veuvage',
    },
  },
  aliases: {
    single: ['single', 'ledig', 'unmarried'],
    married: ['married', 'verheiratet'],
    widowed: ['widowed', 'verwitwet'],
    divorced: ['divorced', 'geschieden'],
    separated: ['separated', 'getrennt'],
    civil_partnership: ['civil partnership', 'eingetragene partnerschaft', 'partnerschaft'],
    civil_partnership_dissolved: [
      'civil partnership dissolved',
      'partnerschaft aufgelost',
      'partnerschaft getrennt',
    ],
    civil_partnership_widowed: ['civil partnership widowed', 'partnerschaft verwitwet'],
  },
} satisfies VocabularyDefinition<MaritalStatus>;

export const RELIGIONS = [
  'roman_catholic',
  'protestant',
  'old_catholic',
  'orthodox',
  'muslim',
  'jewish',
  'buddhist',
  'hindu',
  'none',
  'other',
] as const;
export type Religion = (typeof RELIGIONS)[number];

export const RELIGION_VOCABULARY = {
  codes: RELIGIONS,
  labels: {
    roman_catholic: { de: 'Römisch-katholisch', en: 'Roman Catholic', fr: 'Catholique romain' },
    protestant: { de: 'Evangelisch', en: 'Protestant', fr: 'Protestant' },
    old_catholic: { de: 'Altkatholisch', en: 'Old Catholic', fr: 'Vieux-catholique' },
    orthodox: { de: 'Orthodox', en: 'Orthodox', fr: 'Orthodoxe' },
    muslim: { de: 'Islam', en: 'Muslim', fr: 'Musulman' },
    jewish: { de: 'Jüdisch', en: 'Jewish', fr: 'Juif' },
    buddhist: { de: 'Buddhistisch', en: 'Buddhist', fr: 'Bouddhiste' },
    hindu: { de: 'Hinduistisch', en: 'Hindu', fr: 'Hindou' },
    none: { de: 'Keine / Konfessionslos', en: 'None / No denomination', fr: 'Aucune' },
    other: { de: 'Sonstige', en: 'Other', fr: 'Autre' },
  },
  aliases: {
    roman_catholic: [
      'roman catholic',
      'catholic',
      'romisch katholisch',
      'römisch katholisch',
      'katholisch',
    ],
    protestant: ['protestant', 'evangelisch', 'evangelical', 'lutheran'],
    old_catholic: ['old catholic', 'altkatholisch', 'alt katholisch'],
    orthodox: ['orthodox', 'orthodoxe', 'orthodox christian'],
    muslim: ['muslim', 'islam', 'islamic'],
    jewish: ['jewish', 'judisch', 'jüdisch', 'judaism'],
    buddhist: ['buddhist', 'buddhism', 'buddhistisch'],
    hindu: ['hindu', 'hinduism'],
    none: ['none', 'keine', 'konfessionslos', 'ohne bekenntnis', 'without denomination'],
    other: ['other', 'sonstige', 'andere'],
  },
  allowCustom: true,
} satisfies VocabularyDefinition<Religion>;
