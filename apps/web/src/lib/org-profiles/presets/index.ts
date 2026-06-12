import { FUNERAL_PRESET } from './funeral';
import { GENERIC_PRESET } from './generic';
import type { OrgProfilePreset } from './types';

export type { OrgProfilePreset } from './types';
export { FUNERAL_PRESET } from './funeral';
export { GENERIC_PRESET } from './generic';

export const ORG_PROFILE_PRESETS: Record<string, OrgProfilePreset> = {
  generic: GENERIC_PRESET,
  funeral: FUNERAL_PRESET,
};

export function presetFor(industryKey: string | undefined): OrgProfilePreset {
  return (industryKey && ORG_PROFILE_PRESETS[industryKey]) || GENERIC_PRESET;
}
