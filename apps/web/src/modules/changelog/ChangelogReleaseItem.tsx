import { ChangeBadge } from './ChangeBadge';
import type { ChangelogRelease } from './data/types';

function formatReleaseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function ChangelogReleaseItem({ release }: { release: ChangelogRelease }) {
  return (
    <li className="relative pl-8">
      <span
        aria-hidden
        className="absolute left-0 top-2 flex h-3 w-3 -translate-x-1/2 items-center justify-center"
      >
        <span className="h-2.5 w-2.5 rounded-full border-2 border-background bg-muted-foreground/40" />
      </span>
      <div className="rounded-card bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {release.version}
          </h2>
          <span className="text-xs text-muted-foreground">{formatReleaseDate(release.date)}</span>
        </div>
        {release.title ? (
          <p className="mt-1 text-sm text-muted-foreground">{release.title}</p>
        ) : null}
        {release.items.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {release.items.map((item, index) => (
              <li key={`${release.version}-${index}`} className="flex items-start gap-2.5">
                <ChangeBadge type={item.type} />
                <span className="text-sm leading-relaxed text-foreground/90">{item.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
