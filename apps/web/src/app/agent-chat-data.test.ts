import { describe, expect, it } from 'vitest';

import { ORG_KUNZ_ID } from '@/app/demo-data/orgIds';
import { DEMO_ORG_PROFILES } from '@/app/demo-data/orgProfiles';

import { deriveAssistantResponse, derivePromptSet } from './agent-chat-data';

const kunz = DEMO_ORG_PROFILES[ORG_KUNZ_ID];

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
