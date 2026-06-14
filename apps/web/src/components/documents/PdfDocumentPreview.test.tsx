import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PdfDocumentPreview } from './PdfDocumentPreview';

describe('PdfDocumentPreview', () => {
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

  function renderPreview() {
    act(() => {
      root.render(
        <PdfDocumentPreview sourceUrl="https://files.example.com/doc.pdf" title="doc.pdf" />,
      );
    });
    const iframe = container.querySelector('iframe');
    if (!iframe) throw new Error('expected an iframe');
    return iframe;
  }

  it('allows scripts so the browser PDF viewer can render (regression: blank frame)', () => {
    const sandbox = renderPreview().getAttribute('sandbox') ?? '';
    // Without allow-scripts the built-in PDF viewer never initializes and the frame is blank.
    expect(sandbox.split(/\s+/)).toContain('allow-scripts');
  });

  it('passes the fit-mode params through to the iframe src', () => {
    const src = renderPreview().getAttribute('src') ?? '';
    expect(src).toContain('https://files.example.com/doc.pdf#');
    expect(src).toContain('zoom=page-width');
  });
});
