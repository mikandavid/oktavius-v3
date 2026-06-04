import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DetailPageHeaderActions } from './DetailPageHeaderActions';

const demoData = vi.hoisted<{
  currentUser: { isSuperadmin: boolean };
  activeMembership: { role: string; permissions: string[] };
}>(() => ({
  currentUser: { isSuperadmin: false },
  activeMembership: { role: 'member', permissions: [] },
}));

vi.mock('@/app/demo-data', () => ({
  useDemoData: () => demoData,
}));

describe('DetailPageHeaderActions', () => {
  beforeEach(() => {
    demoData.currentUser = { isSuperadmin: false };
    demoData.activeMembership = { role: 'member', permissions: [] };
  });

  it('keeps edit visible but hides delete without record delete permission', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DetailPageHeaderActions onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(markup).toContain('aria-label="Edit"');
    expect(markup).not.toContain('aria-label="Delete"');
  });

  it('shows delete with record delete permission', () => {
    demoData.activeMembership = { role: 'admin', permissions: ['records.delete'] };

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DetailPageHeaderActions onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(markup).toContain('aria-label="Delete"');
  });
});
