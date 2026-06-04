import type { Dispatch, SetStateAction } from 'react';

import type { PartyRecord } from '@/app/demo-data';
import { ApiValidationError, type PartiesHandlers } from '@/api/demo-client';

type BuildPartiesDemoHandlersOptions = {
  getParties: () => PartyRecord[];
  setParties: Dispatch<SetStateAction<PartyRecord[]>>;
};

function validatePartyInput(input: Partial<Pick<PartyRecord, 'name' | 'role'>>) {
  const fieldErrors: Record<string, string> = {};

  if (!input.name?.trim()) {
    fieldErrors.name = 'Name is required.';
  }
  if (!input.role?.trim()) {
    fieldErrors.role = 'Role is required.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('Contact could not be saved.', fieldErrors);
  }
}

function trimParty(input: PartyRecord): PartyRecord {
  return {
    ...input,
    salutation: input.salutation?.trim(),
    name: input.name.trim(),
    role: input.role.trim(),
    email: input.email.trim(),
  };
}

export function buildPartiesDemoHandlers(
  options: BuildPartiesDemoHandlersOptions,
): PartiesHandlers {
  return {
    async create(input) {
      validatePartyInput(input);
      const next = trimParty({
        ...input,
        id: `pty_${Date.now()}`,
      });
      options.setParties((current) => [...current, next]);
      return next;
    },
  };
}
