import { cn, Drawer, DrawerContent, DrawerTitle } from '@oktavius/base-ui';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import {
  APP_MAIN_FIT_CLASS,
  APP_MAIN_GUTTER_CLASS,
  APP_MAIN_SCROLL_CLASS,
  APP_WORKSPACE_COLUMN_CLASS,
} from '@/components/common/pageChrome';
import { rememberHealthyRoute } from '@/core/errors/chunkLoadRecovery';
import { sonnerToasterProps } from '@/lib/toast';

import { AIChatSidebar } from './AIChatSidebar';
import { AppShellLayoutProvider, useAppShellLayout } from './AppShellLayoutContext';
import { Header } from './Header';
import { MobileTopBar } from './MobileTopBar';
import { Sidebar } from './Sidebar';

function AppLayoutMain({ isAgentChatRoute }: { isAgentChatRoute: boolean }) {
  const { hasSecondaryNav, hasFillHeightPage } = useAppShellLayout();
  const isFitMain = isAgentChatRoute || hasSecondaryNav || hasFillHeightPage;

  return (
    <main
      id="app-main-content"
      className={cn(isFitMain ? APP_MAIN_FIT_CLASS : APP_MAIN_SCROLL_CLASS, APP_MAIN_GUTTER_CLASS)}
    >
      <div className={cn(isFitMain && 'flex min-h-0 flex-1 flex-col')}>
        <Outlet />
      </div>
    </main>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    rememberHealthyRoute(`${pathname}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  const isAgentChatRoute = pathname === '/ai-chat';
  const showDesktopChatRail = !isAgentChatRoute;

  return (
    <AppShellLayoutProvider>
      <div className="flex h-dvh max-h-dvh min-w-0 overflow-hidden bg-muted/40">
        <a
          href="#app-main-content"
          className="absolute left-3 top-3 z-50 -translate-y-16 rounded-md border bg-card px-3 py-2 text-sm text-foreground shadow-elevated transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>

        {/* Left: navigation (desktop rail always visible from md up) */}
        <div className="relative z-40 hidden shrink-0 md:flex" aria-label="Application navigation">
          <Sidebar />
        </div>

        {/* Mobile nav drawer — Radix focus trap + Escape; replaces hand-rolled overlay */}
        <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <DrawerContent
            side="left"
            showCloseButton={false}
            className="md:hidden gap-0 overflow-hidden p-0 shadow-elevated"
            aria-label="Navigation menu"
          >
            <DrawerTitle className="sr-only">Navigation</DrawerTitle>
            <Sidebar embedded onNavigate={() => setSidebarOpen(false)} />
          </DrawerContent>
        </Drawer>

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
            <AppLayoutMain isAgentChatRoute={isAgentChatRoute} />
          </div>

          {showDesktopChatRail ? (
            <div
              className="hidden min-h-0 shrink-0 xl:flex"
              aria-label="Agent chat"
              role="complementary"
            >
              <AIChatSidebar />
            </div>
          ) : null}
        </div>

        <Toaster position="top-right" richColors closeButton {...sonnerToasterProps} />
      </div>
    </AppShellLayoutProvider>
  );
}
