import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type {
  CountryOption,
  CurrencyOption,
  PhoneCountry,
  ReferenceDataMode,
  VocabularyKey,
} from '@oktavius/reference-data';
import { buildCountryOptions } from '@oktavius/reference-data';
import {
  AddressField,
  type AddressValue,
  Button,
  Checkbox,
  Combobox,
  type ComboboxOption,
  DatePicker,
  type DatePickerMode,
  EMPTY_ADDRESS,
  FileInput,
  FormField as FormFieldControl,
  Input,
  Label,
  MultiSelect,
  type MultiSelectOption,
  NumberInput,
  PhoneInput,
  RadioGroupField,
  SectionCard,
  SettingsRow,
  Switch,
  TagsInput,
  Textarea,
  cn,
  sanitizeEmailInput,
  sanitizeUrlInput,
} from '@oktavius/base-ui';

import {
  useCountryOptions,
  useCurrencyOptions,
  usePhoneCountries,
  useVocabularyOptionsMap,
  type VocabularyOptionsMap,
} from '@/lib/reference-data';
import { useUserPreferences } from '@/lib/userPreferences';
import {
  filterVisibleFields,
  validateFormFields,
  type FieldValidationRule,
} from '@/lib/formValidation';

import { JsonField } from './JsonField';
import { useFormDirtyGuard } from './useFormDirtyGuard';

export type { AddressValue };
export { EMPTY_ADDRESS } from '@oktavius/base-ui';

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
  | 'json';

export type { FieldValidationRule };

export type FormFieldValue =
  | string
  | boolean
  | number
  | string[]
  | File
  | AddressValue
  | null
  | undefined;

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
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
  /** Hide the field when this returns false. */
  visibleWhen?: (values: Record<string, FormFieldValue>) => boolean;
  /** Client-side validation rules applied on submit. */
  validate?: FieldValidationRule;
};

// ─── Form Props ───────────────────────────────────────────────────────────────

type EntityFormProps<T extends Record<string, FormFieldValue>> = {
  title: string;
  fields: FormField[];
  defaultValues: T;
  submitLabel?: string;
  subtitle?: string;
  onSubmit: (values: T) => void;
  isSubmitting?: boolean;
  footerActions?: React.ReactNode;
  /** Server or client validation errors keyed by field name. */
  errors?: Partial<Record<keyof T & string, string>>;
  /** `page` = card on route; `dialog` = fields inside Dialog (no nested card, purple save). */
  surface?: 'page' | 'dialog';
  /** Defaults to `cta` in dialogs and `default` on full pages. */
  submitVariant?: 'default' | 'cta';
  /** Hide the built-in title block when the parent Dialog already has DialogTitle. */
  showHeader?: boolean;
  /** Extra blocks rendered after standard fields (e.g. custom fields section). */
  renderAfterFields?: (ctx: {
    values: T;
    set: (name: string, value: FormFieldValue) => void;
    errors: Partial<Record<keyof T & string, string>>;
  }) => ReactNode;
  /** Warn on browser tab close when values differ from defaultValues. */
  warnOnDirty?: boolean;
  /** Skip built-in client validation (server-only forms). */
  skipClientValidation?: boolean;
};

function isAddressValue(value: FormFieldValue): value is AddressValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof File) &&
    !Array.isArray(value) &&
    'line1' in value &&
    'city' in value &&
    'country' in value
  );
}

