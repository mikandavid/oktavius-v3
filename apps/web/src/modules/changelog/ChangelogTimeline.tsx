import { ChangelogReleaseItem } from './ChangelogReleaseItem';
import type { ChangelogRelease } from './data/types';

export function ChangelogTimeline({ releases }: { releases: ChangelogRelease[] }) {
  return (
    <ol className="relative ml-1.5 space-y-4 border-l border-border">
      {releases.map((release) => (
        <ChangelogReleaseItem key={release.version} release={release} />
      ))}
    </ol>
  );
}
