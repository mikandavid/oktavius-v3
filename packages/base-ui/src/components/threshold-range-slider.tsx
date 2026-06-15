import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../lib/utils';
import { NumberInput } from './number-input';

export interface PercentSliderInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Upper bound of the slider track (default 100). Values above this can still be typed in the input. */
  sliderMax?: number;
  min?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function parseIntFallback(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function PercentSliderInput({
  value,
  onChange,
  sliderMax = 100,
  min = 0,
  disabled = false,
  className,
  id,
}: PercentSliderInputProps) {
  const sliderValue = Math.min(Math.max(value, min), sliderMax);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <SliderPrimitive.Root
        className="relative flex w-28 touch-none select-none items-center"
        min={min}
        max={sliderMax}
        step={1}
        value={[sliderValue]}
        onValueChange={([v]) => {
          if (v !== undefined) onChange(v);
        }}
        disabled={disabled}
        aria-labelledby={id}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-foreground/25" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            'block h-3.5 w-3.5 rounded-full border border-border bg-background shadow-sm ring-offset-background',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        />
      </SliderPrimitive.Root>
      <NumberInput
        id={id}
        decimals={0}
        min={min}
        value={value}
        disabled={disabled}
        className="w-16 text-right"
        onChange={(v) => onChange(parseIntFallback(v, value))}
      />
    </div>
  );
}
