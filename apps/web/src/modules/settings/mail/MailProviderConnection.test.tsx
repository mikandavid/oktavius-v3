import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { MailProviderConnection } from './MailProviderConnection';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderPanel() {
  act(() => {
    root.render(
      <TestI18nProvider>
        <MailProviderConnection />
      </TestI18nProvider>,
    );
  });
}

describe('MailProviderConnection', () => {
  it('reports that no mail provider is connected', () => {
    renderPanel();
    expect(container.textContent).toContain('No mail provider connected');
  });

  it('lists the supported providers by their display labels', () => {
    renderPanel();
    expect(container.textContent).toContain('Google');
    expect(container.textContent).toContain('Microsoft');
    expect(container.textContent).toContain('Exchange Server');
  });

  it('explains that connecting is not yet available via a hint', () => {
    renderPanel();
    expect(container.querySelector('[data-testid="mail-provider-hint"]')).not.toBeNull();
  });
});
