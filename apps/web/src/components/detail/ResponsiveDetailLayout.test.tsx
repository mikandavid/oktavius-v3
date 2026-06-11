import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResponsiveDetailLayout } from './ResponsiveDetailLayout';

const routerMock = vi.hoisted(() => ({
  params: new URLSearchParams(),
  setSearchParams: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [routerMock.params, routerMock.setSearchParams],
}));

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderLayout(params = '', desktop = true) {
  setMatchMedia(desktop);
  routerMock.params = new URLSearchParams(params);
  routerMock.setSearchParams.mockClear();

  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ResponsiveDetailLayout
        paramKey="id"
        master={({ select, selectedId }) => (
          <div>
            <button type="button" onClick={() => select('alpha')}>
              Alpha
            </button>
            <span>Selected: {selectedId ?? 'none'}</span>
          </div>
        )}
        detail={({ selectedId }) => <p>Detail {selectedId}</p>}
        emptyDetail={<p>No detail</p>}
      />,
    );
  });

  return { container, root };
}

describe('ResponsiveDetailLayout', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('reads the selected detail id from the URL on desktop', () => {
    const rendered = renderLayout('id=alpha', true);
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Detail alpha');
  });

  it('selects a row by writing the id query param', () => {
    const rendered = renderLayout('', true);
    roots.push(rendered.root);

    const alphaButton = Array.from(rendered.container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Alpha'),
    );
    expect(alphaButton).toBeTruthy();

    act(() => {
      alphaButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const nextParams = routerMock.setSearchParams.mock.calls[0]?.[0] as URLSearchParams;
    expect(nextParams.toString()).toBe('id=alpha');
  });

  it('shows only detail on mobile and clears selection from the back button', () => {
    const rendered = renderLayout('id=alpha', false);
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Detail alpha');
    expect(rendered.container.textContent).not.toContain('Selected: alpha');

    act(() => {
      rendered.container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const nextParams = routerMock.setSearchParams.mock.calls[0]?.[0] as URLSearchParams;
    expect(nextParams.toString()).toBe('');
  });
});
