export type ChangeType = 'added' | 'improved' | 'fixed';

export interface ChangelogItem {
  type: ChangeType;
  text: string;
}

export interface ChangelogRelease {
  version: string;
  /** ISO date string, e.g. "2026-06-17". */
  date: string;
  title?: string;
  items: ChangelogItem[];
}

export interface ChangelogResult {
  releases: ChangelogRelease[];
}
