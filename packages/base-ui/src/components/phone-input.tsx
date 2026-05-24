import { Combobox, type ComboboxOption } from './combobox';
import { Input } from './input';
import { cn } from '../lib/utils';

export interface PhoneCountry {
  code: string;
  dialCode: string;
  label: string;
}

/** DACH-first defaults; extend as needed for other markets. */
export const DEFAULT_PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'AT', dialCode: '+43', label: 'Austria (+43)' },
  { code: 'DE', dialCode: '+49', label: 'Germany (+49)' },
  { code: 'CH', dialCode: '+41', label: 'Switzerland (+41)' },
  { code: 'IT', dialCode: '+39', label: 'Italy (+39)' },
  { code: 'FR', dialCode: '+33', label: 'France (+33)' },
  { code: 'NL', dialCode: '+31', label: 'Netherlands (+31)' },
  { code: 'GB', dialCode: '+44', label: 'United Kingdom (+44)' },
  { code: 'US', dialCode: '+1', label: 'United States (+1)' },
];

function splitPhoneValue(value: string, countries: PhoneCountry[]) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { dialCode: countries[0]?.dialCode ?? '+43', local: '' };
  }

  const match = countries
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => trimmed.startsWith(country.dialCode));

  if (match) {
    return {
      dialCode: match.dialCode,
      local: trimmed.slice(match.dialCode.length).trim(),
    };
  }

  return { dialCode: countries[0]?.dialCode ?? '+43', local: trimmed };
}

function formatLocalNumber(raw: string) {
  const digits = raw.replace(/[^\d\s]/g, '');
  const parts = digits.replace(/\s+/g, ' ').trim();
  return parts;
}

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
  const { dialCode, local } = splitPhoneValue(value, countries);
  const countryOptions: ComboboxOption[] = countries.map((country) => ({
    value: country.dialCode,
    label: country.label,
  }));

  const emit = (nextDialCode: string, nextLocal: string) => {
    const formattedLocal = formatLocalNumber(nextLocal);
    if (!formattedLocal) {
      onChange?.('');
      return;
    }
    onChange?.(`${nextDialCode} ${formattedLocal}`.trim());
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Combobox
        id={id ? `${id}-country` : undefined}
        className="w-[11rem] shrink-0"
        options={countryOptions}
        value={dialCode}
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
        onChange={(event) => emit(dialCode, event.target.value)}
      />
    </div>
  );
}
