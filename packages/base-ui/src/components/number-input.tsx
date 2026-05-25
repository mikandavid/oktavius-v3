import * as React from 'react';

import {
  type ControlValidationState,
  filledControlStateClasses,
  resolveControlValidationState,
} from '../lib/controlStates';
import { sanitizeDecimalInput, sanitizeIntegerInput } from '../lib/input-sanitize';
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
  validationState?: ControlValidationState;
  valid?: boolean;
  invalid?: boolean;
  'aria-invalid'?: boolean | 'false' | 'grammar' | 'spelling';
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
  validationState,
  valid,
  invalid,
  'aria-invalid': ariaInvalid,
}: NumberInputProps) {
  const rawValue = value != null ? String(value) : '';
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState(rawValue);

  React.useEffect(() => {
    if (!focused) setDraft(rawValue);
  }, [rawValue, focused]);

  const isInteger = decimals === 0;

  const formatted = React.useMemo(() => {
    const num = parseFloat(rawValue.replace(/,/g, ''));
    if (isNaN(num)) return rawValue;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(num);
  }, [rawValue, locale, decimals]);

  const sanitize = React.useCallback(
    (next: string) => (isInteger ? sanitizeIntegerInput(next) : sanitizeDecimalInput(next)),
    [isInteger],
  );

  const resolvedState = resolveControlValidationState({
    validationState,
    valid,
    invalid,
    'aria-invalid': ariaInvalid,
  });

  return (
    <input
      id={id}
      type="text"
      inputMode={isInteger ? 'numeric' : 'decimal'}
      value={focused ? draft : formatted || rawValue}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      aria-invalid={resolvedState === 'invalid' ? true : ariaInvalid}
      data-valid={resolvedState === 'valid' ? 'true' : undefined}
      onFocus={() => {
        setFocused(true);
        setDraft(rawValue);
      }}
      onChange={(e) => {
        const v = sanitize(e.target.value);
        setDraft(v);
        onChange?.(v);
      }}
      onBlur={() => {
        setFocused(false);
        onChange?.(sanitize(draft));
      }}
      className={cn(
        'flex h-9 w-full px-3 py-1 text-sm tabular-nums placeholder:text-muted-foreground',
        filledControlStateClasses({
          validationState: resolvedState,
          valid,
          invalid,
          'aria-invalid': ariaInvalid,
        }),
        className,
      )}
    />
  );
}
