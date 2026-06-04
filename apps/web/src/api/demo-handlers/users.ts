import type { Dispatch, SetStateAction } from 'react';

import type { UserRecord } from '@/app/demo-data';
import {
  ApiValidationError,
  type ListResponse,
  type UsersHandlers,
  type UsersListParams,
} from '@/api/demo-client';
import { sortRows } from '@/lib/sortRows';

type BuildUsersDemoHandlersOptions = {
  getUsers: () => UserRecord[];
  setUsers: Dispatch<SetStateAction<UserRecord[]>>;
};

const USER_SEARCH_KEYS: Array<keyof UserRecord> = ['name', 'email', 'team'];

function matchesUser(row: UserRecord, params: UsersListParams) {
  const search = params.search?.trim().toLowerCase() ?? '';
  const matchesSearch =
    search.length === 0 ||
    USER_SEARCH_KEYS.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(search),
    );

  const matchesRole = !params.role || row.role === params.role;
  const matchesStatus = !params.status || row.status === params.status;

  return matchesSearch && matchesRole && matchesStatus;
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? '';
}

function validateUserInput(
  users: UserRecord[],
  input: Partial<Pick<UserRecord, 'email' | 'name'>>,
  currentId?: string,
) {
  const fieldErrors: Record<string, string> = {};

  if (!input.name?.trim()) {
    fieldErrors.name = 'User name is required.';
  }
  if (!input.email?.trim()) {
    fieldErrors.email = 'Email is required.';
  }

  const email = normalizeEmail(input.email);
  if (
    email &&
    users.some((user) => user.id !== currentId && normalizeEmail(user.email) === email)
  ) {
    fieldErrors.email = 'A user with this email already exists.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiValidationError('User could not be saved.', fieldErrors);
  }
}

export function buildUsersDemoHandlers({
  getUsers,
  setUsers,
}: BuildUsersDemoHandlersOptions): UsersHandlers {
  return {
    async list(params): Promise<ListResponse<UserRecord>> {
      const page = Math.max(1, Number(params.page ?? 1) || 1);
      const pageSize = Math.max(1, Number(params.pageSize ?? 10) || 10);
      const sort = params.sort ?? 'name';

      const filtered = sortRows(
        getUsers().filter((row) => matchesUser(row, params)),
        sort,
      );
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        total,
        totalPages,
        page: safePage,
        pageSize,
      };
    },

    async get(id) {
      return getUsers().find((user) => user.id === id) ?? null;
    },

    async create(input) {
      validateUserInput(getUsers(), input);
      const next: UserRecord = {
        ...input,
        id: `usr_${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim(),
      };
      setUsers((current) => [next, ...current]);
      return next;
    },

    async update(id, input) {
      const existing = getUsers().find((user) => user.id === id);
      if (!existing) {
        throw new Error('User not found.');
      }
      validateUserInput(getUsers(), { ...existing, ...input }, id);

      const updated: UserRecord = {
        ...existing,
        ...input,
        name: input.name == null ? existing.name : input.name.trim(),
        email: input.email == null ? existing.email : input.email.trim(),
      };
      setUsers((current) => current.map((user) => (user.id === id ? updated : user)));
      return updated;
    },

    async delete(id) {
      setUsers((current) => current.filter((user) => user.id !== id));
    },
  };
}
