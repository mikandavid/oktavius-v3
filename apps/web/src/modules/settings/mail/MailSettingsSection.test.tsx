import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { MailSettingsSection } from './MailSettingsSection';

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

describe('MailSettingsSection', () => {
  it('renders the mail provider connection panel', () => {
    act(() => {
      root.render(
        <TestI18nProvider>
          <MailSettingsSection />
        </TestI18nProvider>,
      );
    });

    expect(container.textContent).toContain('No mail provider connected');
  });
});
