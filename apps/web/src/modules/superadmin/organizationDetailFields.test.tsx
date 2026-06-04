import { describe, expect, it, vi } from 'vitest';

import type { OrganizationRecord } from '@/app/demo-data';

import { buildOrganizationDetailFields } from './organizationDetailFields';

const organization: OrganizationRecord = {
  id: 'org_1',
  name: 'Apex Group',
  slug: 'apex',
  plan: 'Enterprise',
  status: 'Active',
  environment: 'Production',
  region: 'EU',
  billingEmail: 'billing@example.test',
  ownerName: 'Anna Hofer',
  memberCount: 12,
  createdAt: '2026-01-01',
};

describe('organization detail fields', () => {
  it('marks scalar organization fields as inline editable', async () => {
    const onInlineUpdate = vi.fn();
    const fields = buildOrganizationDetailFields({ organization, onInlineUpdate });

    const nameField = fields.find((field) => field.label === 'Name');
    const slugField = fields.find((field) => field.label === 'Slug');
    const billingEmailField = fields.find((field) => field.label === 'Billing email');

    expect(nameField?.inlineEdit?.value).toBe('Apex Group');
    expect(slugField?.inlineEdit?.value).toBe('apex');
    expect(billingEmailField?.inlineEdit?.type).toBe('email');

    await billingEmailField?.inlineEdit?.onSave('new-billing@example.test');

    expect(onInlineUpdate).toHaveBeenCalledWith({
      billingEmail: 'new-billing@example.test',
    });
  });

  it('keeps enum and metadata fields read-only until generated controls support them', () => {
    const fields = buildOrganizationDetailFields({ organization, onInlineUpdate: vi.fn() });

    expect(fields.find((field) => field.label === 'Plan')?.inlineEdit).toBeUndefined();
    expect(fields.find((field) => field.label === 'Status')?.inlineEdit).toBeUndefined();
    expect(fields.find((field) => field.label === 'Environment')?.inlineEdit).toBeUndefined();
    expect(fields.find((field) => field.label === 'Members')?.inlineEdit).toBeUndefined();
    expect(fields.find((field) => field.label === 'Created')?.inlineEdit).toBeUndefined();
  });
});
