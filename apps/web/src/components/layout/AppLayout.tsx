import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import { TooltipProvider, cn } from '@oktavius/base-ui';

import {
  APP_MAIN_FIT_CLASS,
  APP_MAIN_GUTTER_CLASS,
  APP_MAIN_SCROLL_CLASS,
  APP_WORKSPACE_COLUMN_CLASS,
} from '@/components/common/pageChrome';
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

  const isAgentChatRoute = pathname === '/ai-chat';
  const showDesktopChatRail = !isAgentChatRoute;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-dvh max-h-dvh min-w-0 overflow-hidden bg-muted/40">
        <a
          href="#app-main-content"
          className="absolute left-3 top-3 z-50 -translate-y-16 rounded-md border bg-card px-3 py-2 text-sm text-foreground shadow-elevated transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>

        {/* Left: navigation (desktop rail always visible from md up) */}
        <div className="hidden shrink-0 md:flex" aria-label="Application navigation">
          <Sidebar />
        </div>

        {/* Mobile nav drawer */}
        {sidebarOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-foreground/15 backdrop-blur-[1px] md:hidden"
              aria-label="Close navigation menu"
              onClick={() => setSidebarOpen(false)}
            />
            <Sidebar mobile open onNavigate={() => setSidebarOpen(false)} />
          </>
        ) : null}

        {/* Center + right: workspace and agent chat */}
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className={APP_WORKSPACE_COLUMN_CLASS} role="region" aria-label="Workspace">
            <MobileTopBar
              onToggleSidebar={() => setSidebarOpen((current) => !current)}
              showChatLink={showDesktopChatRail}
            />
            <div className="hidden md:block">
              <Header />
            </div>
            <main
              id="app-main-content"
              className={cn(
                isAgentChatRoute ? APP_MAIN_FIT_CLASS : APP_MAIN_SCROLL_CLASS,
                !isAgentChatRoute && APP_MAIN_GUTTER_CLASS,
              )}
            >
              <Outlet />
            </main>
          </div>

          {showDesktopChatRail ? (
            <div className="hidden min-h-0 shrink-0 lg:flex" aria-label="Agent chat" role="complementary">
              <AIChatSidebar />
            </div>
          ) : null}
        </div>

        <Toaster position="top-right" richColors closeButton />
      </div>
    </TooltipProvider>
  );
}
