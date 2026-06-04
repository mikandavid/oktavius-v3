import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SplitView } from './split-view';

describe('SplitView', () => {
  it('links the resize separator to the sidebar pane it controls', () => {
    render(
      <SplitView sidebar={<div>Queue</div>}>
        <div>Detail</div>
      </SplitView>,
    );

    const separator = screen.getByRole('separator', { name: /resize split view sidebar/i });
    const sidebarId = separator.getAttribute('aria-controls');

    expect(sidebarId).toBeTruthy();
    expect(document.getElementById(sidebarId as string)).toHaveTextContent('Queue');
  });
});
