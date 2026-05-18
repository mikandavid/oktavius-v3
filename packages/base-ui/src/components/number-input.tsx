import * as React from 'react';

import { cn } from '../lib/utils';

export interface NumberInputProps {
  value?: number | string | null;
  onChange?: (value: string) => void;
  /** Decimal places shown. Default 2. */
  decimals?: number;
  /** Locale for display formatting. Default 'en'. */
  locale?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Number input that formats with thousands separators on blur,
 * returns raw numeric string to onChange.
 */
export function NumberInput({
  value,
  onChange,
  decimals = 2,
  locale = 'en',
  placeholder = '0',
  disabled = false,
  className,
  id,
  min,
  max,
  step,
}: NumberInputProps) {
  const rawValue = value != null ? String(value) : '';
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState(rawValue);

  React.useEffect(() => {
    if (!focused) setDraft(rawValue);
  }, [rawValue, focused]);

  const formatted = React.useMemo(() => {
    const num = parseFloat(rawValue.replace(/,/g, ''));
    if (isNaN(num)) return rawValue;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(num);
  }, [rawValue, locale, decimals]);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={focused ? draft : formatted || rawValue}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      onFocus={() => {
        setFocused(true);
        setDraft(rawValue);
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d.,-]/g, '');
        setDraft(v);
        onChange?.(v.replace(/,/g, ''));
      }}
      onBlur={() => {
        setFocused(false);
        onChange?.(draft.replace(/,/g, ''));
      }}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm tabular-nums',
        'ring-offset-background placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    />
  );
}
