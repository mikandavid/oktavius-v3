import { describe, expect, it } from 'vitest';

import type { CaseChecklistItem } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildCaseChecklistsDemoHandlers } from './case-checklists';

const baseItem: CaseChecklistItem = {
  id: 'chk_1',
  caseId: 'case_1',
  label: 'Existing item',
  done: false,
  required: true,
};

function createHandlers(seed: CaseChecklistItem[] = [baseItem]) {
  let items = seed;
  return {
    handlers: buildCaseChecklistsDemoHandlers({
      getItems: () => items,
      setItems: (next) => {
        items = typeof next === 'function' ? next(items) : next;
      },
    }),
    getItems: () => items,
  };
}

describe('buildCaseChecklistsDemoHandlers', () => {
  it('rejects missing labels with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        caseId: 'case_1',
        label: ' ',
        required: true,
      }),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { label: 'Checklist item is required.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates and toggles checklist items through the API registry contract', async () => {
    const { getItems, handlers } = createHandlers([]);

    const created = await handlers.create({
      caseId: 'case_1',
      label: ' New checklist item ',
      required: true,
    });

    expect(created.id).toMatch(/^chk_/);
    expect(created.label).toBe('New checklist item');
    expect(created.done).toBe(false);
    expect(getItems()).toEqual([created]);

    const updated = await handlers.updateDone(created.id, true);

    expect(updated.done).toBe(true);
    expect(getItems()).toEqual([updated]);
  });
});
