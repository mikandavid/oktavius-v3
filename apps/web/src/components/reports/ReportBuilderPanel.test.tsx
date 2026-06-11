import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportBuilderPanel } from './ReportBuilderPanel';
import type { ReportStore, SavedReport } from './reportStorage';

function renderReportBuilder(store: ReportStore) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(<ReportBuilderPanel store={store} />);
  });

  return { container, root };
}

describe('ReportBuilderPanel empty data source', () => {
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
  });

  it('renders an explicit empty source state instead of an empty chart/table preview', async () => {
    const reports: SavedReport[] = [
      { id: 'report_1', name: 'Revenue', chartType: 'line', dataset: 'revenue' },
    ];
    const store: ReportStore = {
      load: vi.fn(() => reports),
      save: vi.fn(),
      clear: vi.fn(),
    };
    const rendered = renderReportBuilder(store);
    roots.push(rendered.root);

    await act(async () => {
      await Promise.resolve();
    });

    expect(rendered.container.textContent).toContain('No report data source connected.');
    expect(rendered.container.querySelector('table')).toBeNull();
  });
});
