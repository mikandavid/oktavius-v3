import { describe, expect, it } from 'vitest';

import { SearchRegistry } from './registry';
import type { SearchProvider } from './types';

const provider: SearchProvider = {
  id: 'test',
  label: 'Test',
  search: async () => [],
};

describe('SearchRegistry', () => {
  it('registers and lists providers in order', () => {
    const registry = new SearchRegistry();
    registry.register(provider);

    expect(registry.list()).toEqual([provider]);
  });

  it('throws on duplicate provider ids', () => {
    const registry = new SearchRegistry();
    registry.register(provider);

    expect(() => registry.register(provider)).toThrow(/already registered/i);
  });
});
