import { describe, expect, it } from 'vitest';

import type { OrgProfile } from './types';
import { getLocalizedTerminology } from './terminology';

const baseProfile: OrgProfile = {
  id: 'org_test',
  slug: 'test',
  name: 'Test Org',
  industryKey: 'funeral',
  demoUserId: 'usr_test',
  enabledModules: [],
  terminology: {
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
  locations: [],
  tagline: 'Test',
};

describe('getLocalizedTerminology', () => {
  it('provides French terminology for funeral profiles', () => {
    const terminology = getLocalizedTerminology(baseProfile, 'fr');

    expect(terminology.cases).toBe('Dossiers');
    expect(terminology.clients).toBe('Contacts');
    expect(terminology.dashboard).toBe('Aperçu');
  });
});
