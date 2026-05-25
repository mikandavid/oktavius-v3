import {
  DEFAULT_PHONE_COUNTRIES,
  formatPhoneValue,
  sanitizePhoneLocalInput,
  splitPhoneValue,
  type PhoneCountry,
} from '@oktavius/reference-data';

import { Combobox, type ComboboxOption } from './combobox';
import { Input } from './input';
import { cn } from '../lib/utils';

export type { PhoneCountry };
export { DEFAULT_PHONE_COUNTRIES };

export interface PhoneInputProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  countries?: PhoneCountry[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Country dial code + local number input. Emits a single string (e.g. "+43 1 234 5678").
 */
export function PhoneInput({
  id,
  value = '',
  onChange,
  countries = DEFAULT_PHONE_COUNTRIES,
  disabled = false,
  placeholder = 'Local number',
  className,
}: PhoneInputProps) {
  const { countryCode, dialCode, local } = splitPhoneValue(value, countries);
  const countryOptions: ComboboxOption[] = countries.map((country) => ({
    value: country.code,
    label: country.label,
  }));

  const emit = (nextCountryCode: string, nextLocal: string) => {
    const nextCountry = countries.find((country) => country.code === nextCountryCode);
    const nextDialCode = nextCountry?.dialCode ?? dialCode;
    onChange?.(formatPhoneValue(nextDialCode, nextLocal));
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Combobox
        id={id ? `${id}-country` : undefined}
        className="w-[11rem] shrink-0"
        options={countryOptions}
        value={countryCode}
        clearable={false}
        disabled={disabled}
        searchPlaceholder="Country…"
        onChange={(next) => {
          if (next) emit(next, local);
        }}
      />
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={local}
        disabled={disabled}
        placeholder={placeholder}
        className="min-w-0 flex-1"
        onChange={(event) => emit(countryCode, sanitizePhoneLocalInput(event.target.value))}
      />
    </div>
  );
}
