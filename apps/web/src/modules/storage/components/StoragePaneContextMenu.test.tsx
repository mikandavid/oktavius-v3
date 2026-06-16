import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { StoragePaneContextMenu } from './StoragePaneContextMenu';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('StoragePaneContextMenu', () => {
  it('passes through children when disabled', () => {
    act(() => {
      root.render(
        <TestI18nProvider>
          <StoragePaneContextMenu
            enabled={false}
            onNewFolder={vi.fn()}
            onNewTextFile={vi.fn()}
            onUpload={vi.fn()}
          >
            <div data-testid="child" />
          </StoragePaneContextMenu>
        </TestI18nProvider>,
      );
    });
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
