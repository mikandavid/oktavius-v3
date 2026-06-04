import { describe, expect, it } from 'vitest';

import { buildTaskParentHref } from './taskRouting';

describe('buildTaskParentHref', () => {
  it('does not link tasks to removed business modules', () => {
    expect(buildTaskParentHref({ parentType: 'case', parentId: 'case_1' })).toBeNull();
    expect(buildTaskParentHref({ parentType: 'client', parentId: 'cli_1' })).toBeNull();
    expect(buildTaskParentHref({ parentType: 'order', parentId: 'ord_1' })).toBeNull();
    expect(buildTaskParentHref({ parentType: 'project', parentId: 'prj_1' })).toBeNull();
  });

  it('returns null for unsupported parent types', () => {
    expect(buildTaskParentHref({ parentType: 'unknown', parentId: 'x' })).toBeNull();
  });
});
