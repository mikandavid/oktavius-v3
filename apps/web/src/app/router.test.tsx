// apps/web/src/app/router.test.tsx
import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { PROTECTED_ROUTE_CHILDREN } from './router';

describe('app routing', () => {
  it('redirects /members to the People settings section', () => {
    const route = PROTECTED_ROUTE_CHILDREN.find((entry) => entry.path === '/members');
    expect(route).toBeDefined();
    expect(isValidElement(route?.element)).toBe(true);
    expect((route?.element as { props: { to: string } }).props.to).toBe('/settings?section=people');
  });

  it('still redirects /profile to the Account settings section', () => {
    const route = PROTECTED_ROUTE_CHILDREN.find((entry) => entry.path === '/profile');
    expect((route?.element as { props: { to: string } }).props.to).toBe(
      '/settings?section=account',
    );
  });
});
