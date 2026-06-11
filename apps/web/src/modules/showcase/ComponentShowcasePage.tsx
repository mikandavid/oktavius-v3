import { useState } from 'react';

import { cn } from '@oktavius/base-ui';

import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';

import { ModulePage } from '@/components/common/PageLayout';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { showcasePageIcon } from '@/lib/modulePageIcons';

import { SHOWCASE_NAV, type ShowcaseSectionId } from './shared';
import { AgentSection } from './sections/AgentSection';
import { CalendarChartsSection } from './sections/CalendarChartsSection';
import { DataSection } from './sections/DataSection';
import { DetailLayoutSection } from './sections/DetailLayoutSection';
import { DialogsSection } from './sections/DialogsSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { ErrorsSection } from './sections/ErrorsSection';
import { FormsSection } from './sections/FormsSection';
import { DesignTokensSection } from './sections/DesignTokensSection';
import { FoundationsSection } from './sections/FoundationsSection';
import { InputsSection } from './sections/InputsSection';
import { LayoutsSection } from './sections/LayoutsSection';
import { MultiTenantSection } from './sections/MultiTenantSection';
import { OverviewSection } from './sections/OverviewSection';
import { PatternsSection } from './sections/PatternsSection';
import { SettingsShowcaseSection } from './sections/SettingsSection';
import { ResponsiveDetailSection } from './sections/ResponsiveDetailSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { CommsOpsSection } from './sections/CommsOpsSection';

function ShowcaseSectionContent({ section }: { section: ShowcaseSectionId }) {
  switch (section) {
    case 'overview':
      return <OverviewSection />;
    case 'design-tokens':
      return <DesignTokensSection />;
    case 'foundations':
      return <FoundationsSection />;
    case 'layouts':
      return <LayoutsSection />;
    case 'inputs':
      return <InputsSection />;
    case 'forms':
      return <FormsSection />;
    case 'feedback':
      return <FeedbackSection />;
    case 'errors':
      return <ErrorsSection />;
    case 'dialogs':
      return <DialogsSection />;
    case 'data':
      return <DataSection />;
    case 'multi-tenant':
      return <MultiTenantSection />;
    case 'settings':
      return <SettingsShowcaseSection />;
    case 'responsive-detail':
      return <ResponsiveDetailSection />;
    case 'detail-layout':
      return <DetailLayoutSection />;
    case 'workflow':
      return <WorkflowSection />;
    case 'agent':
      return <AgentSection />;
    case 'documents':
      return <DocumentsSection />;
    case 'calendar-charts':
      return <CalendarChartsSection />;
    case 'patterns':
      return <PatternsSection />;
    case 'comms-ops':
      return <CommsOpsSection />;
    default:
      return null;
  }
}

export function ComponentShowcasePage() {
  const [activeSection, setActiveSection] = useState<ShowcaseSectionId>('overview');
  const activeMeta = SHOWCASE_NAV.find((item) => item.key === activeSection);

  return (
    <ModulePage
      title="Component showcase"
      subtitle="Structured gallery of every UI primitive, block, and ERP pattern — all interactive"
      icon={showcasePageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <AppSectionNavLayout
        items={SHOWCASE_NAV.map((item) => ({
          key: item.key,
          label: item.label,
          description: item.description,
        }))}
        activeKey={activeSection}
        onSelect={(key) => setActiveSection(key as ShowcaseSectionId)}
        contentClassName={
          activeSection === 'design-tokens'
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-5'
            : undefined
        }
      >
        <div
          className={cn(
            'flex flex-col gap-4',
            activeSection === 'design-tokens' && 'min-h-0 flex-1',
          )}
        >
          {activeMeta ? (
            <p className="shrink-0 text-sm text-muted-foreground">{activeMeta.description}</p>
          ) : null}
          <div
            className={
              activeSection === 'design-tokens'
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : undefined
            }
          >
            <ShowcaseSectionContent section={activeSection} />
          </div>
        </div>
      </AppSectionNavLayout>
    </ModulePage>
  );
}
