import { describe, expect, it } from 'vitest';

import { createDefaultOrgProfile } from './profiles';

describe('agent-admin module enablement', () => {
  it('enables agent-admin in the default org profile', () => {
    const profile = createDefaultOrgProfile('workspace');
    expect(profile.enabledModules).toContain('agent-admin');
  });
});
