import { Fragment } from 'react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {isLast || !item.href ? (
                  <span
                    className={cn(
                      'truncate',
                      isLast ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                ) : (
                  <a href={item.href} className="truncate transition-colors hover:text-foreground">
                    {item.label}
                  </a>
                )}
              </li>
              {!isLast ? (
                <li aria-hidden className="select-none text-border">
                  /
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
