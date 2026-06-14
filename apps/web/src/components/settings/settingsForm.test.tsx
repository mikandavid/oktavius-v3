import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SettingsAutosaveFooter } from './settingsForm';

describe('settingsForm primitives', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) act(() => root.unmount());
    document.body.innerHTML = '';
  });

  function render(node: React.ReactNode) {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    act(() => root.render(node));
    return container;
  }

  it('SettingsAutosaveFooter renders the saved label when not saving', () => {
    const container = render(
      <SettingsAutosaveFooter
        saving={false}
        savedAt={123}
        savedLabel="Saved"
        savingLabel="Saving…"
      />,
    );
    expect(container.textContent).toContain('Saved');
  });
});
