import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('runtime provider isolation', () => {
  it('mounts the Osiris runtime provider stack in app order', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/runtimeProviders.tsx'), 'utf8');

    const providerOrder = [
      'UserPreferencesProvider',
      'OsirisAuthProvider',
      'I18nBridge',
      'OsirisApiProvider',
      'ActiveLocationProvider',
      'AgentChatProvider',
    ];
    const positions = providerOrder.map((provider) => source.indexOf(`<${provider}`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(source).not.toContain('VITE_OKTAVIUS_RUNTIME');
    expect(source).not.toContain('DemoDataProvider');
    expect(source).not.toContain('DemoRuntimeProviders');
    expect(source).toContain('onUnauthorized');
  });

  it('keeps App.tsx as a thin app shell', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');

    expect(source).toContain('RuntimeProviders');
    expect(source).not.toContain('DemoDataProvider');
    expect(source).not.toContain('OsirisAuthProvider');
  });
});
