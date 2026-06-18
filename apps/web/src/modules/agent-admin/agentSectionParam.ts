/** Query-string key used to deep-link a specific agent section (e.g. `/agent?section=automations`). */
export const AGENT_SECTION_PARAM = 'section';

const DEFAULT_AGENT_SECTION = 'settings';

export function resolveInitialAgentSection(rawSection: string | null): string {
  const trimmed = rawSection?.trim();
  return trimmed ? trimmed : DEFAULT_AGENT_SECTION;
}
