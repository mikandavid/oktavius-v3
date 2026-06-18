// Note: @testing-library/react is not installed in this repo.
// The two-column tests use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type DetailFieldProps, DetailView } from './DetailView';

const demoData = vi.hoisted<{
  permissionSubject: { isSuperadmin: boolean; role: 'admin' | 'member'; permissions: string[] };
}>(() => ({
  permissionSubject: { isSuperadmin: false, role: 'member' as const, permissions: [] as string[] },
}));

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => demoData,
}));

const fields: DetailFieldProps[] = [
  { label: 'Name', value: 'Apex Technologies' },
  { label: 'Margin', value: '42%', permission: 'manageOrganization' },
];

describe('DetailView permissioned fields', () => {
  beforeEach(() => {
    demoData.permissionSubject = { isSuperadmin: false, role: 'member', permissions: [] };
  });

  it('hides manager-only detail fields from member memberships', () => {
    const markup = renderToStaticMarkup(<DetailView title="Client" fields={fields} />);

    expect(markup).toContain('Name');
    expect(markup).not.toContain('Margin');
    expect(markup).not.toContain('42%');
  });

  it('keeps manager-only detail fields for organization managers', () => {
    demoData.permissionSubject = {
      isSuperadmin: false,
      role: 'admin',
      permissions: ['org.manage'],
    };

    const markup = renderToStaticMarkup(<DetailView title="Client" fields={fields} />);

    expect(markup).toContain('Margin');
    expect(markup).toContain('42%');
  });

  it('renders editable fields through the shared inline edit control', () => {
    const markup = renderToStaticMarkup(
      <DetailView
        title="Client"
        fields={[
          {
            label: 'Name',
            value: 'Apex Technologies',
            inlineEdit: {
              value: 'Apex Technologies',
              onSave: vi.fn(),
            },
          },
        ]}
      />,
    );

    expect(markup).toContain('role="button"');
    expect(markup).toContain('Apex Technologies');
  });

  it('does not render inline edit controls for hidden permissioned fields', () => {
    const markup = renderToStaticMarkup(
      <DetailView
        title="Client"
        fields={[
          {
            label: 'Margin',
            value: '42%',
            permission: 'manageOrganization',
            inlineEdit: {
              value: '42%',
              onSave: vi.fn(),
            },
          },
        ]}
      />,
    );

    expect(markup).not.toContain('role="button"');
    expect(markup).not.toContain('Margin');
    expect(markup).not.toContain('42%');
  });
});

describe('DetailView two-column profile', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('places primary fields in the rail and section fields in the main column', async () => {
    await act(async () => {
      root.render(
        <DetailView
          title="Acme"
          visual={{ kind: 'icon', icon: null }}
          fields={[
            { label: 'Email', value: 'a@b.co', importance: 'primary' },
            { label: 'Street', value: 'Main 1', section: 'Address' },
          ]}
        />,
      );
    });
    const rail = container.querySelector('[data-testid="detail-rail"]');
    const main = container.querySelector('[data-testid="detail-main"]');
    expect(rail).not.toBeNull();
    expect(main).not.toBeNull();
    expect(rail!.textContent).toContain('Email');
    expect(rail!.textContent).toContain('a@b.co');
    expect(main!.textContent).toContain('Street');
    expect(main!.textContent).toContain('Main 1');
  });

  it('honors placement overrides over importance defaults', async () => {
    await act(async () => {
      root.render(
        <DetailView
          title="Acme"
          visual={{ kind: 'icon', icon: null }}
          fields={[
            { label: 'Notes', value: 'Pulled aside', placement: 'aside' },
            { label: 'Email', value: 'pushed-main', importance: 'primary', placement: 'main' },
          ]}
        />,
      );
    });
    const rail = container.querySelector('[data-testid="detail-rail"]');
    const main = container.querySelector('[data-testid="detail-main"]');
    expect(rail).not.toBeNull();
    expect(main).not.toBeNull();
    expect(rail!.textContent).toContain('Pulled aside');
    expect(main!.textContent).toContain('pushed-main');
  });

  it('renders a single full-width column when there is no rail content', async () => {
    await act(async () => {
      root.render(
        <DetailView
          title="Acme"
          fields={[{ label: 'Street', value: 'Main 1', section: 'Address' }]}
        />,
      );
    });
    expect(container.querySelector('[data-testid="detail-rail"]')).toBeNull();
    expect(container.textContent).toContain('Street');
  });
});
