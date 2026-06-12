import { cn } from '@oktavius/base-ui';

import { FormattedText } from '@/components/common/FormattedText';
import { extractGoogleMapsUrls, GoogleMapsPreviewButton } from '@/components/maps/GoogleMapsDialog';

import { AgentConfirmationCard } from './AgentConfirmationCard';
import { formatToolName, getToolIcon } from './agentHelpers';
import { renderAgentCard } from './cards';
import { AgentPythonExecutionCard } from './cards/AgentPythonExecutionCard';
import { OctopusIcon } from './OctopusIcon';
import { StructuredContent } from './structured/StructuredContent';
import type { AgentMessage } from './types';
import { ChatUIComponent } from './UIComponentRegistry';

type MessageGroup =
  | { kind: 'chain'; items: { message: AgentMessage; index: number }[] }
  | { kind: 'single'; message: AgentMessage; index: number };

type AgentMessageListProps = {
  messages: AgentMessage[];
  onConfirmationRespond?: (messageId: string, approved: boolean) => void;
  onSkillApprovalRespond?: (messageId: string, approved: boolean) => void | Promise<void>;
  className?: string;
};

function isChainMessage(message: AgentMessage) {
  return (
    message.role === 'assistant' ||
    message.role === 'confirmation' ||
    message.role === 'card' ||
    message.role === 'tool'
  );
}

function buildMessageGroups(messages: AgentMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  messages.forEach((message, index) => {
    if (isChainMessage(message)) {
      const last = groups[groups.length - 1];
      if (last?.kind === 'chain') {
        last.items.push({ message, index });
      } else {
        groups.push({ kind: 'chain', items: [{ message, index }] });
      }
      return;
    }

    groups.push({ kind: 'single', message, index });
  });

  return groups;
}

export function AgentMessageList({
  messages,
  onConfirmationRespond,
  onSkillApprovalRespond,
  className,
}: AgentMessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {buildMessageGroups(messages).map((group) =>
        group.kind === 'single' ? (
          <UserMessageRow key={group.message.id} message={group.message} />
        ) : (
          <ChainMessageGroup
            key={`chain-${group.items[0].message.id}`}
            items={group.items}
            onConfirmationRespond={onConfirmationRespond}
            onSkillApprovalRespond={onSkillApprovalRespond}
          />
        ),
      )}
    </div>
  );
}

function UserMessageRow({ message }: { message: AgentMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className="rounded-control rounded-tr-sm border border-border/70 bg-muted/40 px-3 py-2 text-sm text-foreground">
          <FormattedText text={message.content ?? ''} />
        </div>
      </div>
    </div>
  );
}

function ChainMessageGroup({
  items,
  onConfirmationRespond,
  onSkillApprovalRespond,
}: {
  items: { message: AgentMessage; index: number }[];
  onConfirmationRespond?: (messageId: string, approved: boolean) => void;
  onSkillApprovalRespond?: (messageId: string, approved: boolean) => void | Promise<void>;
}) {
  const multipleItems = items.length > 1;

  return (
    <div className="relative pl-9">
      {multipleItems ? (
        <div className="absolute bottom-3.5 left-[13px] top-3.5 w-px bg-border" />
      ) : null}

      <div className="space-y-2.5">
        {items.map(({ message }) => (
          <ChainMessageRow
            key={message.id}
            message={message}
            onConfirmationRespond={onConfirmationRespond}
            onSkillApprovalRespond={onSkillApprovalRespond}
          />
        ))}
      </div>
    </div>
  );
}

function ChainMessageRow({
  message,
  onConfirmationRespond,
  onSkillApprovalRespond,
}: {
  message: AgentMessage;
  onConfirmationRespond?: (messageId: string, approved: boolean) => void;
  onSkillApprovalRespond?: (messageId: string, approved: boolean) => void | Promise<void>;
}) {
  const isToolMessage = message.role === 'tool' && message.toolName;
  const ToolIcon = message.toolName ? getToolIcon(message.toolName) : null;
  const toolStatus =
    message.toolResult && message.toolResult.toLowerCase().includes('error') ? 'error' : 'done';

  return (
    <div className="relative flex items-start">
      <div className="absolute -left-9 flex w-7 justify-center">
        {message.role === 'assistant' ? (
          <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background">
            <OctopusIcon className="h-6 w-6 -translate-x-[0.5px]" aria-hidden="true" />
          </div>
        ) : isToolMessage && ToolIcon ? (
          <div
            className={cn(
              'relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border bg-background transition-colors',
              toolStatus === 'error'
                ? 'border-destructive/40 text-destructive/80'
                : 'border-border text-muted-foreground',
            )}
          >
            <ToolIcon size={14} />
          </div>
        ) : null}
      </div>

      {message.role === 'assistant' ? (
        <div className="min-w-0 flex-1 break-words text-sm text-foreground [overflow-wrap:anywhere]">
          <StructuredContent text={message.content ?? ''} className="leading-relaxed" />
          {(() => {
            const urls = extractGoogleMapsUrls(message.content ?? '');
            if (urls.length === 0) return null;
            return (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {urls.map((url) => (
                  <GoogleMapsPreviewButton key={url} url={url} />
                ))}
              </div>
            );
          })()}
          {message.ui ? (
            <div className="mt-2">
              <ChatUIComponent name={message.ui.component} props={message.ui.props} />
            </div>
          ) : null}
        </div>
      ) : null}

      {message.role === 'confirmation' && message.confirmation ? (
        <div className="min-w-0 flex-1">
          <AgentConfirmationCard
            confirmation={message.confirmation}
            onRespond={(approved) => onConfirmationRespond?.(message.id, approved)}
          />
        </div>
      ) : null}

      {isToolMessage && message.toolName === 'python_execute' ? (
        <div className="min-w-0 flex-1 py-0.5">
          <AgentPythonExecutionCard
            kind="python"
            summary={
              (message.toolInput?.summary as string | undefined) ??
              message.toolResult ??
              'Running Python code…'
            }
            code={message.toolInput?.code as string | undefined}
            status={toolStatus === 'error' ? 'error' : 'done'}
            output={message.toolResult}
            error={toolStatus === 'error' ? message.toolResult : undefined}
          />
        </div>
      ) : null}

      {isToolMessage && message.toolName !== 'python_execute' ? (
        <div className="min-w-0 flex-1 break-words py-0.5 leading-relaxed [overflow-wrap:anywhere]">
          <span
            className={cn(
              'text-[12px] font-medium uppercase tracking-wide',
              toolStatus === 'error' ? 'text-destructive/70' : 'text-primary/50',
            )}
          >
            {formatToolName(message.toolName!)}
          </span>
          {message.toolResult ? (
            <div className="mt-0.5 text-[13px] text-muted-foreground">{message.toolResult}</div>
          ) : null}
          {message.ui ? (
            <div className="mt-2">
              <ChatUIComponent name={message.ui.component} props={message.ui.props} />
            </div>
          ) : null}
        </div>
      ) : null}

      {message.role === 'card' && message.card ? (
        <div className="min-w-0 flex-1">
          {renderAgentCard(message.card, {
            onSkillApprovalRespond: (approved) => onSkillApprovalRespond?.(message.id, approved),
          })}
        </div>
      ) : null}
    </div>
  );
}
