import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiProxyTarget =
  process.env.VITE_OKTAVIUS_API_PROXY_TARGET?.trim() ||
  process.env.OKTAVIUS_API_PROXY_TARGET?.trim() ||
  'http://127.0.0.1:5176';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react') ||
            id.includes('/node_modules/react-dom') ||
            id.includes('/node_modules/scheduler')
          ) {
            return 'react-vendor';
          }
          if (
            id.includes('/node_modules/react-router-dom') ||
            id.includes('/node_modules/@remix-run') ||
            id.includes('/node_modules/nuqs') ||
            id.includes('/node_modules/@tanstack')
          ) {
            return 'app-vendor';
          }
          // Split Sentry (init + replay + tracing) out of the entry chunk; it
          // still loads eagerly via instrument.ts but must not bloat the
          // budgeted entry bundle.
          if (id.includes('/node_modules/@sentry')) {
            return 'sentry-vendor';
          }
          if (
            id.includes('/node_modules/@1771technologies') ||
            id.includes('/node_modules/@dnd-kit')
          ) {
            return 'interaction-vendor';
          }
          if (id.includes('/node_modules/@radix-ui') || id.includes('/node_modules/cmdk')) {
            return 'primitive-vendor';
          }
          if (id.includes('/node_modules/@phosphor-icons')) {
            return 'icons-vendor';
          }
          if (id.includes('/node_modules/xlsx')) {
            return 'xlsx-vendor';
          }
          if (
            id.includes('/node_modules/recharts') ||
            id.includes('/packages/base-ui/src/components/chart') ||
            id.includes('/packages/base-ui/src/lib/chartPalette')
          ) {
            return 'chart-ui';
          }
          if (
            id.includes('/node_modules/@tiptap') ||
            id.includes('/node_modules/prosemirror') ||
            id.includes('/packages/base-ui/src/components/rich-text-editor') ||
            id.includes('/packages/base-ui/src/lib/rich-text')
          ) {
            return 'rich-text-ui';
          }
          if (
            id.includes('/apps/web/src/components/agent/') ||
            id.includes('/apps/web/src/components/agent/page-context') ||
            id.includes('/apps/web/src/components/command/') ||
            id.includes('/apps/web/src/components/layout/AccountMenuSections') ||
            id.includes('/apps/web/src/components/layout/ActiveLocation') ||
            id.includes('/apps/web/src/components/layout/AIChatSidebar') ||
            id.includes('/apps/web/src/components/layout/AppLayout') ||
            id.includes('/apps/web/src/components/layout/AppShell') ||
            id.includes('/apps/web/src/components/layout/BrandMark') ||
            id.includes('/apps/web/src/components/layout/ChatComposer') ||
            id.includes('/apps/web/src/components/layout/ConversationHistoryPanel') ||
            id.includes('/apps/web/src/components/layout/Header') ||
            id.includes('/apps/web/src/components/layout/LocationSitesDetailList') ||
            id.includes('/apps/web/src/components/layout/MobileAgentLayout') ||
            id.includes('/apps/web/src/components/layout/MobileTopBar') ||
            id.includes('/apps/web/src/components/layout/NotificationPanel') ||
            id.includes('/apps/web/src/components/layout/OsirisChatShell') ||
            id.includes('/apps/web/src/components/layout/ShortcutHelp') ||
            id.includes('/apps/web/src/components/layout/Sidebar') ||
            id.includes('/apps/web/src/components/errors/')
          ) {
            return 'shell';
          }
          if (
            id.includes('/packages/base-ui/src/lib/') ||
            id.includes('/packages/base-ui/src/components/button') ||
            id.includes('/packages/base-ui/src/components/input') ||
            id.includes('/packages/base-ui/src/components/label') ||
            id.includes('/packages/base-ui/src/components/card') ||
            id.includes('/packages/base-ui/src/components/badge') ||
            id.includes('/packages/base-ui/src/components/section-card') ||
            id.includes('/packages/base-ui/src/components/skeleton') ||
            id.includes('/packages/base-ui/src/components/list-row') ||
            id.includes('/packages/base-ui/src/components/tooltip') ||
            id.includes('/packages/base-ui/src/components/separator') ||
            id.includes('/packages/base-ui/src/components/form-field') ||
            id.includes('/packages/base-ui/src/components/split-view')
          ) {
            return 'base-ui-core';
          }
          if (
            id.includes('/apps/web/src/app/demo-data') ||
            id.includes('/apps/web/src/components/demo/')
          ) {
            return 'demo-data';
          }
          if (id.includes('/apps/web/src/app/agent-chat-data')) {
            return 'agent-chat-data';
          }
        },
      },
    },
  },
});
