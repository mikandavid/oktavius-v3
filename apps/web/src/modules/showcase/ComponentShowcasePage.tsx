import { useState } from 'react';

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
import { FormsSection } from './sections/FormsSection';
import { FoundationsSection } from './sections/FoundationsSection';
import { InputsSection } from './sections/InputsSection';
import { OverviewSection } from './sections/OverviewSection';
import { PatternsSection } from './sections/PatternsSection';
import { WorkflowSection } from './sections/WorkflowSection';

function ShowcaseSectionContent({ section }: { section: ShowcaseSectionId }) {
  switch (section) {
    case 'overview':
      return <OverviewSection />;
    case 'foundations':
      return <FoundationsSection />;
    case 'inputs':
      return <InputsSection />;
    case 'forms':
      return <FormsSection />;
    case 'feedback':
      return <FeedbackSection />;
    case 'dialogs':
      return <DialogsSection />;
    case 'data':
      return <DataSection />;
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
      >
        {activeMeta ? (
          <p className="mb-4 text-sm text-muted-foreground">{activeMeta.description}</p>
        ) : null}
        <ShowcaseSectionContent section={activeSection} />
      </AppSectionNavLayout>
    </ModulePage>
  );
}
