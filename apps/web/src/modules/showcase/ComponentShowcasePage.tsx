import { Button } from '@oktavius/base-ui';
import { useState } from 'react';

import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { ModulePage } from '@/components/common/PageLayout';
import { AppSectionNavLayout } from '@/components/layout/AppSectionNavLayout';
import { useDensity } from '@/lib/density/useDensity';
import { useDesignTokenOverrides } from '@/lib/design-tokens/useDesignTokenOverrides';
import { SettingsIcon } from '@/lib/icons';
import { showcasePageIcon } from '@/lib/modulePageIcons';
import { useReducedMotion } from '@/lib/showcase-prefs/useReducedMotion';

import { ShowcaseSettingsDrawer } from './components/ShowcaseSettingsDrawer';
import { AgentSection } from './sections/AgentSection';
import { CalendarChartsSection } from './sections/CalendarChartsSection';
import { CommsOpsSection } from './sections/CommsOpsSection';
import { DataSection } from './sections/DataSection';
import { DetailLayoutSection } from './sections/DetailLayoutSection';
import { DialogsSection } from './sections/DialogsSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { ErrorsSection } from './sections/ErrorsSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { FormsSection } from './sections/FormsSection';
import { FoundationsSection } from './sections/FoundationsSection';
import { InputsSection } from './sections/InputsSection';
import { LayoutsSection } from './sections/LayoutsSection';
import { OverviewSection } from './sections/OverviewSection';
import { PatternsSection } from './sections/PatternsSection';
import { ResponsiveDetailSection } from './sections/ResponsiveDetailSection';
import { SettingsShowcaseSection } from './sections/SettingsSection';
import { WorkflowSection } from './sections/WorkflowSection';
import { SHOWCASE_GROUP_ORDER, SHOWCASE_NAV, type ShowcaseSectionId } from './shared';

function ShowcaseSectionContent({ section }: { section: ShowcaseSectionId }) {
  switch (section) {
    case 'overview':
      return <OverviewSection />;
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeMeta = SHOWCASE_NAV.find((item) => item.key === activeSection);

  // Owned at the page level so overrides persist while the drawer (which unmounts
  // its content when closed) is shut.
  const tokens = useDesignTokenOverrides(true);
  const density = useDensity();
  const reducedMotion = useReducedMotion();

  const setAppearancePersist = (value: boolean) => {
    density.setPersist(value);
    reducedMotion.setPersist(value);
  };

  const handleResetEverything = () => {
    tokens.resetAll();
    tokens.setPersist(false);
    density.reset();
    reducedMotion.reset();
    setAppearancePersist(false);
  };

  return (
    <ModulePage
      title="Component showcase"
      subtitle="Structured gallery of every UI primitive, block, and ERP pattern — all interactive"
      icon={showcasePageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open showcase settings"
          onClick={() => setSettingsOpen(true)}
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      }
    >
      <AppSectionNavLayout
        items={SHOWCASE_NAV.map((item) => ({
          key: item.key,
          label: item.label,
          description: item.description,
          group: item.group,
        }))}
        groupOrder={SHOWCASE_GROUP_ORDER}
        filterable
        activeKey={activeSection}
        onSelect={(key) => setActiveSection(key as ShowcaseSectionId)}
      >
        <div className="flex flex-col gap-4">
          {activeMeta ? (
            <p className="shrink-0 text-sm text-muted-foreground">{activeMeta.description}</p>
          ) : null}
          <div>
            <ShowcaseSectionContent section={activeSection} />
          </div>
        </div>
      </AppSectionNavLayout>

      <ShowcaseSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tokens={tokens}
        density={density.density}
        onDensityChange={density.setDensity}
        reducedMotion={reducedMotion.enabled}
        onReducedMotionChange={reducedMotion.setEnabled}
        appearancePersist={density.persist}
        onAppearancePersistChange={setAppearancePersist}
        onResetEverything={handleResetEverything}
      />
    </ModulePage>
  );
}
