import { describe, expect, it } from 'vitest';

import type { AppNavModule } from '@/lib/appNavModules';

import { isNavItemActive, orderItems } from './sidebarNav';

function item(id: string): AppNavModule {
  return { id, path: `/${id}` } as unknown as AppNavModule;
}

describe('orderItems', () => {
  it('returns items unchanged when no preferred order is given', () => {
    const items = [item('a'), item('b'), item('c')];
    expect(orderItems(items, []).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('orders by the preferred order', () => {
    const items = [item('a'), item('b'), item('c')];
    expect(orderItems(items, ['c', 'a', 'b']).map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('keeps items missing from the preferred order at the end, in original order', () => {
    const items = [item('a'), item('b'), item('c'), item('d')];
    expect(orderItems(items, ['c', 'a']).map((i) => i.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('does not mutate the input array', () => {
    const items = [item('a'), item('b')];
    orderItems(items, ['b', 'a']);
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
  });
});

describe('isNavItemActive', () => {
  it('matches dashboard only exactly (no prefix bleed)', () => {
    expect(isNavItemActive('/dashboard', '/dashboard')).toBe(true);
    expect(isNavItemActive('/dashboard/x', '/dashboard')).toBe(false);
  });

  it('matches a module path exactly or as a path prefix', () => {
    expect(isNavItemActive('/storage', '/storage')).toBe(true);
    expect(isNavItemActive('/storage/folder/1', '/storage')).toBe(true);
    expect(isNavItemActive('/storageX', '/storage')).toBe(false);
    expect(isNavItemActive('/email', '/storage')).toBe(false);
  });
});
