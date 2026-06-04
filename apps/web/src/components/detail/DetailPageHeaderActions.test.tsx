import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrgMembershipRecord, UserRecord } from '@/app/demo-data';

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

describe('DetailPageHeaderActions', () => {
  beforeEach(() => {
    demoData.currentUser = { isSuperadmin: false };
    demoData.activeMembership = { role: 'Member' };
  });

  it('keeps edit visible but hides delete for non-manager memberships', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DetailPageHeaderActions onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(markup).toContain('aria-label="Edit"');
    expect(markup).not.toContain('aria-label="Delete"');
  });

  it('shows delete for organization admins', () => {
    demoData.activeMembership = { role: 'Admin' };

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DetailPageHeaderActions onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(markup).toContain('aria-label="Delete"');
  });
});
