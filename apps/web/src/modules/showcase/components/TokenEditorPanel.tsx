import { Button, CollapsibleSection, Input, SettingsRow, Switch } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import {
  getEditableTokens,
  getEditableTokensBySection,
  readBaseTokenFromStylesheet,
} from '@/lib/design-tokens/tokenRegistry';
import type { DesignTokenOverridesController } from '@/lib/design-tokens/useDesignTokenOverrides';
import { appToast } from '@/lib/toast';
import { useUserPreferences } from '@/lib/userPreferences';
import { TokenEditor } from '@/modules/showcase/components/TokenEditor';

const EDITABLE_TOKENS = getEditableTokens();
const EDITABLE_SECTIONS = getEditableTokensBySection();

export function TokenEditorPanel({ controller }: { controller: DesignTokenOverridesController }) {
  const { theme } = useUserPreferences();
  const {
    overrides,
    setOverride,
    resetToken,
    resetAll,
    exportCss,
    overrideCount,
    persist,
    setPersist,
  } = controller;
  const [search, setSearch] = useState('');

  const defaults = useMemo(() => {
    void theme;
    const map: Record<string, string> = {};
    for (const token of EDITABLE_TOKENS) {
      map[token.key] = readBaseTokenFromStylesheet(token.key);
    }
    return map;
  }, [theme]);

  const visibleTokens = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return null;
    return EDITABLE_TOKENS.filter(
      (token) =>
        token.key.includes(query) ||
        token.label.toLowerCase().includes(query) ||
        token.description?.toLowerCase().includes(query),
    );
  }, [search]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return EDITABLE_SECTIONS;
    return EDITABLE_SECTIONS.map((section) => ({
      ...section,
      tokens: section.tokens.filter(
        (token) =>
          token.key.includes(query) ||
          token.label.toLowerCase().includes(query) ||
          token.description?.toLowerCase().includes(query),
      ),
    })).filter((section) => section.tokens.length > 0);
  }, [search]);

  const handleCopyCss = async () => {
    if (!exportCss) {
      appToast.info('No overrides to copy yet.');
      return;
    }
    await navigator.clipboard.writeText(exportCss);
    appToast.success('CSS overrides copied. Paste into globals.css :root or .dark.');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={resetAll} disabled={overrideCount === 0}>
          Reset all ({overrideCount})
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopyCss} disabled={overrideCount === 0}>
          Copy CSS
        </Button>
        <SettingsRow
          label="Remember edits"
          description="Save overrides to localStorage."
          className="ml-auto max-w-xs border-0 py-0"
        >
          <Switch checked={persist} onCheckedChange={setPersist} />
        </SettingsRow>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search tokens…"
        className="h-8 text-sm"
      />

      <div className="space-y-3">
        {visibleTokens ? (
          visibleTokens.length > 0 ? (
            visibleTokens.map((token) => (
              <TokenEditor
                key={token.key}
                token={token}
                value={overrides[token.key]}
                defaultValue={defaults[token.key] ?? ''}
                onChange={(value) => setOverride(token.key, value)}
                onReset={() => resetToken(token.key)}
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No tokens match.</p>
          )
        ) : (
          filteredSections.map((section) => (
            <CollapsibleSection
              key={section.id}
              title={section.label}
              badge={String(section.tokens.length)}
              defaultOpen={section.defaultOpen}
              variant="plain"
            >
              <p className="mb-2 text-xs text-muted-foreground">{section.description}</p>
              <div className="space-y-2">
                {section.tokens.map((token) => (
                  <TokenEditor
                    key={token.key}
                    token={token}
                    value={overrides[token.key]}
                    defaultValue={defaults[token.key] ?? ''}
                    onChange={(value) => setOverride(token.key, value)}
                    onReset={() => resetToken(token.key)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          ))
        )}
      </div>
    </div>
  );
}
