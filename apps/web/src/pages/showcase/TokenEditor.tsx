import { useEffect, useState } from 'react';

import { Button, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from '@oktavius/base-ui';
import { CloseIcon, SettingsIcon } from '@/lib/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type TokenState = {
  radiusCard: number;
  radiusControl: number;
  radiusBadge: number;
  radiusBase: number;
  shadowDepth: 'none' | 'subtle' | 'medium' | 'strong';
  accentColor: string;
  fontFamily: 'inter' | 'lora' | 'mono';
  mutedLightness: number;
};

const DEFAULTS: TokenState = {
  radiusCard: 1,
  radiusControl: 0.625,
  radiusBadge: 0.375,
  radiusBase: 0.875,
  shadowDepth: 'none',
  accentColor: '0.595 0.1488 293.77',
  fontFamily: 'inter',
  mutedLightness: 93,
};

// ─── Shadow presets ───────────────────────────────────────────────────────────

const SHADOW_PRESETS = {
  none: {
    card: '0 0 0 0 transparent',
    elevated: '0 0 0 0 transparent',
  },
  subtle: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    elevated: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
  },
  medium: {
    card: '0 2px 8px 0 rgb(0 0 0 / 0.1), 0 1px 4px -1px rgb(0 0 0 / 0.06)',
    elevated: '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -2px rgb(0 0 0 / 0.08)',
  },
  strong: {
    card: '0 4px 16px 0 rgb(0 0 0 / 0.14), 0 2px 8px -2px rgb(0 0 0 / 0.1)',
    elevated: '0 16px 40px -8px rgb(0 0 0 / 0.18), 0 8px 16px -4px rgb(0 0 0 / 0.12)',
  },
} as const;

// ─── Accent color presets ─────────────────────────────────────────────────────

const ACCENT_COLORS: { label: string; oklch: string }[] = [
  { label: 'Violet', oklch: '0.595 0.1488 293.77' },
  { label: 'Blue', oklch: '0.55 0.18 240' },
  { label: 'Emerald', oklch: '0.60 0.17 155' },
  { label: 'Rose', oklch: '0.62 0.18 15' },
  { label: 'Amber', oklch: '0.72 0.16 75' },
  { label: 'Slate', oklch: '0.52 0.06 270' },
];

// ─── Font presets ─────────────────────────────────────────────────────────────

const FONT_PRESETS = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  lora: "'Lora', ui-serif, Georgia, serif",
  mono: "'Space Mono', ui-monospace, monospace",
} as const;

// ─── Section label ────────────────────────────────────────────────────────────

function TokenSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Range slider row ─────────────────────────────────────────────────────────

function RadiusSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-xs text-foreground">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="w-full accent-primary"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ─── TokenEditor ──────────────────────────────────────────────────────────────

