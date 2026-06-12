import { applyKanbanMove, Badge, Button, KanbanBoard, ListRow, Timeline } from '@oktavius/base-ui';
import { useState } from 'react';

import { AgentConfirmationCard } from '@/components/agent/AgentConfirmationCard';
import { AgentToolCallCard } from '@/components/agent/AgentToolCallCard';
import { ChecklistSection } from '@/components/common/ChecklistSection';
import { FormattedText } from '@/components/common/FormattedText';
import { ApprovalHistory } from '@/components/workflow/ApprovalHistory';
import { type ApprovalItem, ApprovalPanel } from '@/components/workflow/ApprovalPanel';
import { type CommentItem, CommentsPanel } from '@/components/workflow/CommentsPanel';
import { MentionComposer } from '@/components/workflow/MentionComposer';
import { TaskInbox, type TaskInboxItem } from '@/components/workflow/TaskInbox';
import { UserIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

type KanbanTask = { id: string; title: string; assignee: string };

const INITIAL_CHECKLIST = [
  { id: 'chk_a', label: 'Review contract terms', done: true, required: true },
  { id: 'chk_b', label: 'Confirm billing contact', done: false, required: true },
  { id: 'chk_c', label: 'Schedule kickoff call', done: false },
];

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'cmt_1',
    author: 'Anna Hofer',
    body: 'Client confirmed the updated payment terms.',
    createdAt: '2024-12-05T10:30:00Z',
  },
  {
    id: 'cmt_2',
    author: 'Markus Leitner',
    body: 'Internal: waiting on legal review.',
    createdAt: '2024-12-05T11:15:00Z',
    internal: true,
  },
];

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'appr_1',
    title: 'Purchase order SO-2024-1101',
    requester: 'Nina Weiss',
    submittedAt: '2024-12-04',
    status: 'pending',
    amount: 15800,
    currency: 'EUR',
    note: 'Warehouse integration hardware bundle.',
  },
  {
    id: 'appr_2',
    title: 'Contract renewal CTR-2024-088',
    requester: 'Markus Leitner',
    submittedAt: '2024-12-03',
    status: 'pending',
  },
];

const TASK_ITEMS: TaskInboxItem[] = [
  {
    id: 't1',
    title: 'Send renewal proposal',
    module: 'Clients',
    assignee: 'Anna Hofer',
    dueAt: '2024-12-15',
    priority: 'High',
    status: 'Open',
  },
  {
    id: 't2',
    title: 'UAT sign-off',
    module: 'Projects',
    assignee: 'Anna Hofer',
    dueAt: '2025-01-10',
    priority: 'Normal',
    status: 'In progress',
  },
  {
    id: 't3',
    title: 'Reconcile November invoices',
    module: 'Cases',
    assignee: 'Markus Leitner',
    dueAt: '2024-12-08',
    priority: 'Urgent',
    status: 'Open',
  },
];

