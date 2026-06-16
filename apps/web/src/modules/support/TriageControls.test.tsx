import enSupport from '@oktavius/i18n/locales/en/support.json';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TriageControls } from './TriageControls';

// The real Combobox opens a Radix Popover via pointer events, which jsdom does
// not implement (no PointerEvent), so its option list cannot be driven through
// the DOM in this raw createRoot harness. We replace it with a faithful stand-in
// that renders each option as a plain button and reproduces the real
// `handleSelect` semantics — including the clearable re-select → null path — so
// real DOM clicks still exercise TriageControls' onChange handlers end to end.
interface MockComboboxOption {
  value: string;
  label: string;
}
interface MockComboboxProps {
  options: MockComboboxOption[];
  value?: string;
  onChange?: (value: string | null) => void;
  clearable?: boolean;
  placeholder?: string;
}
vi.mock('@oktavius/base-ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@oktavius/base-ui');
  function MockCombobox({ options, value, onChange, clearable = true }: MockComboboxProps) {
    return (
      <div data-combobox data-value={value ?? ''}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            data-combobox-option={o.value}
            onClick={() => {
              if (o.value === value && clearable) onChange?.(null);
              else onChange?.(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  return { ...actual, Combobox: MockCombobox };
});

const baseTicket = {
  id: 't1',
  status: 'open',
  priority: 'normal',
  assigneeUserId: null,
} as never;

const mutations = {
  updateStatus: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  updatePriority: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  assign: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  resolve: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
};

vi.mock('./data/useSupportData', () => ({
  useSupportMutations: () => mutations,
  useSupportAssignees: () => ({ data: [{ userId: 'u1', name: 'Ada', email: 'a@x.io' }] }),
}));

// Resolve the real English support strings so literal-string assertions match.
const support = enSupport as Record<string, string>;
vi.mock('@/core/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const inner = key.startsWith('support.') ? key.slice('support.'.length) : key;
      return support[inner] ?? key;
    },
    language: 'en',
  }),
}));

let container: HTMLDivElement;
let root: Root;

function findByText(text: string): HTMLElement | null {
  const nodes = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
  return nodes.find((n) => n.textContent?.trim() === text) ?? null;
}

/** The Combobox stand-ins in render order: [status, priority, assignee]. */
function comboboxes(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-combobox]'));
}

/** Click the option whose label === optionLabel within the given combobox. */
function selectOption(combobox: HTMLElement | undefined, optionLabel: string) {
  expect(combobox, 'combobox should be present').toBeDefined();
  const option = Array.from(combobox!.querySelectorAll<HTMLButtonElement>('button')).find(
    (b) => b.textContent?.trim() === optionLabel,
  );
  expect(option, `option "${optionLabel}" should be present`).toBeDefined();
  act(() => option!.click());
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  Object.values(mutations).forEach((m) => m.mutateAsync.mockClear());
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('TriageControls', () => {
  it('renders enabled status/priority/assignee controls (no "Soon")', () => {
    act(() => {
      root.render(<TriageControls ticket={baseTicket} />);
    });
    expect(document.body.textContent).not.toContain('Soon');
    expect(document.body.textContent).toContain('Status');
    expect(document.body.textContent).toContain('Assignee');
  });

  it('opens the resolve dialog and calls resolve on confirm', async () => {
    act(() => {
      root.render(<TriageControls ticket={baseTicket} />);
    });

    const resolveTrigger = findByText('Resolve ticket');
    expect(resolveTrigger).not.toBeNull();
    act(() => resolveTrigger!.click());

    const textarea = document.body.querySelector(
      'textarea[placeholder*="Describe how this was resolved"]',
    ) as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )!.set!;
    act(() => {
      nativeSetter.call(textarea, 'fixed');
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const confirmBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Resolve',
    );
    expect(confirmBtn).toBeDefined();
    await act(async () => {
      confirmBtn!.click();
    });

    expect(mutations.resolve.mutateAsync).toHaveBeenCalledWith({
      ticketId: 't1',
      resolutionMessage: 'fixed',
    });
  });

  it('selecting a status option fires updateStatus with the chosen status', async () => {
    act(() => {
      root.render(<TriageControls ticket={baseTicket} />);
    });

    // Status is the first combobox; current value is "open", choose "In Progress".
    await act(async () => {
      selectOption(comboboxes()[0], 'In Progress');
    });

    expect(mutations.updateStatus.mutateAsync).toHaveBeenCalledWith({
      ticketId: 't1',
      status: 'in_progress',
    });
  });

  it('selecting a priority option fires updatePriority with the chosen priority', async () => {
    act(() => {
      root.render(<TriageControls ticket={baseTicket} />);
    });

    // Priority is the second combobox; current value is "normal", choose "High".
    await act(async () => {
      selectOption(comboboxes()[1], 'High');
    });

    expect(mutations.updatePriority.mutateAsync).toHaveBeenCalledWith({
      ticketId: 't1',
      priority: 'high',
    });
  });

  it('selecting an unassigned ticket assignee fires assign with the chosen user', async () => {
    act(() => {
      root.render(<TriageControls ticket={baseTicket} />);
    });

    // Assignee is the third combobox; ticket is unassigned, choose "Ada" (u1).
    await act(async () => {
      selectOption(comboboxes()[2], 'Ada');
    });

    expect(mutations.assign.mutateAsync).toHaveBeenCalledWith({
      ticketId: 't1',
      assigneeUserId: 'u1',
    });
  });

  it('re-selecting the current assignee clears it (unassign path)', async () => {
    const assignedTicket = {
      id: 't1',
      status: 'open',
      priority: 'normal',
      assigneeUserId: 'u1',
    } as never;
    act(() => {
      root.render(<TriageControls ticket={assignedTicket} />);
    });

    // Assignee combobox value is 'u1'; the assignee combobox is clearable (default),
    // so re-selecting the current option calls onChange(null) → assigneeUserId: null.
    await act(async () => {
      selectOption(comboboxes()[2], 'Ada');
    });

    expect(mutations.assign.mutateAsync).toHaveBeenCalledWith({
      ticketId: 't1',
      assigneeUserId: null,
    });
  });

  it('hides the resolve button for a closed ticket and shows it for an open ticket', () => {
    const closedTicket = {
      id: 't1',
      status: 'closed',
      priority: 'normal',
      assigneeUserId: null,
    } as never;
    act(() => {
      root.render(<TriageControls ticket={closedTicket} />);
    });
    expect(findByText('Resolve ticket')).toBeNull();

    act(() => {
      root.render(<TriageControls ticket={baseTicket} />);
    });
    expect(findByText('Resolve ticket')).not.toBeNull();
  });
});
