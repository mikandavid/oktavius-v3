import { useEffect, useState, type ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@oktavius/base-ui';

import { ModuleScopedAssistantPanel } from '@/components/agent/ModuleScopedAssistantPanel';
import { AuditTrailPanel } from '@/components/audit/AuditTrailPanel';
import { EntityStoragePanel } from '@/components/storage/EntityStoragePanel';

type EntityDetailWorkspaceTabsProps = {
  overview: ReactNode;
  entityType: string;
  entityId: string;
  /** Extra tabs between Overview and Activity (e.g. contacts, line items). */
  extraTabs?: Array<{ value: string; label: string; content: ReactNode }>;
  showActivity?: boolean;
  showFiles?: boolean;
  showAssistant?: boolean;
  activeTab: string;
  onTabChange: (value: string) => void;
};

/**
 * Standard detail layout: Overview + optional module tabs + Activity (audit) + Files.
 * Avoids nesting DetailView inside tab panels when overview is passed as SectionCard content.
 */
export function EntityDetailWorkspaceTabs({
  overview,
  entityType,
  entityId,
  extraTabs = [],
  showActivity = true,
  showFiles = true,
  showAssistant = true,
  activeTab,
  onTabChange,
}: EntityDetailWorkspaceTabsProps) {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);

  useEffect(() => {
    setLocalActiveTab(activeTab);
  }, [activeTab, entityId, entityType]);

  const handleTabChange = (value: string) => {
    setLocalActiveTab(value);
    onTabChange(value);
  };

  return (
    <Tabs value={localActiveTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="overview" onClick={() => handleTabChange('overview')}>
          Overview
        </TabsTrigger>
        {extraTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} onClick={() => handleTabChange(tab.value)}>
            {tab.label}
          </TabsTrigger>
        ))}
        {showActivity ? (
          <TabsTrigger value="activity" onClick={() => handleTabChange('activity')}>
            Activity
          </TabsTrigger>
        ) : null}
        {showFiles ? (
          <TabsTrigger value="files" onClick={() => handleTabChange('files')}>
            Files
          </TabsTrigger>
        ) : null}
        {showAssistant ? (
          <TabsTrigger value="assistant" onClick={() => handleTabChange('assistant')}>
            Assistant
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="overview" className="space-y-4 pt-4">
        {overview}
      </TabsContent>

      {extraTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-4 pt-4">
          {tab.content}
        </TabsContent>
      ))}

      {showActivity ? (
        <TabsContent value="activity" className="space-y-4 pt-4">
          <AuditTrailPanel entityType={entityType} entityId={entityId} />
        </TabsContent>
      ) : null}

      {showFiles ? (
        <TabsContent value="files" className="space-y-4 pt-4">
          <EntityStoragePanel entityType={entityType} entityId={entityId} />
        </TabsContent>
      ) : null}

      {showAssistant ? (
        <TabsContent value="assistant" className="space-y-4 pt-4">
          <ModuleScopedAssistantPanel />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
