import { cn } from '@oktavius/base-ui';
import type { ElementType, ReactNode } from 'react';

type Gap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const GAP: Record<Gap, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-10',
};

export interface StackProps {
  as?: ElementType;
  gap?: Gap;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  children: ReactNode;
}

/**
 * Vertical stack. Primary layout primitive for "things in a column".
 * Default gap=md (1rem). Use inside SectionCard / templates.
 */
export function Stack({
  as: Tag = 'div',
  gap = 'md',
  align = 'stretch',
  className,
  children,
}: StackProps) {
  return (
    <Tag
      className={cn(
        'flex flex-col',
        GAP[gap],
        align === 'start' && 'items-start',
        align === 'center' && 'items-center',
        align === 'end' && 'items-end',
        align === 'stretch' && 'items-stretch',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
