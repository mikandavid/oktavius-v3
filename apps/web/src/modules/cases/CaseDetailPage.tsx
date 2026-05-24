import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import {
  AlertBanner,
  Avatar,
  Badge,
  Button,
  CalendarView,
  type CalendarEvent,
  type CalendarViewMode,
  InlineEmptyState,
  ListRow,
  RichTextEditor,
  SectionCard,
  StatCard,
  Stepper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  type TimelineEvent,
} from '@oktavius/base-ui';

import { useDemoData } from '@/app/demo-data';
import { ChecklistSection } from '@/components/common/ChecklistSection';
import { InfoBox } from '@/components/common/InfoBox';
import { ModulePage } from '@/components/common/PageLayout';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { DocumentPreviewPanel } from '@/components/documents/DocumentPreviewPanel';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDisplayDate } from '@/lib/formatDate';
import { InfoIcon, PlusIcon, WarningIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import {
  CASE_PRIORITY_MAP,
  CASE_STAGES,
  CASE_STATUS_MAP,
  casesPageIcon,
  checklistFormDefaults,
  checklistFormFields,
  type ChecklistFormValues,
} from './shared';

const WORKFLOW_STEPS = CASE_STAGES.map((stage) => ({ key: stage.toLowerCase(), label: stage }));

export function CaseDetailPage() {
  const { caseId } = useParams();
  const { cases, parties, tasks, caseChecklists, toggleChecklistItem, createChecklistItem } =
    useDemoData();
  const [tab, setTab] = useState('overview');
  const [docId, setDocId] = useState('f1');
  const [addChecklistOpen, setAddChecklistOpen] = useState(false);
  const [notes, setNotes] = useState(
    '<p>Internal case notes — visible to the assigned team only.</p>',
  );

  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('month');

  const caseRecord = cases.find((c) => c.id === caseId);
  if (!caseRecord) return <Navigate to="/cases" replace />;

  const caseParties = parties.filter((p) => p.caseId === caseRecord.id);
  const clientParties = parties.filter((p) => p.clientId === caseRecord.clientId);
  const allParties = [...caseParties, ...clientParties.slice(0, 2)];
  const caseTasks = tasks.filter((t) => t.parentId === caseRecord.id && t.parentType === 'case');
  const checklist = caseChecklists.filter((c) => c.caseId === caseRecord.id);
  const stageIndex = CASE_STAGES.indexOf(caseRecord.stage);
  const incompleteRequired = checklist.filter((item) => item.required && !item.done).length;

  const caseCalendarEvents: CalendarEvent[] = [
    {
      id: 'hearing',
      title: 'Preliminary hearing',
      start: `${caseRecord.dueAt.slice(0, 10)}T10:00`,
      end: `${caseRecord.dueAt.slice(0, 10)}T11:30`,
      calendarId: 'legal',
      colorKey: 'blue',
    },
    {
      id: 'deadline',
      title: 'Filing deadline',
      start: caseRecord.dueAt.slice(0, 10),
      end: caseRecord.dueAt.slice(0, 10),
      allDay: true,
      calendarId: 'legal',
      colorKey: 'red',
    },
    {
      id: 'review',
      title: 'Team review',
      start: `${caseRecord.openedAt.slice(0, 10)}T14:00`,
      end: `${caseRecord.openedAt.slice(0, 10)}T15:00`,
      calendarId: 'legal',
      colorKey: 'violet',
    },
  ];

  const activity: TimelineEvent[] = [
    { id: '1', label: 'Case opened', timestamp: `${caseRecord.openedAt}T09:00:00Z`, tone: 'info' },
    {
      id: '2',
      label: 'Assigned to ' + caseRecord.assignee,
      timestamp: `${caseRecord.openedAt}T11:00:00Z`,
      tone: 'info',
    },
    {
      id: '3',
      label: 'Stage changed to ' + caseRecord.stage,
      timestamp: '2024-12-01T15:30:00Z',
      tone: caseRecord.slaStatus === 'breach' ? 'destructive' : 'success',
    },
  ];

  const slaBanner =
    caseRecord.slaStatus === 'breach' ? (
      <AlertBanner tone="destructive" flush>
        SLA breached — due {formatDisplayDate(caseRecord.dueAt)}. Escalate immediately.
      </AlertBanner>
    ) : caseRecord.slaStatus === 'warning' ? (
      <AlertBanner tone="warning" flush>
        SLA at risk — resolution due {formatDisplayDate(caseRecord.dueAt)}.
      </AlertBanner>
    ) : null;

  return (
    <>
      {slaBanner}
      <ModulePage
        title={caseRecord.caseNumber}
        subtitle={
          <span className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <span>{caseRecord.title}</span>
            <span className="flex flex-wrap items-center gap-2">
              <StatusBadge status={caseRecord.priority} variantMap={CASE_PRIORITY_MAP} />
              <StatusBadge status={caseRecord.stage} variantMap={CASE_STATUS_MAP} />
              <Badge variant="outline">{caseRecord.type}</Badge>
            </span>
          </span>
        }
        icon={casesPageIcon()}
        backTo="/cases"
      >
        <InfoBox tone="info" icon={<InfoIcon size={18} weight="fill" />} title="Case summary">
          {caseRecord.summary}
          <span className="mt-2 block text-xs text-muted-foreground">
            Client:{' '}
            <Link to={`/clients/${caseRecord.clientId}`} className="underline underline-offset-2">
              {caseRecord.clientName}
            </Link>
            {' · Owner: '}
            {caseRecord.assignee}
          </span>
        </InfoBox>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
              value="workflow"
              attention={incompleteRequired > 0 && caseRecord.stage !== 'Closed'}
            >
              Workflow
            </TabsTrigger>
            <TabsTrigger value="parties">Parties</TabsTrigger>
            <TabsTrigger value="tasks" attention={caseTasks.some((t) => t.status === 'Pending')}>
              Tasks
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
              <StatCard label="Stage" value={caseRecord.stage} />
              <StatCard label="Parties" value={String(allParties.length)} />
              <StatCard
                label="Open tasks"
                value={String(caseTasks.filter((t) => t.status !== 'Completed').length)}
                icon={
                  caseTasks.some((t) => t.status === 'Pending') ? (
                    <WarningIcon size={16} />
                  ) : undefined
                }
              />
              <StatCard label="Due" value={formatDisplayDate(caseRecord.dueAt)} />
            </div>
            <SectionCard title="Workflow progress">
              <Stepper steps={WORKFLOW_STEPS} currentStep={Math.max(0, stageIndex)} />
            </SectionCard>
            <SectionCard title="Recent activity">
              <Timeline events={activity} />
            </SectionCard>
            <div className="space-y-2">
              <ChecklistSection
                title="Checklist preview"
                items={checklist.slice(0, 3)}
                readOnly
                onToggle={toggleChecklistItem}
              />
              <Button variant="ghost" size="sm" onClick={() => setTab('workflow')}>
                Open workflow tab
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4 pt-4">
            <SectionCard title="Case stages">
              <Stepper steps={WORKFLOW_STEPS} currentStep={Math.max(0, stageIndex)} />
              <div className="mt-4 flex flex-wrap gap-2">
                {CASE_STAGES.map((stage) => (
                  <Button
                    key={stage}
                    variant={stage === caseRecord.stage ? 'cta' : 'outline'}
                    size="sm"
                    type="button"
                  >
                    {stage}
                  </Button>
                ))}
              </div>
            </SectionCard>
            <ChecklistSection
              title="Resolution checklist"
              meta={
                checklist.length
                  ? `${checklist.filter((item) => item.done).length}/${checklist.length} done · Required items before close`
                  : 'Required items before close'
              }
              items={checklist}
              onToggle={toggleChecklistItem}
              actions={
                <Button variant="outline" size="sm" onClick={() => setAddChecklistOpen(true)}>
                  <PlusIcon size={14} className="mr-1.5" />
                  Add item
                </Button>
              }
            />
          </TabsContent>

          <TabsContent value="parties" className="pt-4">
            <SectionCard
              title="Parties"
              meta={`${allParties.length} linked`}
              actions={
                <Button variant="outline" size="sm">
                  Add party
                </Button>
              }
            >
              {allParties.map((party) => (
                <ListRow
                  key={party.id}
                  title={party.name}
                  subtitle={`${party.role} · ${party.email}`}
                  leading={<Avatar label={party.name} size="sm" tone="accent" />}
                />
              ))}
            </SectionCard>
          </TabsContent>

          <TabsContent value="tasks" className="pt-4">
            <SectionCard
              title="Tasks"
              actions={
                <Button variant="outline" size="sm">
                  Add task
                </Button>
              }
            >
              {caseTasks.length ? (
                caseTasks.map((task) => (
                  <ListRow
                    key={task.id}
                    title={task.title}
                    subtitle={`Due ${formatDisplayDate(task.dueDate)} · ${task.assignee}`}
                    trailing={<StatusBadge status={task.status} />}
                  />
                ))
              ) : (
                <InlineEmptyState text="No tasks on this case." centered />
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="documents" className="pt-4">
            <SectionCard title="Case file">
              <DocumentPreviewPanel selectedId={docId} onSelect={setDocId} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="notes" className="pt-4">
            <SectionCard title="Internal notes" meta="Rich text">
              <RichTextEditor
                value={notes}
                onChange={setNotes}
                placeholder="Add investigation notes…"
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="calendar" className="pt-4">
            <CalendarView
              anchor={calendarAnchor}
              onAnchorChange={setCalendarAnchor}
              view={calendarView}
              onViewChange={setCalendarView}
              events={caseCalendarEvents}
              calendars={[{ id: 'legal', label: 'Case schedule', color: 'blue' }]}
              onEventClick={(event) => toast.info(event.title)}
            />
          </TabsContent>
        </Tabs>

        <SubEntityFormDialog<ChecklistFormValues>
          open={addChecklistOpen}
          onOpenChange={setAddChecklistOpen}
          title="Add checklist item"
          description="Track resolution steps required before closing this case."
          fields={checklistFormFields}
          defaultValues={checklistFormDefaults}
          submitLabel="Add item"
          onSubmit={(values) => {
            createChecklistItem({
              caseId: caseRecord.id,
              label: values.label,
              required: Boolean(values.required),
            });
            toast.success('Checklist item added.');
          }}
        />
      </ModulePage>
    </>
  );
}
