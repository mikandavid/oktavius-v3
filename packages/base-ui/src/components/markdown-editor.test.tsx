import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkdownEditor } from './markdown-editor';

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

describe('MarkdownEditor', () => {
  it('renders provided markdown as formatted HTML', () => {
    act(() => {
      root.render(<MarkdownEditor value={'# Title\n\nHello **world**'} onChange={vi.fn()} />);
    });
    const html = container.innerHTML;
    expect(html).toContain('<h1');
    expect(html).toContain('<strong>world</strong>');
  });

  it('does not emit onChange on initial mount', () => {
    const onChange = vi.fn();
    act(() => {
      root.render(<MarkdownEditor value={'plain text'} onChange={onChange} />);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('updates content when the parent swaps value, without emitting onChange', () => {
    const onChange = vi.fn();
    act(() => {
      root.render(<MarkdownEditor value={'# First'} onChange={onChange} />);
    });
    expect(container.innerHTML).toContain('First');
    onChange.mockClear();
    act(() => {
      root.render(<MarkdownEditor value={'## Second doc'} onChange={onChange} />);
    });
    expect(container.innerHTML).toContain('Second doc');
    expect(container.innerHTML).toContain('<h2');
    expect(onChange).not.toHaveBeenCalled();
  });
});