export function WorkflowSection() {
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [readOnlyChecklist, setReadOnlyChecklist] = useState(false);
  const [mentionDraft, setMentionDraft] = useState(
    'Please review @anna — details at https://oktavius.app/docs',
  );

  const [kanbanColumns, setKanbanColumns] = useState([
    {
      id: 'intake',
      title: 'Intake',
      items: [
        { id: 'task_1', title: 'Verify client documents', assignee: 'Anna Hofer' },
        { id: 'task_2', title: 'Assign account manager', assignee: 'Nina Weiss' },
      ] satisfies KanbanTask[],
    },
    {
      id: 'active',
      title: 'Active',
      items: [
        { id: 'task_3', title: 'Configure workspace', assignee: 'Markus Leitner' },
      ] satisfies KanbanTask[],
    },
    {
      id: 'done',
      title: 'Done',
      items: [
        { id: 'task_4', title: 'Send welcome email', assignee: 'Anna Hofer' },
      ] satisfies KanbanTask[],
    },
  ]);

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="ChecklistSection"
        meta="Tick-off · done = strikethrough + muted"
        actions={
          <Button size="sm" variant="outline" onClick={() => setReadOnlyChecklist((v) => !v)}>
            {readOnlyChecklist ? 'Enable editing' : 'Read-only preview'}
          </Button>
        }
      >
        <ChecklistSection
          title="Onboarding checklist"
          items={checklist}
          readOnly={readOnlyChecklist}
          onToggle={(id, done) => {
            setChecklist((current) =>
              current.map((item) => (item.id === id ? { ...item, done } : item)),
            );
          }}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="TaskInbox" meta="Cross-module assigned work queue">
        <TaskInbox items={TASK_ITEMS} onItemClick={(id) => appToast.info(`Open task ${id}`)} />
      </ShowcaseBlock>

      <div className="grid gap-4 lg:grid-cols-2">
        <ShowcaseBlock title="FormattedText" meta="Links · @mentions in read-only text">
          <FormattedText text={mentionDraft} className="text-sm leading-6 text-foreground" />
        </ShowcaseBlock>
        <ShowcaseBlock title="MentionComposer" meta="@ autocomplete for comment threads">
          <MentionComposer
            value={mentionDraft}
            onChange={setMentionDraft}
            mentionOptions={[
              { handle: 'anna', label: 'Anna Hofer', description: 'Account manager' },
              { handle: 'markus', label: 'Markus Leitner', description: 'Operations' },
              { handle: 'nina', label: 'Nina Weiss', description: 'Finance' },
            ]}
          />
        </ShowcaseBlock>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CommentsPanel
          comments={comments}
          mentionOptions={[
            { handle: 'anna', label: 'Anna Hofer', description: 'Account manager' },
            { handle: 'markus', label: 'Markus Leitner', description: 'Operations' },
            { handle: 'nina', label: 'Nina Weiss', description: 'Finance' },
          ]}
          onSubmit={(body, internal) => {
            setComments((current) => [
              {
                id: `cmt_${Date.now()}`,
                author: 'You',
                body,
                createdAt: new Date().toISOString(),
                internal,
              },
              ...current,
            ]);
            appToast.success('Comment posted.');
          }}
        />

        <ApprovalPanel
          items={approvals}
          onApprove={(id) => {
            setApprovals((current) =>
              current.map((item) =>
                item.id === id ? { ...item, status: 'approved' as const } : item,
              ),
            );
            appToast.success('Approved.');
          }}
          onReject={(id) => {
            setApprovals((current) =>
              current.map((item) =>
                item.id === id ? { ...item, status: 'rejected' as const } : item,
              ),
            );
            appToast.success('Rejected.');
          }}
        />
      </div>

      <ApprovalHistory
        entries={[
          {
            id: 'h1',
            label: 'Submitted for approval',
            actor: 'Nina Weiss',
            timestamp: '2024-12-04T09:00:00Z',
            status: 'submitted',
          },
          {
            id: 'h2',
            label: 'Approved by manager',
            actor: 'Anna Hofer',
            timestamp: '2024-12-04T14:30:00Z',
            status: 'approved',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ShowcaseBlock title="AgentToolCallCard" meta="Tool input · result · status">
          <AgentToolCallCard
            toolName="search_clients"
            input={{ query: 'Apex', limit: 5 }}
            result={'[\n  { "id": "c1", "name": "Apex Technologies" }\n]'}
          />
        </ShowcaseBlock>
        <ShowcaseBlock title="AgentConfirmationCard" meta="Approve or reject sensitive actions">
          <AgentConfirmationCard
            confirmation={{
              id: 'demo_confirm',
              action: 'Delete client record',
              description: 'Permanently removes the client and linked commercial records.',
              details: { Client: 'Apex Technologies', Module: 'Clients' },
              status: 'pending',
            }}
            onRespond={(approved) => {
              appToast.success(approved ? 'Approved' : 'Rejected');
            }}
          />
        </ShowcaseBlock>
      </div>

      <ShowcaseBlock title="KanbanBoard" meta="Drag cards between columns · pipeline stages">
        <KanbanBoard<KanbanTask>
          columns={kanbanColumns}
          getItemId={(item) => item.id}
          onMove={(move) => {
            setKanbanColumns((current) => applyKanbanMove(current, (item) => item.id, move));
            appToast.success('Task moved.');
          }}
          onCardClick={() => appToast.info('Card clicked — navigate to detail in modules.')}
          renderCard={(item) => (
            <ListRow
              title={item.title}
              subtitle={item.assignee}
              leading={<UserIcon size={16} weight="duotone" />}
              trailing={<Badge variant="outline">Normal</Badge>}
            />
          )}
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="Timeline" meta="Audit trail · activity feed">
        <Timeline
          events={[
            {
              id: 'tl_1',
              label: 'Record created',
              description: 'Initial import from demo seed',
              timestamp: '2024-01-08T09:00:00Z',
              tone: 'success',
            },
            {
              id: 'tl_2',
              label: 'Plan upgraded',
              description: 'Starter → Professional',
              timestamp: '2024-03-12T14:22:00Z',
              tone: 'info',
            },
            {
              id: 'tl_3',
              label: 'Billing contact changed',
              description: 'billing@apex-tech.test',
              timestamp: '2024-06-01T11:05:00Z',
              tone: 'default',
            },
          ]}
        />
      </ShowcaseBlock>
    </div>
  );
}
