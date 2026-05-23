import { OsirisChatShell } from '@/components/layout/OsirisChatShell';

/** Full center column on /ai-chat (right chat rail is hidden in AppLayout). */
export function AgentChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-6">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-card bg-card shadow-card">
        <OsirisChatShell mode="page" className="min-h-0 flex-1" />
      </div>
    </div>
  );
}
