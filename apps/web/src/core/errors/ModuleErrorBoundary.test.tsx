import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { ModuleErrorBoundary } from './ModuleErrorBoundary';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { captureException } from './sentry';

vi.mock('./sentry', () => ({
  captureException: vi.fn(),
}));

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('module exploded');
  }

  return <div>Recovered module</div>;
}

function renderWithI18n(element: React.ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <StrictMode>
        <TestI18nProvider>{element}</TestI18nProvider>
      </StrictMode>,
    );
  });

  return { container, root };
}

describe('ModuleErrorBoundary', () => {
  let roots: Root[] = [];
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    vi.mocked(captureException).mockClear();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    consoleError.mockRestore();
  });

  it('catches a module crash, reports it once, and remounts on retry', () => {
    const rendered = renderWithI18n(
      <ModuleErrorBoundary moduleId="reports">
        <ThrowingChild shouldThrow />
      </ModuleErrorBoundary>,
    );
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Modul konnte nicht geladen werden');
    expect(rendered.container.textContent).toContain('reports');
    expect(captureException).toHaveBeenCalledTimes(1);

    act(() => {
      rendered.root.render(
        <StrictMode>
          <TestI18nProvider>
            <ModuleErrorBoundary moduleId="reports">
              <ThrowingChild shouldThrow={false} />
            </ModuleErrorBoundary>
          </TestI18nProvider>
        </StrictMode>,
      );
    });

    const retryButton = rendered.container.querySelector('button');
    expect(retryButton?.textContent).toContain('Erneut versuchen');

    act(() => {
      retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.textContent).toContain('Recovered module');
  });

  it('renders section crashes as inline fallbacks', () => {
    const rendered = renderWithI18n(
      <SectionErrorBoundary sectionId="approval-panel">
        <ThrowingChild shouldThrow />
      </SectionErrorBoundary>,
    );
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain(
      'Dieser Abschnitt konnte nicht geladen werden',
    );
    expect(rendered.container.textContent).not.toContain('Modul konnte nicht geladen werden');
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
