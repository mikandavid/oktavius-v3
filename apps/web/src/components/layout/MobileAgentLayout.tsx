import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';

import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';

type MobileAgentLayoutProps = {
  sidebar: ReactNode;
  chat: ReactNode;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  className?: string;
};

export function MobileAgentLayout({
  sidebar,
  chat,
  showSidebar,
  onToggleSidebar,
  className,
}: MobileAgentLayoutProps) {
  return (
    <div className={cn('relative flex h-full min-h-0', className)}>
      <div
        className={cn(
          'absolute inset-y-0 left-0 z-20 w-[min(100%,20rem)] border-r transition-transform md:relative md:translate-x-0',
          APP_SHELL_BORDER_CLASS,
          APP_SHELL_SURFACE_CLASS,
          showSidebar ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </div>
      {!showSidebar ? (
        <button
          type="button"
          className={cn(
            'absolute left-3 top-3 z-10 rounded-md border px-2 py-1 text-xs md:hidden',
            APP_SHELL_BORDER_CLASS,
            APP_SHELL_SURFACE_CLASS,
          )}
          onClick={onToggleSidebar}
        >
          History
        </button>
      ) : null}
      <div className="min-w-0 flex-1">{chat}</div>
    </div>
  );
}
