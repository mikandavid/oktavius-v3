import { describe, expect, it } from 'vitest';

import { resolveInitialSettingsSection } from './settingsSectionParam';

describe('resolveInitialSettingsSection', () => {
  it('returns the requested section when one is present', () => {
    expect(resolveInitialSettingsSection('mail')).toBe('mail');
  });

  it('falls back to the account section when no section is requested', () => {
    expect(resolveInitialSettingsSection(null)).toBe('account');
  });

  it('falls back to the account section for a blank section', () => {
    expect(resolveInitialSettingsSection('   ')).toBe('account');
  });
});
