import { useState } from 'react';

import {
  Breadcrumb,
  CollapsibleSection,
  InlineEdit,
  ListRow,
  RecordVisual,
  ScrollArea,
  SettingsLayout,
  SettingsRow,
  SettingsSection,
  SplitView,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';

import { BackButton } from '@/components/common/BackButton';
import { DetailView } from '@/components/common/DetailView';
import { QUEUE_ITEM_SELECTED_CLASS, SplitViewQueue } from '@/components/common/SplitViewQueue';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { CaseIcon, ProjectsIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const QUEUE_ITEMS = [
  { id: 'q1', title: 'CASE-2024-0892', subtitle: 'Billing dispute' },
  { id: 'q2', title: 'CASE-2024-0901', subtitle: 'Contract amendment' },
  { id: 'q3', title: 'CASE-2024-0755', subtitle: 'API outage' },
];

export function DetailLayoutSection() {
  const [activeQueue, setActiveQueue] = useState('q1');
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsKey, setSettingsKey] = useState('general');
  const [inlineValue, setInlineValue] = useState('Apex Technologies GmbH');
  const [syncEnabled, setSyncEnabled] = useState(true);

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="Page chrome" meta="Breadcrumb · BackButton">
        <div className="space-y-3">
          <Breadcrumb
            items={[{ label: 'Clients', href: '/clients' }, { label: 'Apex Technologies GmbH' }]}
          />
          <BackButton to="/clients" label="Back to clients" />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="DetailView" meta="RecordInfoHero · DetailFieldGrid · RecordVisual">
        <DetailView
          title="Client profile"
          visual={{ kind: 'icon', icon: <ProjectsIcon size={16} weight="duotone" /> }}
          visualLayout="header"
          fields={[
            { label: 'Company', value: inlineValue, importance: 'primary' },
            { label: 'Industry', value: 'Technology', section: 'Profile' },
            { label: 'Account manager', value: 'Anna Hofer', section: 'Profile' },
            {
              label: 'Status',
              value: (
                <StatusBadge status="active" label="Active" variantMap={{ active: 'success' }} />
              ),
              section: 'Commercial',
            },
            { label: 'Created', value: '10.01.2024', section: 'Meta', importance: 'meta' },
          ]}
        />
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            InlineEdit — click to edit
          </p>
          <InlineEdit
            value={inlineValue}
            onSave={async (next) => {
              setInlineValue(next);
              toast.success('Saved.');
            }}
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="SplitView + queue" meta="Master-detail sidebar · ListRow variant=queue">
        <SplitView
          className="min-h-[280px] w-full rounded-card bg-card"
          sidebarWidth="w-[min(100%,14rem)]"
          sidebar={
            <ScrollArea className="h-full max-h-[280px]">
              <SplitViewQueue>
                {QUEUE_ITEMS.map((item) => (
                  <ListRow
                    key={item.id}
                    variant="queue"
                    title={item.title}
                    subtitle={item.subtitle}
                    onClick={() => setActiveQueue(item.id)}
                    className={item.id === activeQueue ? QUEUE_ITEM_SELECTED_CLASS : undefined}
                    aria-current={item.id === activeQueue ? 'true' : undefined}
                  />
                ))}
              </SplitViewQueue>
            </ScrollArea>
          }
        >
          <div className="space-y-2 p-4">
            <div className="flex items-start gap-3">
              <RecordVisual kind="icon" icon={<CaseIcon size={16} weight="duotone" />} size="md" />
              <div>
                <h3 className="text-sm font-semibold">
                  {QUEUE_ITEMS.find((i) => i.id === activeQueue)?.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {QUEUE_ITEMS.find((i) => i.id === activeQueue)?.subtitle}
                </p>
                <div className="mt-2 flex gap-2">
                  <StatusBadge status="High" variantMap={{ High: 'warning' }} />
                  <StatusBadge status="Investigation" variantMap={{ Investigation: 'info' }} />
                </div>
              </div>
            </div>
          </div>
        </SplitView>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Tabs with attention"
        meta="TabsTrigger attention dot for incomplete sections"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow" attention>
              Workflow
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3 text-sm text-muted-foreground">
            Overview tab content — stats, timeline, party summary.
          </TabsContent>
          <TabsContent value="workflow" className="pt-3 text-sm text-muted-foreground">
            Workflow tab — checklist items pending (attention dot on trigger).
          </TabsContent>
          <TabsContent value="documents" className="pt-3 text-sm text-muted-foreground">
            Documents tab — attachment list and preview panel.
          </TabsContent>
        </Tabs>
      </ShowcaseBlock>

      <ShowcaseBlock title="CollapsibleSection" meta="Long forms — optional field groups">
        <CollapsibleSection title="Advanced options" badge="Optional">
          <p className="text-sm text-muted-foreground">
            Collapsed by default. Expand to reveal infrequently used fields.
          </p>
        </CollapsibleSection>
      </ShowcaseBlock>

      <ShowcaseBlock title="SettingsLayout" meta="Settings page shell — nav + SettingsRow">
        <SettingsLayout
          items={[
            { key: 'general', label: 'General' },
            { key: 'notifications', label: 'Notifications' },
          ]}
          activeKey={settingsKey}
          onSelect={setSettingsKey}
        >
          {settingsKey === 'general' ? (
            <SettingsSection title="General" description="Workspace preferences">
              <SettingsRow label="Auto-sync CRM" description="Updates client records nightly.">
                <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
              </SettingsRow>
            </SettingsSection>
          ) : (
            <SettingsSection title="Notifications" description="Email and in-app alerts">
              <SettingsRow label="Daily digest" description="Summary of open tasks each morning.">
                <Switch defaultChecked />
              </SettingsRow>
            </SettingsSection>
          )}
        </SettingsLayout>
      </ShowcaseBlock>
    </div>
  );
}
