// apps/web/src/modules/agent-admin/AgentAdminPage.tsx
import { useSearchParams } from 'react-router-dom';

import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { ModulePage } from '@/components/common/PageLayout';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { useTranslation } from '@/core/i18n';
import { BrainIcon, RobotIcon } from '@/lib/icons';

import { AGENT_SECTION_PARAM, resolveInitialAgentSection } from './agentSectionParam';
import { AgentSettingsSection } from './sections/AgentSettingsSection';

export function AgentAdminPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = resolveInitialAgentSection(searchParams.get(AGENT_SECTION_PARAM));

  const setActiveSection = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(AGENT_SECTION_PARAM, key);
    setSearchParams(next, { replace: true });
  };

  const sections: SettingsSectionConfig[] = [
    {
      id: 'settings',
      group: t('agent_admin.groupConfiguration', undefined, 'Configuration'),
      label: t('agent_admin.sectionSettings', undefined, 'Settings'),
      icon: <BrainIcon size={16} weight="duotone" />,
      title: t('agent_admin.sectionSettings', undefined, 'Settings'),
      sectionDescription: 'Usage guardrails and org-wide instructions for AI-assisted work.',
      permission: 'org.manage',
      render: () => <AgentSettingsSection />,
    },
    // Integrations (Phase 2), Automations (Phase 3), Heartbeat & Queue (Phase 4)
    // are appended here in their respective phases.
  ];

  return (
    <ModulePage
      title={t('agent_admin.title', undefined, 'AI Agent')}
      subtitle={t('agent_admin.subtitle', undefined, 'Configuration and runtime for your AI agent')}
      icon={<RobotIcon size={20} weight="duotone" />}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
    >
      <SettingsPageFactory
        sections={sections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
        groupOrder={[
          t('agent_admin.groupConfiguration', undefined, 'Configuration'),
          t('agent_admin.groupOperations', undefined, 'Operations'),
        ]}
      />
    </ModulePage>
  );
}