export function TokenEditor() {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenState>(DEFAULTS);

  // Apply tokens via inline style on :root — inline styles beat all stylesheet rules including @layer
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--radius-card', `${tokens.radiusCard}rem`);
    root.style.setProperty('--radius-control', `${tokens.radiusControl}rem`);
    root.style.setProperty('--radius-badge', `${tokens.radiusBadge}rem`);
    root.style.setProperty('--radius', `${tokens.radiusBase}rem`);
    root.style.setProperty('--shadow-card', SHADOW_PRESETS[tokens.shadowDepth].card);
    root.style.setProperty('--shadow-elevated', SHADOW_PRESETS[tokens.shadowDepth].elevated);
    root.style.setProperty('--primary', tokens.accentColor);
    root.style.setProperty('--cta', tokens.accentColor);
    root.style.setProperty('--accent', tokens.accentColor);
    root.style.setProperty('--ring', tokens.accentColor);
    root.style.setProperty('--sidebar-primary', tokens.accentColor);
    root.style.setProperty('--font-sans', FONT_PRESETS[tokens.fontFamily]);
    root.style.setProperty('--muted', `0 0% ${tokens.mutedLightness}%`);
  }, [tokens]);

  // Clean up inline styles on unmount
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      const vars = ['--radius-card','--radius-control','--radius-badge','--radius',
        '--shadow-card','--shadow-elevated','--primary','--cta','--accent',
        '--ring','--sidebar-primary','--font-sans','--muted'];
      vars.forEach(v => root.style.removeProperty(v));
    };
  }, []);

  function update<K extends keyof TokenState>(key: K, value: TokenState[K]) {
    setTokens((prev) => ({ ...prev, [key]: value }));
  }

  function resetAll() {
    setTokens(DEFAULTS);
  }

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-5 right-5 z-50 shadow-elevated"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle design token editor"
      >
        <SettingsIcon size={18} />
      </Button>

      {/* Side panel */}
      {open && (
        <div className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-border bg-background shadow-elevated">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Design Tokens</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
              aria-label="Close panel"
            >
              <CloseIcon size={15} />
            </Button>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1">
            <div className="space-y-5 px-4 py-4">

              {/* Live preview strip */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Preview</p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-10 flex-1 border bg-muted/40"
                    style={{ borderRadius: `${tokens.radiusCard}rem`, boxShadow: SHADOW_PRESETS[tokens.shadowDepth].card }}
                    title="Card surface"
                  />
                  <div
                    className="h-9 w-20 border border-input bg-background"
                    style={{ borderRadius: `${tokens.radiusControl}rem` }}
                    title="Control (input/button)"
                  />
                  <div
                    className="border bg-secondary px-2 py-0.5 text-xs"
                    style={{ borderRadius: `${tokens.radiusBadge}rem` }}
                    title="Badge"
                  >
                    badge
                  </div>
                </div>
              </div>

              {/* 1. Border Radius */}
              <TokenSection label="Border Radius">
                <div className="space-y-3">
                  <RadiusSlider
                    label="Card"
                    value={tokens.radiusCard}
                    min={0}
                    max={1.5}
                    step={0.125}
                    unit="rem"
                    onChange={(v) => update('radiusCard', v)}
                  />
                  <RadiusSlider
                    label="Control"
                    value={tokens.radiusControl}
                    min={0}
                    max={1}
                    step={0.0625}
                    unit="rem"
                    onChange={(v) => update('radiusControl', v)}
                  />
                  <RadiusSlider
                    label="Badge"
                    value={tokens.radiusBadge}
                    min={0}
                    max={0.5}
                    step={0.0625}
                    unit="rem"
                    onChange={(v) => update('radiusBadge', v)}
                  />
                  <RadiusSlider
                    label="Base"
                    value={tokens.radiusBase}
                    min={0}
                    max={1}
                    step={0.0625}
                    unit="rem"
                    onChange={(v) => update('radiusBase', v)}
                  />
                </div>
              </TokenSection>

              {/* 2. Shadow Depth */}
              <TokenSection label="Shadow Depth">
                <Select
                  value={tokens.shadowDepth}
                  onValueChange={(v) => update('shadowDepth', v as TokenState['shadowDepth'])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle (default)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </TokenSection>

              {/* 3. Accent Color */}
              <TokenSection label="Accent Color">
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.oklch}
                      type="button"
                      aria-label={color.label}
                      title={color.label}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition-all',
                        tokens.accentColor === color.oklch
                          ? 'border-foreground ring-2 ring-foreground ring-offset-2'
                          : 'border-transparent hover:border-border',
                      )}
                      style={{ backgroundColor: `oklch(${color.oklch})` }}
                      onClick={() => update('accentColor', color.oklch)}
                    />
                  ))}
                </div>
              </TokenSection>

              {/* 4. Font Family */}
              <TokenSection label="Font Family">
                <div className="flex gap-1">
                  {(['inter', 'lora', 'mono'] as const).map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => update('fontFamily', font)}
                      className={cn(
                        'flex-1 rounded-control border px-2 py-1.5 text-xs font-medium transition-colors',
                        tokens.fontFamily === font
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {font === 'inter' ? 'Inter' : font === 'lora' ? 'Lora' : 'Mono'}
                    </button>
                  ))}
                </div>
              </TokenSection>

              {/* 5. Background */}
              <TokenSection label="Background">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Page tone (lightness)</span>
                    <span className="font-mono text-xs text-foreground">{tokens.mutedLightness}%</span>
                  </div>
                  <input
                    type="range"
                    className="w-full accent-primary"
                    min={85}
                    max={97}
                    step={1}
                    value={tokens.mutedLightness}
                    onChange={(e) => update('mutedLightness', Number(e.target.value))}
                  />
                </div>
              </TokenSection>

            </div>
          </ScrollArea>

          {/* Reset footer */}
          <div className="border-t border-border px-4 py-3">
            <Button variant="outline" size="sm" className="w-full" onClick={resetAll}>
              Reset to defaults
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
