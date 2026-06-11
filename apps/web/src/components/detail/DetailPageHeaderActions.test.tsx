import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DetailPageHeaderActions } from './DetailPageHeaderActions';

const demoData = vi.hoisted<{
  permissionSubject: { isSuperadmin: boolean; role: 'admin' | 'member'; permissions: string[] };
}>(() => ({
  permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
}));

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => demoData,
}));

describe('DetailPageHeaderActions', () => {
  beforeEach(() => {
    demoData.permissionSubject = { isSuperadmin: false, role: 'member', permissions: [] };
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
    demoData.permissionSubject = {
      isSuperadmin: false,
      role: 'admin',
      permissions: ['records.delete'],
    };

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DetailPageHeaderActions onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>,
    );

    expect(markup).toContain('aria-label="Delete"');
  });
});
