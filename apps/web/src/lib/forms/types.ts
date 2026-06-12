import type { AddressValue, ComboboxOption } from '@oktavius/base-ui';
import type {
  CountryOption,
  CurrencyOption,
  PhoneCountry,
  ReferenceDataMode,
  VocabularyKey,
} from '@oktavius/reference-data';

import type { PermissionRequirement } from '@/lib/permissions';

// ─── Field Types ─────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'email'
  | 'url'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'combobox'
  | 'relation'
  | 'multiselect'
  | 'tags'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'currency'
  | 'currencySelect'
  | 'country'
  | 'file'
  | 'address'
  | 'vocabulary'
  | 'json'
  | 'repeating';

export type FormFieldValue =
  | string
  | boolean
  | number
  | string[]
  | Array<Record<string, FormFieldValue>>
  | File
  | AddressValue
  | null
  | undefined;

export type FieldValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  /** Return an error string or undefined when valid. */
  custom?: (value: FormFieldValue, values: Record<string, FormFieldValue>) => string | undefined;
};

export type FormField = {
  name: string;
  label: string;
  type: FieldType | (string & {});
  autoComplete?: string;
  required?: boolean;
  /** string[] for select/combobox with plain labels; ComboboxOption[] for description/disabled support */
  options?: string[] | ComboboxOption[];
  section?: string;
  description?: string;
  /** Field-level validation message (also overridable via EntityForm `errors`). */
  error?: string;
  colSpan?: 1 | 2;
  placeholder?: string;
  min?: string;
  max?: string;
  /** currency field prefix, default '€' */
  currencySymbol?: string;
  /** time / datetime minuteStep, default 1 */
  minuteStep?: number;
  disabled?: boolean;
  /** `relation` / `combobox`: async search function */
  asyncItems?: (query: string) => Promise<ComboboxOption[]>;
  /** `relation` / `combobox`: inline create-new */
  onCreate?: {
    label: string;
    placeholder?: string;
    onSubmit: (label: string) => Promise<string | null>;
  };
  /** `relation` / `combobox`: footer link action */
  footerAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  /** `file`: accepted MIME types / extensions e.g. ".pdf,image/*" */
  accept?: string;
  /** `address` / `country`: ISO country options — defaults from reference-data */
  countries?: CountryOption[];
  /** `country`: list scope — default `all`; address blocks default to DACH-first */
  countryMode?: ReferenceDataMode;
  /** `phone`: dial-code options — defaults to reference-data list (DACH first) */
  phoneCountries?: PhoneCountry[];
  /** `currencySelect`: ISO 4217 options — defaults to reference-data list */
  currencyOptions?: CurrencyOption[];
  /** `radio`: layout direction */
  radioOrientation?: 'horizontal' | 'vertical';
  /** `vocabulary`: domain enum key from @oktavius/reference-data */
  vocabulary?: VocabularyKey;
  /** `vocabulary`: render as radio instead of combobox */
  vocabularyDisplay?: 'combobox' | 'radio';
  /** `repeating`: schema for each inline row. */
  itemFields?: FormField[];
  /** `repeating`: minimum number of rows. */
  minItems?: number;
  /** `repeating`: maximum number of rows. */
  maxItems?: number;
  /** `repeating`: add-row button label. */
  addLabel?: string;
  /** `repeating`: show row reorder controls. */
  reorderable?: boolean;
  /** `repeating`: optional footer totals derived from current rows. */
  totals?: (rows: Array<Record<string, FormFieldValue>>) => { label: string; value: string }[];
  /** Hide the field when this returns false. */
  visibleWhen?: (values: Record<string, FormFieldValue>) => boolean;
  /** Hide the field when this returns false. Alias used by field registry consumers. */
  visibleIf?: (values: Record<string, unknown>) => boolean;
  /** Field names that influence visibility or custom rendering. */
  dependsOn?: string[];
  /** Cross-field validation hook. Return an error message for this field or null when valid. */
  crossValidate?: (values: Record<string, unknown>) => string | null;
  /** Hide the field unless the active subject satisfies this requirement. */
  permission?: PermissionRequirement;
  /** Client-side validation rules applied on submit. */
  validate?: FieldValidationRule;
};
