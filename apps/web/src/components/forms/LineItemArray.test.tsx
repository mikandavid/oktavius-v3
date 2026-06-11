import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FieldRenderContext } from '@/lib/fields';
import type { VocabularyOptionsMap } from '@/lib/reference-data';

import type { FormField } from './EntityForm';
import { LineItemArray, type LineItemRow } from './LineItemArray';

const context: FieldRenderContext = {
  locale: 'en',
  defaultCountryOptions: [],
  defaultPhoneCountries: [],
  defaultCurrencyOptions: [],
  vocabularyOptions: {} as VocabularyOptionsMap,
};

const itemFields: FormField[] = [
  { name: 'description', label: 'Description', type: 'text' },
  { name: 'quantity', label: 'Quantity', type: 'number' },
];

function renderArray({
  rows = [],
  onChange = vi.fn(),
}: {
  rows?: LineItemRow[];
  onChange?: (rows: LineItemRow[]) => void;
} = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <LineItemArray
        id="lines"
        value={rows}
        itemFields={itemFields}
        context={context}
        addLabel="Add line"
        reorderable
        totals={(currentRows) => [
          {
            label: 'Rows',
            value: String(currentRows.length),
          },
        ]}
        onChange={onChange}
      />,
    );
  });

  return { container, root, onChange };
}

describe('LineItemArray', () => {
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

  it('adds an empty row from item field defaults', () => {
    const rendered = renderArray();
    roots.push(rendered.root);

    act(() => {
      rendered.container
        .querySelector('button:last-child')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.onChange).toHaveBeenCalledWith([{ description: '', quantity: '' }]);
  });

  it('removes rows and reorders rows', () => {
    const rows = [
      { description: 'Alpha', quantity: '1' },
      { description: 'Beta', quantity: '2' },
    ];
    const rendered = renderArray({ rows });
    roots.push(rendered.root);

    const buttons = Array.from(rendered.container.querySelectorAll('button'));

    act(() => {
      buttons
        .find((button) => button.textContent === 'Down')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(rendered.onChange).toHaveBeenCalledWith([rows[1], rows[0]]);

    act(() => {
      buttons
        .find((button) => button.textContent === 'Remove')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(rendered.onChange).toHaveBeenCalledWith([rows[1]]);
  });

  it('renders footer totals for current rows', () => {
    const rendered = renderArray({
      rows: [{ description: 'Alpha', quantity: '1' }],
    });
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Rows');
    expect(rendered.container.textContent).toContain('1');
  });
});
