import type { Dispatch, SetStateAction } from 'react';

import type { CaseChecklistItem } from '@/app/demo-data';
import { ApiValidationError, type CaseChecklistsHandlers } from '@/api/demo-client';

type BuildCaseChecklistsDemoHandlersOptions = {
  getItems: () => CaseChecklistItem[];
  setItems: Dispatch<SetStateAction<CaseChecklistItem[]>>;
};

function validateChecklistInput(input: Partial<Pick<CaseChecklistItem, 'label'>>) {
  const fieldErrors: Record<string, string> = {};

  if (!input.label?.trim()) {
    fieldErrors.label = 'Checklist item is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Checklist item could not be saved.', fieldErrors);
  }
}

function trimChecklistItem(input: CaseChecklistItem): CaseChecklistItem {
  return {
    ...input,
    label: input.label.trim(),
  };
}

export function buildCaseChecklistsDemoHandlers({
  getItems,
  setItems,
}: BuildCaseChecklistsDemoHandlersOptions): CaseChecklistsHandlers {
  return {
    async create(input) {
      validateChecklistInput(input);
      const next = trimChecklistItem({
        ...input,
        id: `chk_${Date.now()}`,
        done: false,
      });
      setItems((current) => [...current, next]);
      return next;
    },

    async updateDone(id, done) {
      const existing = getItems().find((item) => item.id === id);
      if (!existing) {
        throw new Error('Checklist item not found.');
      }
      const updated = { ...existing, done };
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
  };
}
