import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
