import {
  Badge,
  Button,
  cn,
  CollapsibleSection,
  Input,
  SettingsRow,
  SplitView,
  Switch,
} from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { InfoBox } from '@/components/common/InfoBox';
import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import {
  NEUTRAL_STEPS,
  SEMANTIC_COLOR_TOKENS,
  SURFACE_STACK,
} from '@/lib/design-tokens/tokenAliases';
import {
  getEditableTokens,
  getEditableTokensBySection,
  readBaseTokenFromStylesheet,
} from '@/lib/design-tokens/tokenRegistry';
import { useDesignTokenOverrides } from '@/lib/design-tokens/useDesignTokenOverrides';
import { appToast } from '@/lib/toast';
import { useUserPreferences } from '@/lib/userPreferences';
import { TokenEditor } from '@/modules/showcase/components/TokenEditor';

import { ShowcaseBlock } from '../shared';

const EDITABLE_TOKENS = getEditableTokens();
const EDITABLE_SECTIONS = getEditableTokensBySection();

function NeutralRampGrid({ onSelectStep }: { onSelectStep: (step: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {NEUTRAL_STEPS.map((step) => (
        <button
          key={step}
          type="button"
          className="group flex flex-col overflow-hidden rounded-control border border-border/50 text-left transition-colors hover:border-border"
          onClick={() => onSelectStep(step)}
        >
          <div className="h-10 w-full" style={{ backgroundColor: `hsl(var(--neutral-${step}))` }} />
          <span className="px-1.5 py-1 text-[10px] text-muted-foreground group-hover:text-foreground">
            {step}
          </span>
        </button>
      ))}
    </div>
  );
}

function SurfaceStackPreview() {
  return (
    <div className="space-y-2">
      {SURFACE_STACK.map((layer) => (
        <div
          key={layer.label}
          className={cn('rounded-control border border-border/40 px-3 py-2', layer.className)}
        >
          <p className="text-xs font-medium text-foreground">{layer.label}</p>
          <p className="text-[11px] text-muted-foreground">
            {layer.className} · {layer.token}
          </p>
        </div>
      ))}
    </div>
  );
}

function ShellChromePreview() {
  return (
    <div className={cn('overflow-hidden rounded-control border', APP_SHELL_BORDER_CLASS)}>
      <div className="flex h-24">
        <div
          className={cn(
            'flex w-16 shrink-0 flex-col border-r',
            APP_SHELL_BORDER_CLASS,
            APP_SHELL_SURFACE_CLASS,
          )}
        >
          <div className={cn('h-8 border-b', APP_SHELL_BORDER_CLASS)} />
          <div className="flex-1 bg-sidebar-primary/10" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={cn(
              'flex h-8 items-center border-b px-2 text-[10px] text-muted-foreground',
              APP_SHELL_BORDER_CLASS,
              APP_SHELL_SURFACE_CLASS,
            )}
          >
            Header · bg-card
          </div>
          <div className="flex-1 bg-muted/40 p-2">
            <div className="h-full rounded-card bg-card p-2 text-[10px] text-muted-foreground">
              Page wash + white card
            </div>
          </div>
        </div>
        <div
          className={cn(
            'hidden w-14 shrink-0 border-l sm:block',
            APP_SHELL_BORDER_CLASS,
            APP_SHELL_SURFACE_CLASS,
          )}
        >
          <div className={cn('h-8 border-b', APP_SHELL_BORDER_CLASS)} />
        </div>
      </div>
    </div>
  );
}

function SemanticColorSwatches() {
  return (
    <div className="flex flex-wrap gap-2">
      {SEMANTIC_COLOR_TOKENS.map((name) => (
        <div
          key={name}
          className="rounded-badge px-2.5 py-1 text-xs font-medium capitalize"
          style={{
            backgroundColor: name === 'cta' ? 'oklch(var(--cta))' : `hsl(var(--${name}))`,
            color: `hsl(var(--${name}-foreground))`,
          }}
        >
          {name}
        </div>
      ))}
    </div>
  );
}

function LivePreview({ onSelectNeutralStep }: { onSelectNeutralStep: (step: number) => void }) {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <ShowcaseBlock title="Neutral ramp" meta="Click a step to find it in the editor">
        <NeutralRampGrid onSelectStep={onSelectNeutralStep} />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Surface stack"
        meta="card, muted, border — derived from the ramp automatically"
      >
        <SurfaceStackPreview />
      </ShowcaseBlock>

      <ShowcaseBlock title="Shell chrome" meta="Nav, header, and chat share bg-card">
        <ShellChromePreview />
      </ShowcaseBlock>

      <ShowcaseBlock title="State & brand colors" meta="Edited separately from the neutral ramp">
        <SemanticColorSwatches />
      </ShowcaseBlock>

      <ShowcaseBlock title="Components" meta="Live component preview">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="cta">Primary action</Button>
            <Button variant="default">Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <StatusBadge status="Active" />
            <StatusBadge status="Pending" variantMap={{ Pending: 'warning' }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card bg-card p-4 shadow-card">
              <p className="text-sm font-medium">Card surface</p>
              <p className="mt-1 text-xs text-muted-foreground">bg-card · rounded-card</p>
              <Input className="mt-3" placeholder="Input · bg-muted/60" />
            </div>
            <div className="rounded-card bg-highlight p-4">
              <p className="text-sm font-medium text-highlight-foreground">Highlight panel</p>
              <p className="mt-1 text-xs text-muted-foreground">Selected rows, callouts</p>
            </div>
          </div>
        </div>
      </ShowcaseBlock>
    </div>
  );
}

export function DesignTokensSection() {
  const { theme, setTheme } = useUserPreferences();
  const {
    overrides,
    setOverride,
    resetToken,
    resetAll,
    exportCss,
    overrideCount,
    persist,
    setPersist,
  } = useDesignTokenOverrides(true);

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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0 space-y-4">
        <InfoBox tone="info" title="Editable tokens">
          <p className="text-sm">
            <strong className="font-medium">Brand & state colors</strong> are at the top. Surface
            roles like <code className="text-xs">card</code> and{' '}
            <code className="text-xs">muted</code> follow the neutral ramp automatically — expand
            that section to tune grays.
          </p>
        </InfoBox>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={resetAll} disabled={overrideCount === 0}>
            Reset all ({overrideCount})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCss}
            disabled={overrideCount === 0}
          >
            Copy CSS
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            Toggle {theme === 'dark' ? 'light' : 'dark'} mode
          </Button>
          <SettingsRow
            label="Remember edits"
            description="Save overrides to localStorage."
            className="ml-auto max-w-xs border-0 py-0"
          >
            <Switch checked={persist} onCheckedChange={setPersist} />
          </SettingsRow>
        </div>
      </div>

      <SplitView
        resizable={false}
        defaultSidebarWidth={420}
        minSidebarWidth={360}
        maxSidebarWidth={520}
        className="min-h-0 flex-1 border border-border/50"
        sidebarClassName="gap-3 bg-card p-3"
        contentClassName="bg-muted/20"
        sidebar={
          <>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tokens…"
              className="h-8 shrink-0 text-sm"
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
          </>
        }
      >
        <LivePreview
          onSelectNeutralStep={(step) => {
            setSearch(`neutral-${step}`);
          }}
        />
      </SplitView>
    </div>
  );
}
