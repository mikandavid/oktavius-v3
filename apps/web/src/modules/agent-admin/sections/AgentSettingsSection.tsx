import { AiSettingsSection } from '@/components/settings/AiSettingsSection';
import { useWorkspaceSettingsForm } from '@/components/settings/useWorkspaceSettingsForm';

export function AgentSettingsSection() {
  const { settings, onChange, saving, savedAt } = useWorkspaceSettingsForm();
  return (
    <AiSettingsSection settings={settings} saving={saving} savedAt={savedAt} onChange={onChange} />
  );
}
