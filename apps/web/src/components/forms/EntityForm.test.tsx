import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityForm, type FormFieldValue } from './EntityForm';

const demoData = vi.hoisted(() => ({
  currentUser: { isSuperadmin: false },
  activeMembership: { role: 'Admin' as 'Member' | 'Admin' },
}));

vi.mock('@/app/demo-data', () => ({
  useDemoData: () => demoData,
}));

vi.mock('@/lib/userPreferences', () => ({
  useUserPreferences: () => ({ locale: 'en' }),
}));

vi.mock('@/lib/reference-data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/reference-data')>();
  return {
    ...actual,
    useCountryOptions: () => [],
    useCurrencyOptions: () => [],
    usePhoneCountries: () => [],
    useVocabularyOptionsMap: () => ({}),
  };
});

type TestValues = {
  name: string;
};

function renderForm({
  onSubmit = vi.fn(),
  autoSave,
  defaultValues = { name: 'Apex' },
}: {
  onSubmit?: (values: TestValues) => void | Promise<void>;
  autoSave?: ComponentProps<typeof EntityForm<TestValues>>['autoSave'];
  defaultValues?: TestValues;
}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <EntityForm<TestValues>
          title="Client"
          surface="dialog"
          fields={[{ name: 'name', label: 'Name', type: 'text', required: true }]}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          autoSave={autoSave}
        />
      ),
    },
  ]);

  act(() => {
    root.render(<RouterProvider router={router} />);
  });

  return { container, root };
}

function changeInput(container: HTMLElement, value: string) {
  const input = container.querySelector('input[name="name"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected name input to render.');
  }

  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('EntityForm autosave', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('debounces valid dirty values and saves them automatically', async () => {
    const onAutoSave = vi.fn(async () => undefined);
    const rendered = renderForm({
      autoSave: { delayMs: 250, onSave: onAutoSave },
    });
    roots.push(rendered.root);

    changeInput(rendered.container, 'Apex Updated');

    await act(async () => {
      vi.advanceTimersByTime(249);
    });
    expect(onAutoSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(onAutoSave).toHaveBeenCalledWith({ name: 'Apex Updated' });
  });

  it('does not autosave values that fail client validation', async () => {
    const onAutoSave = vi.fn(async () => undefined);
    const rendered = renderForm({
      autoSave: { delayMs: 10, onSave: onAutoSave },
    });
    roots.push(rendered.root);

    changeInput(rendered.container, '');

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(onAutoSave).not.toHaveBeenCalled();
  });

  it('uses the normal submit handler when no autosave handler is provided', async () => {
    const onSubmit = vi.fn(async (_values: Record<string, FormFieldValue>) => undefined);
    const rendered = renderForm({
      onSubmit,
      autoSave: { delayMs: 10 },
    });
    roots.push(rendered.root);

    changeInput(rendered.container, 'Apex Submit');

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Apex Submit' });
  });
});
