import { cn } from '../lib/utils';
import { Skeleton } from './skeleton';

/** Full-page loading skeleton that mirrors a ModulePage + content layout. */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-control" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-card bg-card">
        <div className="border-b border-border/50 px-4 py-3">
          <Skeleton className="h-3.5 w-32" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5" style={{ width: `${60 + (i % 3) * 15}%` }} />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compact detail-page loading skeleton. */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="rounded-card bg-card p-4 space-y-4">
        {Array.from({ length: 2 }).map((_, s) => (
          <div key={s} className={s > 0 ? 'space-y-3 border-t border-border/40 pt-4' : 'space-y-3'}>
            <Skeleton className="h-3 w-24" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
