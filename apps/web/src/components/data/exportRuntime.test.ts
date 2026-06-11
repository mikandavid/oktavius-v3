import { describe, expect, it, vi } from 'vitest';

import { chooseExportStrategy } from './exportRuntime';

describe('export runtime', () => {
  it('uses server export when runtime is configured and row count is above threshold', () => {
    const runtime = { startExport: vi.fn() };

    expect(chooseExportStrategy({ runtime, rowCount: 501, threshold: 500 })).toBe('server');
  });

  it('uses local export when runtime is absent', () => {
    expect(chooseExportStrategy({ rowCount: 5000, threshold: 500 })).toBe('local');
  });

  it('uses local export for small row counts even when runtime exists', () => {
    const runtime = { startExport: vi.fn() };

    expect(chooseExportStrategy({ runtime, rowCount: 25, threshold: 500 })).toBe('local');
  });
});
