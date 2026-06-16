import { AgentChatShell } from '@/components/layout/AgentChatShell';

export function AIChatPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <AgentChatShell mode="page" className="h-full min-h-0" />
    </div>
  );
}
