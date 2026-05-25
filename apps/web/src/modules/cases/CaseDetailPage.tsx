import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Avatar,
  Button,
  InlineEmptyState,
  ListRow,
  STAT_CARD_GRID_CLASS,
  SectionCard,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  formatDisplayDate,
} from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { ChecklistSection } from '@/components/common/ChecklistSection';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { IconDeleteButton } from '@/components/common/RecordIconButtons';
import { CommentsPanel, type CommentItem } from '@/components/workflow/CommentsPanel';
import { useDemoData } from '@/app/demo-data';
import { PlusIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import {
  casePriorityBadge,
  caseSlaBadge,
  caseStageBadge,
  caseTypeBadge,
  casesPageIcon,
} from './shared';

const checklistFormFields = [
  { name: 'label', label: 'Item', type: 'text' as const, required: true },
];

export function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { cases, parties, caseChecklists, toggleChecklistItem, createChecklistItem } =
    useDemoData();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);

  const caseRecord = useMemo(() => cases.find((entry) => entry.id === caseId), [cases, caseId]);

  const caseParties = useMemo(
    () => parties.filter((party) => party.caseId === caseId),
    [parties, caseId],
  );

  const checklistItems = useMemo(
    () => caseChecklists.filter((item) => item.caseId === caseId),
    [caseChecklists, caseId],
  );

  const checklistDone = checklistItems.filter((item) => item.done).length;
  const openTasks = checklistItems.filter((item) => !item.done).length;

  if (!caseRecord) {
    return (
      <ModulePage title="Case not found" icon={casesPageIcon()} backTo="/cases">
        <p className="text-sm text-muted-foreground">This case may have been removed.</p>
      </ModulePage>
    );
  }

  const timelineEvents = [
    {
      id: 'opened',
      label: 'Case opened',
      description: `${caseRecord.caseNumber} · ${caseRecord.type}`,
      timestamp: caseRecord.openedAt,
      tone: 'info' as const,
    },
    {
      id: 'due',
      label: 'Due date',
      description: `Assigned to ${caseRecord.assignee || 'Unassigned'}`,
      timestamp: caseRecord.dueAt,
      tone: caseRecord.slaStatus === 'breach' ? ('destructive' as const) : ('default' as const),
    },
    ...(caseRecord.stage === 'Closed'
      ? [
          {
            id: 'closed',
            label: 'Case closed',
            description: caseRecord.summary,
            timestamp: caseRecord.dueAt,
            tone: 'success' as const,
          },
        ]
      : []),
  ];

  const workflowAttention = checklistItems.some((item) => item.required && !item.done);

  return (
    <>
      <ModulePage
        title={caseRecord.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{caseRecord.clientName}</span>
            {caseTypeBadge(caseRecord.type)}
            {caseStageBadge(caseRecord.stage)}
            {casePriorityBadge(caseRecord.priority)}
            {caseSlaBadge(caseRecord.slaStatus)}
          </span>
        }
        icon={casesPageIcon()}
        backTo="/cases"
        actions={<IconDeleteButton onClick={() => setDeleteOpen(true)} label="Delete case" />}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow" attention={workflowAttention}>
              Workflow
            </TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className={STAT_CARD_GRID_CLASS}>
              <StatCard label="Stage" value={caseRecord.stage} />
              <StatCard
                label="SLA"
                value={
                  caseRecord.slaStatus === 'ok'
                    ? 'On track'
                    : caseRecord.slaStatus === 'warning'
                      ? 'At risk'
                      : 'Breached'
                }
              />
              <StatCard
                label="Checklist"
                value={`${checklistDone}/${checklistItems.length || 0}`}
              />
              <StatCard label="Parties" value={String(caseParties.length)} />
              <StatCard label="Open items" value={String(openTasks)} />
              <StatCard label="Due" value={formatDisplayDate(caseRecord.dueAt)} />
            </div>

            <SectionCard title="Timeline">
              <Timeline events={timelineEvents} />
            </SectionCard>

            <SectionCard title="Summary">
              <p className="text-sm text-foreground">{caseRecord.summary || '—'}</p>
            </SectionCard>

            <SectionCard
              title="Parties"
              meta={`${caseParties.length} contacts`}
              actions={
                caseParties.length > 0 ? (
                  <Button size="sm" variant="ghost" onClick={() => setActiveTab('workflow')}>
                    View workflow
                  </Button>
                ) : undefined
              }
            >
              {caseParties.slice(0, 4).map((party) => (
                <ListRow
                  key={party.id}
                  leading={<Avatar label={party.name} size="sm" />}
                  title={party.name}
                  subtitle={party.role.replace(/_/g, ' ')}
                  meta={party.email}
                />
              ))}
              {caseParties.length === 0 ? (
                <InlineEmptyState text="No parties linked to this case." centered />
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4 pt-4">
            <ChecklistSection
              title="Resolution checklist"
              items={checklistItems}
              onToggle={toggleChecklistItem}
              actions={
                <Button size="sm" variant="outline" onClick={() => setChecklistDialogOpen(true)}>
                  <PlusIcon size={14} />
                  Add item
                </Button>
              }
            />
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 pt-4">
            <CommentsPanel
              comments={comments}
              onSubmit={(body, internal) => {
                setComments((current) => [
                  {
                    id: `cmt_${Date.now()}`,
                    author: caseRecord.assignee || 'Team member',
                    body,
                    createdAt: new Date().toISOString(),
                    internal,
                  },
                  ...current,
                ]);
                toast.success(internal ? 'Internal note posted.' : 'Comment posted.');
              }}
              placeholder="Add a note about this case…"
            />
          </TabsContent>
        </Tabs>
      </ModulePage>

      <SubEntityFormDialog
        open={checklistDialogOpen}
        onOpenChange={setChecklistDialogOpen}
        title="Add checklist item"
        fields={checklistFormFields}
        defaultValues={{ label: '' }}
        submitLabel="Add item"
        onSubmit={(values) => {
          createChecklistItem({
            caseId: caseRecord.id,
            label: String(values.label),
            required: true,
          });
          toast.success('Checklist item added.');
        }}
      />

      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this case?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          toast.success('Case deleted.');
          navigate('/cases');
        }}
      />
    </>
  );
}
