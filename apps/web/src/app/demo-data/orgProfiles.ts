import type { LocationDetailItem } from '@/lib/locations/types';
import { FUNERAL_NAV_PATHS } from '@/lib/org-profiles/nav-paths';
import {
  FUNERAL_TERMINOLOGY,
  GENERIC_TERMINOLOGY,
  createDefaultOrgProfile,
} from '@/lib/org-profiles/profiles';
import type { OrgModuleId, OrgProfile } from '@/lib/org-profiles/types';

import { ORG_APEX_ID, ORG_DEMO_ID, ORG_KUNZ_ID } from './orgIds';

type DemoOrgProfile = OrgProfile & {
  demoUserId: string;
};

const APEX_MODULES: OrgModuleId[] = [
  'dashboard',
  'ai-chat',
  'email',
  'calendar',
  'reports',
  'settings',
  'showcase',
];

const KUNZ_MODULES: OrgModuleId[] = ['dashboard', 'ai-chat', 'email', 'calendar', 'settings'];

const KUNZ_LOCATIONS: LocationDetailItem[] = [
  {
    id: 'loc_kunz_pitten',
    name: 'Filialbetrieb Pitten',
    isActive: true,
    branchCode: '21',
    designation: 'Hauptstandort',
    locality: 'Pitten',
    category: 'Filiale',
    phone: '0676 8300 1589',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Lobengasse 593',
    postalCode: '2823',
  },
  {
    id: 'loc_kunz_aspang',
    name: 'Filialbetrieb Aspang',
    isActive: true,
    branchCode: '22',
    designation: 'Filiale',
    locality: 'Aspang',
    category: 'Filiale',
    phone: '+43 2647 721 00',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Hauptstrasse 12',
    postalCode: '2870',
  },
  {
    id: 'loc_kunz_wiesmath',
    name: 'Filialbetrieb Wiesmath',
    isActive: true,
    branchCode: '23',
    designation: 'Filiale',
    locality: 'Wiesmath',
    category: 'Filiale',
    phone: '+43 2645 522 10',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Markt 4',
    postalCode: '2851',
  },
  {
    id: 'loc_kunz_neunkirchen',
    name: 'Filialbetrieb Neunkirchen',
    isActive: true,
    branchCode: '24',
    designation: 'Filiale',
    locality: 'Neunkirchen',
    category: 'Filiale',
    phone: '+43 2635 608 80',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Wiener Strasse 45',
    postalCode: '2620',
  },
  {
    id: 'loc_kunz_ternitz',
    name: 'Filialbetrieb Ternitz',
    isActive: true,
    branchCode: '25',
    designation: 'Filiale',
    locality: 'Ternitz',
    category: 'Filiale',
    phone: '+43 2630 370 20',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Hauptplatz 8',
    postalCode: '2630',
  },
  {
    id: 'loc_kunz_gloggnitz',
    name: 'Filialbetrieb Gloggnitz',
    isActive: true,
    branchCode: '26',
    designation: 'Filiale',
    locality: 'Gloggnitz',
    category: 'Filiale',
    phone: '+43 2662 425 30',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Bahnstrasse 6',
    postalCode: '2850',
  },
  {
    id: 'loc_kunz_puchberg',
    name: 'Filialbetrieb Puchberg',
    isActive: true,
    branchCode: '27',
    designation: 'Filiale',
    locality: 'Puchberg',
    category: 'Filiale',
    phone: '+43 2636 520 40',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Markt 1',
    postalCode: '2734',
  },
  {
    id: 'loc_kunz_kommunal',
    name: 'Kommunalservice',
    isActive: true,
    branchCode: '28',
    designation: 'Kommunalservice',
    locality: 'Pitten',
    category: 'Service',
    phone: '0676 8300 1589',
    mobilePhone: null,
    fax: null,
    companyName: 'Bestattung Kunz GmbH',
    email: 'office@kunz.at',
    street: 'Lobengasse 593',
    postalCode: '2823',
  },
];

export const DEMO_ORG_PROFILES: Record<string, DemoOrgProfile> = {
  [ORG_APEX_ID]: {
    id: ORG_APEX_ID,
    slug: 'apex-tech',
    name: 'Apex Technologies GmbH',
    industryKey: 'generic',
    demoUserId: 'usr_1001',
    enabledModules: APEX_MODULES,
    terminology: GENERIC_TERMINOLOGY,
    locations: [],
    tagline: 'Enterprise operations demo',
  },
  [ORG_DEMO_ID]: {
    id: ORG_DEMO_ID,
    slug: 'oktavius-demo',
    name: 'Oktavius Demo Org',
    industryKey: 'generic',
    demoUserId: 'usr_1001',
    enabledModules: APEX_MODULES,
    terminology: GENERIC_TERMINOLOGY,
    locations: [],
    tagline: 'Sandbox tenant',
  },
  [ORG_KUNZ_ID]: {
    id: ORG_KUNZ_ID,
    slug: 'bestattung-kunz',
    name: 'Bestattung Kunz',
    industryKey: 'funeral',
    demoUserId: 'usr_kunz_owner',
    enabledModules: KUNZ_MODULES,
    navPaths: FUNERAL_NAV_PATHS,
    terminology: FUNERAL_TERMINOLOGY,
    locations: KUNZ_LOCATIONS,
    tagline: 'Bestattungsunternehmen - Niederoesterreich',
  },
};

function createDefaultDemoOrgProfile(orgId: string): DemoOrgProfile {
  return {
    ...createDefaultOrgProfile(orgId),
    demoUserId: '',
  };
}

export function getDemoOrgProfile(orgId: string | null | undefined): DemoOrgProfile {
  return orgId
    ? (DEMO_ORG_PROFILES[orgId] ?? createDefaultDemoOrgProfile(orgId))
    : DEMO_ORG_PROFILES[ORG_APEX_ID];
}
