import { describe, expect, it } from 'vitest';

import { resolveInitialSettingsSection } from './settingsSectionParam';

describe('resolveInitialSettingsSection', () => {
  it('returns the requested section when one is present', () => {
    expect(resolveInitialSettingsSection('mail')).toBe('mail');
  });

  it('falls back to general when no section is requested', () => {
    expect(resolveInitialSettingsSection(null)).toBe('general');
  });

  it('falls back to general for a blank section', () => {
    expect(resolveInitialSettingsSection('   ')).toBe('general');
  });
});
