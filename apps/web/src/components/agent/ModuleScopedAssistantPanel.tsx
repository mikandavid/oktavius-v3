import { SectionCard } from '@oktavius/base-ui';

import { useAgentPageContext } from '@/components/agent/page-context';
import { AgentChatShell } from '@/components/layout/AgentChatShell';

/** Embedded assistant surface for module/detail workspaces using the active page context. */
export function ModuleScopedAssistantPanel() {
  const pageContext = useAgentPageContext();
  const meta = [pageContext.moduleLabel, pageContext.routeLabel].filter(Boolean).join(' · ');

  return (
    <SectionCard title="Assistant" meta={meta || 'Current module context'}>
      <div className="h-[34rem] min-h-[28rem] overflow-hidden rounded-control border border-border/70">
        <AgentChatShell mode="module" className="h-full max-h-full" />
      </div>
    </SectionCard>
  );
}
