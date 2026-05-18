import { OsirisChatShell } from '@/components/layout/OsirisChatShell';

export function AgentChatPage() {
  return (
    <div className="flex h-full min-h-0 max-h-full">
      <div className="flex h-full min-h-0 max-h-full flex-1 overflow-hidden rounded-md border bg-background">
        <OsirisChatShell mode="page" />
      </div>
    </div>
  );
}
