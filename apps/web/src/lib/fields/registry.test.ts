import { describe, expect, it } from 'vitest';

import { FieldRegistry } from './registry';
import type { FieldDefinition } from './types';

const textDefinition: FieldDefinition = {
  id: 'testText',
  renderer: ({ value }) => String(value ?? ''),
};

describe('FieldRegistry', () => {
  it('registers and returns a field definition by id', () => {
    const registry = new FieldRegistry();

    registry.register(textDefinition);

    expect(registry.get('testText')).toBe(textDefinition);
  });

  it('throws when the same field id is registered twice', () => {
    const registry = new FieldRegistry();

    registry.register(textDefinition);

    expect(() => registry.register(textDefinition)).toThrow(/already registered/i);
  });

  it('lists registered field definitions in registration order', () => {
    const registry = new FieldRegistry();
    const numberDefinition: FieldDefinition = {
      id: 'testNumber',
      renderer: ({ value }) => String(value ?? ''),
    };

    registry.register(textDefinition);
    registry.register(numberDefinition);

    expect(registry.list()).toEqual([textDefinition, numberDefinition]);
  });
});
