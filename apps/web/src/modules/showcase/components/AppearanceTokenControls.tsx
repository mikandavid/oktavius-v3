import { SettingsRow } from '@oktavius/base-ui';
import { useMemo } from 'react';

import { readBaseTokenFromStylesheet } from '@/lib/design-tokens/tokenRegistry';
import type { DesignTokenOverridesController } from '@/lib/design-tokens/useDesignTokenOverrides';

import {
  activeRoundness,
  activeShadowCard,
  RADIUS_TOKEN_KEYS,
  ROUNDNESS_PRESETS,
  type RoundnessId,
  roundnessOverridesFor,
  SHADOW_CARD_PRESETS,
  SHADOW_CARD_TOKEN_KEY,
  type ShadowCardId,
} from './appearanceTokenScales';
import { Segmented } from './Segmented';

/**
 * "Friendly" appearance controls (roundness, card shadow) that write to the
 * shared design-token override store, so they compose with the Tokens tab and
 * persist/export with everything else.
 */
export function AppearanceTokenControls({
  controller,
}: {
  controller: DesignTokenOverridesController;
}) {
  const { overrides, setOverride, resetToken } = controller;

  const bases = useMemo(() => {
    const map: Record<string, string> = {};
    for (const key of RADIUS_TOKEN_KEYS) {
      map[key] = readBaseTokenFromStylesheet(key);
    }
    return map;
  }, []);

  const handleRoundness = (id: RoundnessId) => {
    const preset = ROUNDNESS_PRESETS.find((entry) => entry.id === id);
    if (!preset) return;
    if (preset.factor === 1) {
      for (const key of RADIUS_TOKEN_KEYS) resetToken(key);
      return;
    }
    const next = roundnessOverridesFor(preset.factor, bases);
    for (const key of RADIUS_TOKEN_KEYS) setOverride(key, next[key]);
  };

  const handleShadow = (id: ShadowCardId) => {
    const preset = SHADOW_CARD_PRESETS.find((entry) => entry.id === id);
    if (!preset) return;
    if (preset.value === null) {
      resetToken(SHADOW_CARD_TOKEN_KEY);
    } else {
      setOverride(SHADOW_CARD_TOKEN_KEY, preset.value);
    }
  };

  return (
    <>
      <SettingsRow
        label="Roundness"
        description="Corner radius across cards, controls, and badges."
      >
        <Segmented
          ariaLabel="Roundness"
          value={activeRoundness(overrides, bases)}
          options={ROUNDNESS_PRESETS.map(({ id, label }) => ({ id, label }))}
          onChange={handleRoundness}
        />
      </SettingsRow>

      <SettingsRow label="Card shadow" description="Elevation on card surfaces.">
        <Segmented
          ariaLabel="Card shadow"
          value={activeShadowCard(overrides)}
          options={SHADOW_CARD_PRESETS.map(({ id, label }) => ({ id, label }))}
          onChange={handleShadow}
        />
      </SettingsRow>
    </>
  );
}
