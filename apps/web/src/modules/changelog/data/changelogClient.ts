import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

import type { ChangelogItem, ChangelogRelease, ChangelogResult, ChangeType } from './types';

export type ChangelogClientOptions = { baseUrl?: string };

const CHANGE_TYPES: readonly ChangeType[] = ['added', 'improved', 'fixed'];

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeItem(value: unknown): ChangelogItem | null {
  const item = readRecord(value);
  const text = readString(item.text);
  if (!text) return null;
  return { type: oneOf(CHANGE_TYPES, item.type, 'improved'), text };
}

function normalizeRelease(value: unknown): ChangelogRelease {
  const v = readRecord(value);
  const itemsRaw = Array.isArray(v.items) ? v.items : [];
  const items = itemsRaw.map(normalizeItem).filter((item): item is ChangelogItem => item !== null);
  return {
    version: readString(v.version),
    date: readString(v.date),
    title: readStringOrNull(v.title) ?? undefined,
    items,
  };
}

export function createChangelogClient(options: ChangelogClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  return {
    async listReleases(): Promise<ChangelogResult> {
      const response = await fetch(url('/changelog'), { credentials: 'include' });
      if (response.status === 404) return { releases: [] };
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Changelog could not be loaded.'));
      }
      const payload = readRecord(await response.json());
      const releases = (Array.isArray(payload.releases) ? payload.releases : []).map(
        normalizeRelease,
      );
      releases.sort((left, right) =>
        left.date < right.date ? 1 : left.date > right.date ? -1 : 0,
      );
      return { releases };
    },
  };
}
