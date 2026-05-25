import {
  DEFAULT_ADDRESS_COUNTRY_OPTIONS,
  getPostalCodeInputMode,
  sanitizePostalCodeInput,
  type CountryOption,
} from '@oktavius/reference-data';

import { Combobox, type ComboboxOption } from './combobox';
import { Input } from './input';
import { cn } from '../lib/utils';

export interface AddressValue {
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2 country code (e.g. AT, DE). */
  country: string;
}

export const EMPTY_ADDRESS: AddressValue = {
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: '',
};

export type { CountryOption };
export { DEFAULT_ADDRESS_COUNTRY_OPTIONS as DEFAULT_ADDRESS_COUNTRIES };

export interface AddressFieldProps {
  id?: string;
  value?: AddressValue;
  onChange?: (value: AddressValue) => void;
  /** ISO country options — defaults to full list with DACH countries first. */
  countries?: CountryOption[];
  disabled?: boolean;
  className?: string;
}

function fieldId(base: string | undefined, suffix: string) {
  return base ? `${base}-${suffix}` : undefined;
}

/**
 * Composite address block: street, optional line 2, postal code + city, country.
 */
export function AddressField({
  id,
  value = EMPTY_ADDRESS,
  onChange,
  countries = DEFAULT_ADDRESS_COUNTRY_OPTIONS,
  disabled = false,
  className,
}: AddressFieldProps) {
  const set = (patch: Partial<AddressValue>) => onChange?.({ ...value, ...patch });
  const countryOptions: ComboboxOption[] = countries.map((country) => ({
    value: country.value,
    label: country.label,
    description: country.description,
  }));

  return (
    <div className={cn('grid gap-3', className)}>
      <Input
        id={fieldId(id, 'line1')}
        value={value.line1}
        disabled={disabled}
        autoComplete="address-line1"
        placeholder="Street address"
        onChange={(event) => set({ line1: event.target.value })}
      />
      <Input
        id={fieldId(id, 'line2')}
        value={value.line2}
        disabled={disabled}
        autoComplete="address-line2"
        placeholder="Apartment, suite, etc. (optional)"
        onChange={(event) => set({ line2: event.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id={fieldId(id, 'postalCode')}
          value={value.postalCode}
          disabled={disabled}
          autoComplete="postal-code"
          inputMode={getPostalCodeInputMode(value.country)}
          placeholder="Postal code"
          onChange={(event) =>
            set({
              postalCode: sanitizePostalCodeInput(event.target.value, value.country),
            })
          }
        />
        <Input
          id={fieldId(id, 'city')}
          value={value.city}
          disabled={disabled}
          autoComplete="address-level2"
          placeholder="City"
          onChange={(event) => set({ city: event.target.value })}
        />
      </div>
      <Combobox
        id={fieldId(id, 'country')}
        options={countryOptions}
        value={value.country || undefined}
        disabled={disabled}
        placeholder="Country"
        searchPlaceholder="Search country…"
        onChange={(next) => {
          const country = next ?? '';
          set({
            country,
            postalCode: sanitizePostalCodeInput(value.postalCode, country),
          });
        }}
      />
    </div>
  );
}