function resolveFieldError<T extends Record<string, FormFieldValue>>(
  field: FormField,
  errors?: Partial<Record<keyof T & string, string>>,
) {
  return errors?.[field.name] ?? field.error;
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function parseNumericBound(value?: string): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FieldInput({
  field,
  value,
  onChange,
  inputId,
  locale,
  defaultCountryOptions,
  defaultPhoneCountries,
  defaultCurrencyOptions,
  vocabularyOptions,
}: {
  field: FormField;
  value: FormFieldValue;
  onChange: (value: FormFieldValue) => void;
  inputId: string;
  locale: string;
  defaultCountryOptions: CountryOption[];
  defaultPhoneCountries: PhoneCountry[];
  defaultCurrencyOptions: CurrencyOption[];
  vocabularyOptions: VocabularyOptionsMap;
}) {
  const strValue = String(value ?? '');
  const boolValue = Boolean(value);
  const textLikeAutoComplete = field.autoComplete ?? 'off';
  const shouldDisableSpellcheck = field.type === 'email' || field.type === 'url';

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          id={inputId}
          name={field.name}
          value={strValue}
          placeholder={field.placeholder}
          autoComplete={textLikeAutoComplete}
          spellCheck={shouldDisableSpellcheck ? false : undefined}
          disabled={field.disabled}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        />
      );

    case 'select':
    case 'combobox':
    case 'relation': {
      const opts: ComboboxOption[] = (field.options ?? []).map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o,
      );
      return (
        <Combobox
          id={inputId}
          options={opts}
          value={strValue || undefined}
          placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
          disabled={field.disabled}
          asyncItems={field.asyncItems}
          onCreate={field.onCreate}
          footerAction={field.footerAction}
          onChange={(v) => onChange(v ?? '')}
        />
      );
    }

    case 'multiselect': {
      const opts: MultiSelectOption[] = (field.options ?? []).map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o,
      );
      const arrValue = Array.isArray(value) ? value : [];
      return (
        <MultiSelect
          id={inputId}
          options={opts}
          value={arrValue}
          placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
          disabled={field.disabled}
          onChange={(v) => onChange(v)}
        />
      );
    }

    case 'tags': {
      const arrValue = Array.isArray(value) ? value : [];
      return (
        <TagsInput
          id={inputId}
          value={arrValue}
          placeholder={field.placeholder ?? 'Add tag…'}
          disabled={field.disabled}
          onChange={(v) => onChange(v)}
        />
      );
    }

    case 'radio': {
      const opts = (field.options ?? []).map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o,
      );
      return (
        <RadioGroupField
          id={inputId}
          options={opts}
          value={strValue || undefined}
          disabled={field.disabled}
          orientation={field.radioOrientation}
          onChange={(v) => onChange(v)}
        />
      );
    }

    case 'vocabulary': {
      if (!field.vocabulary) {
        return (
          <Input
            id={inputId}
            value={strValue}
            disabled={field.disabled}
            placeholder={field.placeholder}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          />
        );
      }

      const opts = vocabularyOptions[field.vocabulary];
      if (field.vocabularyDisplay === 'radio') {
        return (
          <RadioGroupField
            id={inputId}
            options={opts}
            value={strValue || undefined}
            disabled={field.disabled}
            orientation={field.radioOrientation}
            onChange={(v) => onChange(v)}
          />
        );
      }

      return (
        <Combobox
          id={inputId}
          options={opts}
          value={strValue || undefined}
          placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
          disabled={field.disabled}
          onChange={(v) => onChange(v ?? '')}
        />
      );
    }

    case 'phone':
      return (
        <PhoneInput
          id={inputId}
          value={strValue}
          disabled={field.disabled}
          placeholder={field.placeholder ?? 'Local number'}
          countries={field.phoneCountries ?? defaultPhoneCountries}
          onChange={(v) => onChange(v)}
        />
      );

    case 'address': {
      const addressValue = isAddressValue(value) ? value : EMPTY_ADDRESS;
      return (
        <AddressField
          id={inputId}
          value={addressValue}
          countries={field.countries ?? defaultCountryOptions}
          disabled={field.disabled}
          onChange={(v) => onChange(v)}
        />
      );
    }

    case 'country': {
      const countryOptions: ComboboxOption[] =
        field.countries ?? buildCountryOptions(locale, field.countryMode ?? 'all');
      return (
        <Combobox
          id={inputId}
          options={countryOptions}
          value={strValue || undefined}
          placeholder={field.placeholder ?? 'Select country…'}
          searchPlaceholder="Search country…"
          disabled={field.disabled}
          onChange={(v) => onChange(v ?? '')}
        />
      );
    }

    case 'currencySelect': {
      const currencyOpts = field.currencyOptions ?? defaultCurrencyOptions;
      return (
        <Combobox
          id={inputId}
          options={currencyOpts}
          value={strValue || undefined}
          placeholder={field.placeholder ?? 'Select currency…'}
          searchPlaceholder="Search currency…"
          disabled={field.disabled}
          onChange={(v) => onChange(v ?? '')}
        />
      );
    }

    case 'checkbox':
      return (
        <Checkbox
          id={inputId}
          checked={boolValue}
          disabled={field.disabled}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
      );

    case 'switch':
      return (
        <Switch
          id={inputId}
          checked={boolValue}
          disabled={field.disabled}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
      );

    case 'date':
    case 'time':
    case 'datetime': {
      const modeMap: Record<string, DatePickerMode> = {
        date: 'date',
        time: 'time',
        datetime: 'datetime',
      };
      return (
        <DatePicker
          id={inputId}
          value={strValue || undefined}
          mode={modeMap[field.type]}
          placeholder={field.placeholder}
          disabled={field.disabled}
          minuteStep={field.minuteStep}
          onChange={(v) => onChange(v ?? '')}
        />
      );
    }

    case 'currency': {
      const symbol = field.currencySymbol ?? '€';
      return (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            {symbol}
          </span>
          <NumberInput
            id={inputId}
            value={strValue}
            locale={locale}
            decimals={2}
            placeholder={field.placeholder ?? '0.00'}
            disabled={field.disabled}
            min={parseNumericBound(field.min)}
            max={parseNumericBound(field.max)}
            className="pl-7"
            onChange={(v) => onChange(v)}
          />
        </div>
      );
    }

    case 'number':
      return (
        <NumberInput
          id={inputId}
          value={strValue}
          locale={locale}
          decimals={0}
          placeholder={field.placeholder}
          disabled={field.disabled}
          min={parseNumericBound(field.min)}
          max={parseNumericBound(field.max)}
          onChange={(v) => onChange(v)}
        />
      );

    case 'file': {
      const fileValue = value instanceof File ? value : null;
      return (
        <FileInput
          id={inputId}
          value={fileValue}
          accept={field.accept}
          disabled={field.disabled}
          placeholder={field.placeholder}
          onChange={(f: File | null) => onChange(f)}
        />
      );
    }

    case 'json':
      return (
        <JsonField
          id={inputId}
          value={strValue}
          placeholder={field.placeholder}
          disabled={field.disabled}
          onChange={(next) => onChange(next)}
        />
      );

    default: {
      const inputType = field.type === 'email' || field.type === 'url' ? field.type : 'text';
      return (
        <Input
          type={inputType}
          id={inputId}
          name={field.name}
          value={strValue}
          placeholder={field.placeholder}
          autoComplete={textLikeAutoComplete}
          spellCheck={shouldDisableSpellcheck ? false : undefined}
          disabled={field.disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            if (field.type === 'email') {
              onChange(sanitizeEmailInput(raw));
              return;
            }
            if (field.type === 'url') {
              onChange(sanitizeUrlInput(raw));
              return;
            }
            onChange(raw);
          }}
        />
      );
    }
  }
}

