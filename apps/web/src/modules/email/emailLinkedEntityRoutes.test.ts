import { describe, expect, it } from 'vitest';

import { resolveLinkedEntityHref } from './emailLinkedEntityRoutes';

describe('resolveLinkedEntityHref', () => {
  it('leaves kept-module links untouched', () => {
    expect(resolveLinkedEntityHref('/email')).toBe('/email');
    expect(resolveLinkedEntityHref('/documents')).toBe('/documents');
  });
});
