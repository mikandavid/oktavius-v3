import { describe, expect, it } from 'vitest';

import { clampSplitViewSidebarWidth } from './use-split-view-layout';

describe('clampSplitViewSidebarWidth', () => {
  it('raises persisted sidebars that are smaller than the usable pixel minimum', () => {
    expect(clampSplitViewSidebarWidth(180, 320, 720)).toBe(320);
  });

  it('lowers persisted sidebars that exceed the usable pixel maximum', () => {
    expect(clampSplitViewSidebarWidth(900, 320, 720)).toBe(720);
  });

  it('keeps valid persisted sidebars unchanged', () => {
    expect(clampSplitViewSidebarWidth(420, 320, 720)).toBe(420);
  });
});
