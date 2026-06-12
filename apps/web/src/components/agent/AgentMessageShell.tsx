import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { OctopusIcon } from './OctopusIcon';

type AgentMessageShellProps = {
  children: ReactNode;
  className?: string;
  withAvatar?: boolean;
};

/** Left-aligned agent content row with octopus avatar rail — matches osiris_erp. */
export function AgentMessageShell({
  children,
  className,
  withAvatar = true,
}: AgentMessageShellProps) {
  return (
    <div className={cn('relative', withAvatar && 'pl-9', className)}>
      {withAvatar ? (
        <div className="absolute left-0 flex w-7 justify-center">
          <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background">
            <OctopusIcon className="h-6 w-6 -translate-x-[0.5px]" aria-hidden="true" />
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
