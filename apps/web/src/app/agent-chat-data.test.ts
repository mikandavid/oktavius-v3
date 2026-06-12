import { describe, expect, it } from 'vitest';

import { createDefaultOrgProfile } from '@/lib/org-profiles/profiles';
import type { OrgProfile } from '@/lib/org-profiles/types';

import { deriveAssistantResponse, derivePromptSet } from './agent-chat-data';

const kunz: OrgProfile = {
  ...createDefaultOrgProfile('org_test_funeral'),
  name: 'Test Funeral Org',
  industryKey: 'funeral',
  navPaths: { cases: '/funeral/cases', products: '/catalog', orders: '/sales' },
};

describe('agent chat page context', () => {
  it('treats removed business module paths as generic workspace context', () => {
    expect(derivePromptSet('/contacts/cli_1', kunz)).toEqual([
      'Give me the operational summary for this workspace.',
      'What should be reviewed first today?',
      'Draft next actions from the visible records.',
    ]);

    expect(
      deriveAssistantResponse({
        content: 'what should I review?',
        pathname: '/contacts/cli_1',
        profile: kunz,
        userCount: 4,
        clientCount: 7,
        activeConversation: null,
      }),
    ).toContain('The current shell is still compact');
  });

  it('keeps content-aware replies without resolving removed business modules', () => {
    expect(
      deriveAssistantResponse({
        content: 'case next action',
        pathname: '/funeral/cases/case_1',
        profile: kunz,
        userCount: 4,
        clientCount: 7,
        activeConversation: null,
      }),
    ).toContain('Prioritize open deadlines');
  });
});
