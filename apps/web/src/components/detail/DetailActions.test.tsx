import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrgMembershipRecord, UserRecord } from '@/app/demo-data';

import { DetailActions, type DetailAction } from './DetailActions';
import { DetailPageHeaderActions } from './DetailPageHeaderActions';

const demoData = vi.hoisted<{
  currentUser: Pick<UserRecord, 'isSuperadmin'>;
  activeMembership: Pick<OrgMembershipRecord, 'role'>;
}>(() => ({
  currentUser: { isSuperadmin: false },
  activeMembership: { role: 'Member' },
}));

vi.mock('@/app/demo-data', () => ({
  useDemoData: () => demoData,
}));

const actions: DetailAction[] = [
  { key: 'open', label: 'Open', onClick: vi.fn() },
  { key: 'approve', label: 'Approve', permission: 'manageOrganization', onClick: vi.fn() },
];

describe('DetailActions', () => {
  beforeEach(() => {
    demoData.currentUser = { isSuperadmin: false };
    demoData.activeMembership = { role: 'Member' };
  });

  it('hides manager-only custom actions from member memberships', () => {
    const markup = renderToStaticMarkup(<DetailActions actions={actions} />);

    expect(markup).toContain('Open');
    expect(markup).not.toContain('Approve');
  });

  it('keeps manager-only custom actions for organization managers', () => {
    demoData.activeMembership = { role: 'Admin' };

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
