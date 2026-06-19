import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  NotificationSettings,
  NotificationsRuntimeAdapter,
} from '@/components/layout/NotificationsRuntime';
import { TestI18nProvider } from '@/core/i18n';

import { NotificationSettingsSection } from './NotificationSettingsSection';

// The real Combobox opens a Radix Popover via pointer events, which jsdom does
// not implement, so its option list cannot be driven through the DOM in this raw
// createRoot harness. We replace it with a faithful stand-in that renders each
// option as a plain button and reproduces the real `handleSelect` semantics, so
// real DOM clicks still exercise the channel onChange handler end to end.
interface MockComboboxOption {
  value: string;
  label: string;
}
interface MockComboboxProps {
  options: MockComboboxOption[];
  value?: string;
  onChange?: (value: string | null) => void;
  clearable?: boolean;
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

const notificationSettings: NotificationSettings = {
  modules: [
    {
      moduleId: 'invoices',
      moduleName: 'Invoices',
      enabled: true,
      categories: [
        {
          key: 'approval',
          label: 'Approvals',
          types: [
            {
              key: 'invoice.approval_requested',
              title: 'Approval requested',
              description: 'An invoice needs review.',
              severity: 'info',
              channels: [
                {
                  channel: 'in_app',
                  allowed: true,
                  supportsSummary: false,
                  effectiveState: 'enabled',
                  explicitState: 'inherited',
                  defaultState: 'enabled',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

async function selectComboboxOption(container: HTMLElement, value: string) {
  const option = container.querySelector<HTMLButtonElement>(`[data-combobox-option="${value}"]`);
  if (!option) {
    throw new Error(`Expected notification channel option "${value}".`);
  }
  await act(async () => {
    option.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function waitForText(container: HTMLElement, expected: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    if ((container.textContent ?? '').includes(expected)) return;
  }
}

describe('NotificationSettingsSection', () => {
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

  it('loads notification settings and updates channel subscriptions', async () => {
    const notificationsRuntime: NotificationsRuntimeAdapter = {
      subscribe: () => () => {},
      fetchNotifications: vi.fn(async () => []),
      fetchUnreadCount: vi.fn(async () => 0),
      markRead: vi.fn(async () => undefined),
      markAllRead: vi.fn(async () => undefined),
      fetchSettings: vi.fn(async () => notificationSettings),
      updateSubscription: vi.fn(async () => undefined),
    };

    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    const queryClient = newQueryClient();

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={queryClient}>
            <NotificationSettingsSection runtime={notificationsRuntime} />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    await waitForText(container, 'Approval requested');

    await selectComboboxOption(container, 'disabled');

    expect(notificationsRuntime.fetchSettings).toHaveBeenCalled();
    expect(notificationsRuntime.updateSubscription).toHaveBeenCalledWith({
      notificationTypeKey: 'invoice.approval_requested',
      channel: 'in_app',
      state: 'disabled',
    });
  });
});
