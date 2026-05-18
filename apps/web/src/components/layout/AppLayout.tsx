import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import { TooltipProvider, cn } from '@oktavius/base-ui';

import { APP_MAIN_GUTTER_CLASS } from '@/components/common/pageChrome';

import { AIChatSidebar } from './AIChatSidebar';
import { Header } from './Header';
import { MobileTopBar } from './MobileTopBar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const showDesktopChatRail = pathname !== '/ai-chat';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-dvh max-h-dvh overflow-hidden">
        <a
          href="#app-main-content"
          className="absolute left-3 top-3 z-50 -translate-y-16 rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div className="flex h-dvh max-h-dvh overflow-hidden">
          <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

          <div className="flex h-dvh max-h-dvh min-w-0 flex-1 overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <MobileTopBar onToggleSidebar={() => setSidebarOpen((current) => !current)} />
              <div className="hidden md:block">
                <Header />
              </div>
              <main
                id="app-main-content"
                className={cn('min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/40', APP_MAIN_GUTTER_CLASS)}
              >
                <Outlet />
              </main>
            </div>

            {showDesktopChatRail ? <AIChatSidebar /> : null}
          </div>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </TooltipProvider>
  );
}
