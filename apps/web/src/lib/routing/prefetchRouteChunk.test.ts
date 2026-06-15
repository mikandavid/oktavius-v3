import { afterEach, describe, expect, it, vi } from 'vitest';

import { prefetchAppNavModule } from './prefetchRouteChunk';

function setSaveData(value: boolean | undefined) {
  Object.defineProperty(navigator, 'connection', {
    value: value === undefined ? undefined : { saveData: value },
    configurable: true,
  });
}

afterEach(() => {
  setSaveData(undefined);
});

describe('prefetchAppNavModule', () => {
  it('invokes the loader once and memoizes repeat calls for the same module', () => {
    const loadPage = vi.fn(async () => ({ Page: () => null }));
    const module = { id: 'memo-test', loadPage };

    prefetchAppNavModule(module);
    prefetchAppNavModule(module);
    prefetchAppNavModule(module);

    expect(loadPage).toHaveBeenCalledTimes(1);
  });

  it('loads distinct modules independently', () => {
    const a = { id: 'distinct-a', loadPage: vi.fn(async () => ({ Page: () => null })) };
    const b = { id: 'distinct-b', loadPage: vi.fn(async () => ({ Page: () => null })) };

    prefetchAppNavModule(a);
    prefetchAppNavModule(b);

    expect(a.loadPage).toHaveBeenCalledTimes(1);
    expect(b.loadPage).toHaveBeenCalledTimes(1);
  });

  it('skips prefetch under Save-Data and resumes once it clears', () => {
    const loadPage = vi.fn(async () => ({ Page: () => null }));
    const module = { id: 'save-data-test', loadPage };

    setSaveData(true);
    prefetchAppNavModule(module);
    expect(loadPage).not.toHaveBeenCalled();

    setSaveData(false);
    prefetchAppNavModule(module);
    expect(loadPage).toHaveBeenCalledTimes(1);
  });

  it('allows a retry after a failed load', async () => {
    const loadPage = vi
      .fn<() => Promise<Record<string, never>>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({});
    const module = { id: 'retry-test', loadPage };

    prefetchAppNavModule(module);
    // Let the rejected promise settle so the memo entry is cleared.
    await Promise.resolve();
    await Promise.resolve();
    prefetchAppNavModule(module);

    expect(loadPage).toHaveBeenCalledTimes(2);
  });
});
