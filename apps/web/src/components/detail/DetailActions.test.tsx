import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type DetailAction, DetailActions } from './DetailActions';
import { DetailPageHeaderActions } from './DetailPageHeaderActions';

const demoData = vi.hoisted<{
  permissionSubject: { isSuperadmin: boolean; role: 'admin' | 'member'; permissions: string[] };
}>(() => ({
  permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
}));

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => demoData,
}));

const actions: DetailAction[] = [
  { key: 'open', label: 'Open', onClick: vi.fn() },
  { key: 'approve', label: 'Approve', permission: 'manageOrganization', onClick: vi.fn() },
];

describe('DetailActions', () => {
  beforeEach(() => {
    demoData.permissionSubject = { isSuperadmin: false, role: 'member', permissions: [] };
  });

  it('hides manager-only custom actions from member memberships', () => {
    const markup = renderToStaticMarkup(<DetailActions actions={actions} />);

    expect(markup).toContain('Open');
    expect(markup).not.toContain('Approve');
  });

  it('keeps manager-only custom actions for organization managers', () => {
    demoData.permissionSubject = {
      isSuperadmin: false,
      role: 'admin',
      permissions: ['org.manage'],
    };

    const markup = renderToStaticMarkup(<DetailActions actions={actions} />);

    expect(markup).toContain('Open');
    expect(markup).toContain('Approve');
  });

  it('filters generated header custom actions through the same permission contract', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DetailPageHeaderActions onEdit={vi.fn()} onDelete={vi.fn()} customActions={actions} />
      </MemoryRouter>,
    );

    expect(markup).toContain('Open');
    expect(markup).not.toContain('Approve');
    expect(markup).toContain('aria-label="Edit"');
  });
});
