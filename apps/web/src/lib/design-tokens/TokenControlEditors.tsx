import { cn, Input, Label } from '@oktavius/base-ui';

import {
  hslStringFromHex,
  hslStringFromParts,
  hslToHex,
  oklchStringFromParts,
  parseHslValue,
  parseOklchValue,
  tokenToCssColor,
} from './colorUtils';
import type { DesignToken, TokenFormat } from './tokenRegistry';

function TokenSliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  displayValue: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <Label className="font-normal text-muted-foreground">{label}</Label>
        <span className="tabular-nums">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} slider`}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted',
          '[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border',
          '[&::-webkit-slider-thumb]:border-border/60 [&::-webkit-slider-thumb]:bg-card',
          '[&::-webkit-slider-thumb]:shadow-sm',
          '[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border/60',
          '[&::-moz-range-thumb]:bg-card',
        )}
      />
    </div>
  );
}

function HslTokenControls({
  value,
  onChange,
  tokenKey,
}: {
  value: string;
  onChange: (value: string) => void;
  tokenKey: string;
}) {
  const parsed = parseHslValue(value) ?? { h: 0, s: 0, l: 50 };
  const isAchromatic = parsed.s < 0.05 && Math.abs(parsed.h) < 0.05;
  const showHueSat = !tokenKey.startsWith('neutral-') || !isAchromatic;
  const pickerHex = hslToHex(parsed);

  const update = (patch: Partial<{ h: number; s: number; l: number }>) => {
    onChange(hslStringFromParts({ ...parsed, ...patch }));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Input
          type="color"
          aria-label="Color picker"
          value={pickerHex}
          onChange={(event) => {
            const next = hslStringFromHex(event.target.value);
            if (next) onChange(next);
          }}
          className="h-9 w-11 shrink-0 p-1"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
        />
      </div>
      {showHueSat ? (
        <TokenSliderRow
          label="Hue"
          value={parsed.h}
          min={0}
          max={360}
          step={1}
          onChange={(h) => update({ h })}
          displayValue={`${Math.round(parsed.h)}°`}
        />
      ) : null}
      {showHueSat ? (
        <TokenSliderRow
          label="Saturation"
          value={parsed.s}
          min={0}
          max={100}
          step={0.5}
          onChange={(s) => update({ s })}
          displayValue={`${parsed.s.toFixed(1)}%`}
        />
      ) : null}
      <TokenSliderRow
        label="Lightness"
        value={parsed.l}
        min={0}
        max={100}
        step={0.5}
        onChange={(l) => update({ l })}
        displayValue={`${parsed.l.toFixed(1)}%`}
      />
    </div>
  );
}

function OklchTokenControls({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseOklchValue(value) ?? { l: 0.5, c: 0.1, h: 293.77 };

  const update = (patch: Partial<{ l: number; c: number; h: number }>) => {
    onChange(oklchStringFromParts({ ...parsed, ...patch }));
  };

  return (
    <div className="space-y-2.5">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono text-xs"
      />
      <TokenSliderRow
        label="Lightness"
        value={parsed.l}
        min={0}
        max={1}
        step={0.005}
        onChange={(l) => update({ l })}
        displayValue={parsed.l.toFixed(3)}
      />
      <TokenSliderRow
        label="Chroma"
        value={parsed.c}
        min={0}
        max={0.35}
        step={0.002}
        onChange={(c) => update({ c })}
        displayValue={parsed.c.toFixed(4)}
      />
      <TokenSliderRow
        label="Hue"
        value={parsed.h}
        min={0}
        max={360}
        step={0.5}
        onChange={(h) => update({ h })}
        displayValue={`${parsed.h.toFixed(1)}°`}
      />
    </div>
  );
}

function LengthTokenControls({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = Number.parseFloat(value.replace(/rem$/, '').trim());
  const rem = Number.isFinite(parsed) ? parsed : 0.5;

  return (
    <div className="space-y-2.5">
      <TokenSliderRow
        label="Size"
        value={rem}
        min={0}
        max={1.5}
        step={0.025}
        onChange={(next) => onChange(`${next.toFixed(3)}rem`)}
        displayValue={`${rem.toFixed(3)} rem`}
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono text-xs"
      />
    </div>
  );
}

function TimeTokenControls({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = Number.parseInt(value.replace(/ms$/, '').trim(), 10);
  const ms = Number.isFinite(parsed) ? parsed : 150;

  return (
    <div className="space-y-2.5">
      <TokenSliderRow
        label="Duration"
        value={ms}
        min={50}
        max={400}
        step={5}
        onChange={(next) => onChange(`${next}ms`)}
        displayValue={`${ms} ms`}
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono text-xs"
      />
    </div>
  );
}

function TextTokenControls({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="font-mono text-xs"
    />
  );
}

export function TokenFormatControls({
  token,
  value,
  onChange,
}: {
  token: Pick<DesignToken, 'key' | 'format'>;
  value: string;
  onChange: (value: string) => void;
}) {
  switch (token.format as TokenFormat) {
    case 'hsl':
      return <HslTokenControls value={value} onChange={onChange} tokenKey={token.key} />;
    case 'oklch':
      return <OklchTokenControls value={value} onChange={onChange} />;
    case 'length':
      return <LengthTokenControls value={value} onChange={onChange} />;
    case 'time':
      return <TimeTokenControls value={value} onChange={onChange} />;
    default:
      return <TextTokenControls value={value} onChange={onChange} />;
  }
}

export function TokenPreviewSwatch({
  value,
  format,
  className,
}: {
  value: string;
  format: TokenFormat;
  className?: string;
}) {
  if (format !== 'hsl' && format !== 'oklch') return null;
  return (
    <span
      className={cn('shrink-0 rounded-md border border-border/60', className)}
      style={{
        backgroundColor: tokenToCssColor(value, format === 'oklch' ? 'oklch' : 'hsl'),
      }}
      aria-hidden
    />
  );
}
