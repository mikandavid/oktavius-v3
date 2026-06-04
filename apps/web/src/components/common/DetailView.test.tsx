import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DetailView, type DetailFieldProps } from './DetailView';

const demoData = vi.hoisted(() => ({
  currentUser: { isSuperadmin: false },
  activeMembership: { role: 'Member' as 'Member' | 'Admin' },
}));

vi.mock('@/app/demo-data', () => ({
  useDemoData: () => demoData,
}));

const fields: DetailFieldProps[] = [
  { label: 'Name', value: 'Apex Technologies' },
  { label: 'Margin', value: '42%', permission: 'manageOrganization' },
];

describe('DetailView permissioned fields', () => {
  beforeEach(() => {
    demoData.currentUser = { isSuperadmin: false };
    demoData.activeMembership = { role: 'Member' };
  });

  it('hides manager-only detail fields from member memberships', () => {
    const markup = renderToStaticMarkup(<DetailView title="Client" fields={fields} />);

    expect(markup).toContain('Name');
    expect(markup).not.toContain('Margin');
    expect(markup).not.toContain('42%');
  });

  it('keeps manager-only detail fields for organization managers', () => {
    demoData.activeMembership = { role: 'Admin' };

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