// ─── EntityForm ───────────────────────────────────────────────────────────────

function EntityFormFields<T extends Record<string, FormFieldValue>>({
  fields,
  values,
  errors,
  set,
  locale,
  defaultCountryOptions,
  defaultPhoneCountries,
  defaultCurrencyOptions,
  vocabularyOptions,
  surface = 'page',
}: {
  fields: FormField[];
  values: T;
  errors?: Partial<Record<keyof T & string, string>>;
  set: (name: string, value: FormFieldValue) => void;
  locale: string;
  defaultCountryOptions: CountryOption[];
  defaultPhoneCountries: PhoneCountry[];
  defaultCurrencyOptions: CurrencyOption[];
  vocabularyOptions: VocabularyOptionsMap;
  surface?: 'page' | 'dialog';
}) {
  const visibleFields = useMemo(() => filterVisibleFields(fields, values), [fields, values]);
  const visibleGroupedFields = useMemo(() => {
    return visibleFields.reduce(
      (sections, field) => {
        const key = field.section ?? 'General';
        if (!sections[key]) sections[key] = [];
        sections[key].push(field);
        return sections;
      },
      {} as Record<string, FormField[]>,
    );
  }, [visibleFields]);

  const sectionEntries = Object.entries(visibleGroupedFields);
  const hideSectionHeading = surface === 'dialog' && sectionEntries.length === 1;

  return (
    <div className="space-y-4">
      {sectionEntries.map(([section, sectionFields], index) => (
        <section
          key={section}
          className={index === 0 ? 'space-y-3' : 'space-y-3 border-t border-border/70 pt-4'}
        >
          {hideSectionHeading ? null : (
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {section}
            </h3>
          )}
          <div
            className={cn('grid gap-4', surface === 'dialog' ? 'grid-cols-1' : 'md:grid-cols-2')}
          >
            {sectionFields.map((field) => {
              const isBoolean = field.type === 'checkbox' || field.type === 'switch';
              const inputId = `field-${field.name}`;
              const error = resolveFieldError(field, errors);

              if (isBoolean && surface === 'dialog') {
                return (
                  <div key={field.name} className="space-y-1.5">
                    <SettingsRow label={field.label} description={field.description}>
                      <FieldInput
                        field={field}
                        value={values[field.name]}
                        inputId={inputId}
                        locale={locale}
                        defaultCountryOptions={defaultCountryOptions}
                        defaultPhoneCountries={defaultPhoneCountries}
                        defaultCurrencyOptions={defaultCurrencyOptions}
                        vocabularyOptions={vocabularyOptions}
                        onChange={(v) => set(field.name, v)}
                      />
                    </SettingsRow>
                    {error ? (
                      <p role="alert" className="text-xs text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              }

              if (isBoolean) {
                return (
                  <div
                    key={field.name}
                    className={field.colSpan === 2 ? 'space-y-1.5 md:col-span-2' : 'space-y-1.5'}
                  >
                    <div className="flex items-center gap-2 py-1">
                      <FieldInput
                        field={field}
                        value={values[field.name]}
                        inputId={inputId}
                        locale={locale}
                        defaultCountryOptions={defaultCountryOptions}
                        defaultPhoneCountries={defaultPhoneCountries}
                        defaultCurrencyOptions={defaultCurrencyOptions}
                        vocabularyOptions={vocabularyOptions}
                        onChange={(v) => set(field.name, v)}
                      />
                      <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
                        {field.placeholder ?? field.label}
                      </Label>
                    </div>
                    {field.description ? (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    ) : null}
                    {error ? (
                      <p role="alert" className="text-xs text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              }

              return (
                <FormFieldControl
                  key={field.name}
                  id={inputId}
                  label={field.label}
                  required={field.required}
                  description={field.description}
                  error={error}
                  className={cn(
                    field.colSpan === 2 && surface !== 'dialog' ? 'md:col-span-2' : undefined,
                    surface === 'dialog' && field.type === 'number' ? 'max-w-[7rem]' : undefined,
                  )}
                >
                  <FieldInput
                    field={field}
                    value={values[field.name]}
                    inputId={inputId}
                    locale={locale}
                    defaultCountryOptions={defaultCountryOptions}
                    defaultPhoneCountries={defaultPhoneCountries}
                    defaultCurrencyOptions={defaultCurrencyOptions}
                    vocabularyOptions={vocabularyOptions}
                    onChange={(v) => set(field.name, v)}
                  />
                </FormFieldControl>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function EntityForm<T extends Record<string, FormFieldValue>>({
  title,
  fields,
  defaultValues,
  submitLabel = 'Save',
  subtitle,
  onSubmit,
  isSubmitting = false,
  footerActions,
  errors,
  surface = 'page',
  submitVariant,
  showHeader,
  renderAfterFields,
  warnOnDirty = false,
  skipClientValidation = false,
}: EntityFormProps<T>) {
  const [values, setValues] = useState<T>(defaultValues);
  const [clientErrors, setClientErrors] = useState<Partial<Record<keyof T & string, string>>>({});
  const { locale } = useUserPreferences();
  const defaultCountryOptions = useCountryOptions();
  const defaultPhoneCountries = usePhoneCountries();
  const defaultCurrencyOptions = useCurrencyOptions();
  const vocabularyOptions = useVocabularyOptionsMap();

  useFormDirtyGuard({
    values,
    initialValues: defaultValues,
    enabled: warnOnDirty,
  });

  const mergedErrors = { ...clientErrors, ...errors };

  const set = (name: string, value: FormFieldValue) => {
    setValues((current) => ({ ...current, [name]: value }));
    setClientErrors((current) => {
      if (!current[name as keyof T & string]) return current;
      const next = { ...current };
      delete next[name as keyof T & string];
      return next;
    });
  };

  const resolvedSubmitVariant = submitVariant ?? (surface === 'dialog' ? 'cta' : 'default');
  const resolvedShowHeader = showHeader === true && surface === 'dialog';

  const form = (
    <form
      className="space-y-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!skipClientValidation) {
          const nextErrors = validateFormFields(fields, values) as Partial<
            Record<keyof T & string, string>
          >;
          if (Object.keys(nextErrors).length > 0) {
            setClientErrors(nextErrors);
            return;
          }
        }
        setClientErrors({});
        onSubmit(values);
      }}
    >
      {resolvedShowHeader ? (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      <EntityFormFields
        fields={fields}
        values={values}
        errors={mergedErrors}
        set={set}
        locale={locale}
        defaultCountryOptions={defaultCountryOptions}
        defaultPhoneCountries={defaultPhoneCountries}
        defaultCurrencyOptions={defaultCurrencyOptions}
        vocabularyOptions={vocabularyOptions}
        surface={surface}
      />
      {renderAfterFields ? renderAfterFields({ values, set, errors: mergedErrors }) : null}
      <div
        className={
          surface === 'dialog'
            ? 'flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end'
            : 'flex items-center justify-end gap-2 border-t border-border/70 pt-4'
        }
      >
        {footerActions}
        <Button type="submit" variant={resolvedSubmitVariant} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (surface === 'dialog') {
    return form;
  }

  return (
    <SectionCard title={title} meta={subtitle}>
      {form}
    </SectionCard>
  );
}
