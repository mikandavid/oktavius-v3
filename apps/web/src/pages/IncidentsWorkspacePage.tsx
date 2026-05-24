import { useMemo, useState } from 'react';

import {
  AlertBanner,
  Button,
  ListRow,
  SectionCard,
  SplitView,
  Tabs,
  TabsList,
  TabsTrigger,
  Timeline,
  type TimelineEvent,
} from '@oktavius/base-ui';

import { useDemoData, type IncidentRecord } from '@/app/demo-data';
import { ModulePage } from '@/components/common/PageLayout';
import { QUEUE_ITEM_SELECTED_CLASS, SplitViewQueue } from '@/components/common/SplitViewQueue';
import { InfoBox } from '@/components/common/InfoBox';
import { formatDisplayDateTime } from '@/lib/formatDate';
import { incidentsPageIcon } from '@/lib/modulePageIcons';
import { InfoIcon } from '@/lib/icons';

import { IncidentSeverityBadge, IncidentStatusBadge } from '@/modules/incidents/shared';

export function IncidentsWorkspacePage() {
  const { incidents } = useDemoData();
  const [selectedId, setSelectedId] = useState(incidents[0]?.id ?? '');
  const [filter, setFilter] = useState<'all' | 'open'>('open');

  const filtered = useMemo(() => {
    if (filter === 'open') {
      return incidents.filter((i) => i.status !== 'Resolved');
    }
    return incidents;
  }, [incidents, filter]);

  const selected = incidents.find((i) => i.id === selectedId) ?? filtered[0];

  const timelineFor = (incident: IncidentRecord): TimelineEvent[] => [
    { id: '1', label: 'Incident reported', timestamp: incident.reportedAt, tone: 'destructive' },
    {
      id: '2',
      label: `Assigned to ${incident.assignee}`,
      timestamp: incident.reportedAt,
      tone: 'info',
    },
    {
      id: '3',
      label: `Status: ${incident.status}`,
      timestamp: incident.reportedAt,
      tone: incident.status === 'Resolved' ? 'success' : 'warning',
    },
  ];

  return (
    <ModulePage
      title="Incident response"
      subtitle="Master-detail command center — queue on the left, live triage on the right."
      icon={incidentsPageIcon()}
      layoutClassName="min-w-0 w-full"
    >
      {incidents.some((i) => i.severity === 'Critical' && i.status !== 'Resolved') ? (
        <AlertBanner tone="destructive">
          Critical incident active — review INC-4412 immediately.
        </AlertBanner>
      ) : null}

      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'open')}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <SplitView
        className="min-h-[min(32rem,70vh)] w-full"
        sidebarWidth="w-[min(100%,20rem)]"
        sidebar={
          <SplitViewQueue>
            {filtered.map((incident) => (
              <ListRow
                key={incident.id}
                variant="queue"
                title={incident.incidentNumber}
                subtitle={
                  <>
                    <span className="line-clamp-2 text-sm text-foreground/90">
                      {incident.title}
                    </span>
                    <span>{incident.service}</span>
                  </>
                }
                trailing={<IncidentSeverityBadge severity={incident.severity} />}
                onClick={() => setSelectedId(incident.id)}
                className={selected?.id === incident.id ? QUEUE_ITEM_SELECTED_CLASS : undefined}
                aria-current={selected?.id === incident.id ? 'true' : undefined}
              />
            ))}
          </SplitViewQueue>
        }
      >
        {selected ? (
          <div className="space-y-4 p-4 md:p-6">
            <div className="min-w-0 space-y-1.5">
              <h2 className="text-lg font-semibold text-foreground">{selected.title}</h2>
              <p className="text-sm text-muted-foreground">
                {selected.incidentNumber} · {selected.service} ·{' '}
                {formatDisplayDateTime(selected.reportedAt)}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <IncidentSeverityBadge severity={selected.severity} />
                <IncidentStatusBadge status={selected.status} />
              </div>
            </div>

            <InfoBox tone="warning" icon={<InfoIcon size={18} weight="fill" />} title="Impact">
              {selected.impact}
            </InfoBox>

            <SectionCard title="Response timeline">
              <Timeline events={timelineFor(selected)} />
            </SectionCard>

            <SectionCard
              title="Actions"
              actions={
                <Button variant="cta" size="sm">
                  Update status
                </Button>
              }
            >
              <p className="text-sm text-muted-foreground">
                Owner: <span className="font-medium text-foreground">{selected.assignee}</span>
              </p>
            </SectionCard>
          </div>
        ) : (
          <p className="p-8 text-sm text-muted-foreground">Select an incident from the queue.</p>
        )}
      </SplitView>
    </ModulePage>
  );
}
