import { describe, expect, it } from 'vitest';

import { resolveInitialAgentSection } from './agentSectionParam';

describe('resolveInitialAgentSection', () => {
  it('defaults to settings', () => {
    expect(resolveInitialAgentSection(null)).toBe('settings');
    expect(resolveInitialAgentSection('  ')).toBe('settings');
  });
  it('passes through a provided section', () => {
    expect(resolveInitialAgentSection('automations')).toBe('automations');
  });
});
