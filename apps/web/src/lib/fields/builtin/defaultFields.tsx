import {
  AddressField,
  Checkbox,
  Combobox,
  type ComboboxOption,
  DatePicker,
  type DatePickerMode,
  EMPTY_ADDRESS,
  FileInput,
  Input,
  MultiSelect,
  type MultiSelectOption,
  NumberInput,
  PhoneInput,
  RadioGroupField,
  sanitizeEmailInput,
  sanitizeUrlInput,
  Switch,
  TagsInput,
  Textarea,
} from '@oktavius/base-ui';
import { buildCountryOptions } from '@oktavius/reference-data';
import type { ChangeEvent } from 'react';
import { z } from 'zod';

import {
  type AddressValue,
  type FieldType,
  type FormFieldValue,
} from '@/components/forms/EntityForm';
import { JsonField } from '@/components/forms/JsonField';
import { LineItemArray, type LineItemRow } from '@/components/forms/LineItemArray';
import { GoogleMapsPreviewButton } from '@/components/maps/GoogleMapsDialog';
import { buildGoogleMapsSearchUrlFromAddress } from '@/components/maps/googleMapsEmbed';

import type { FieldDefinition, FieldRendererProps } from '../types';

type BuiltinProps = FieldRendererProps<FormFieldValue>;

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

function parseNumericBound(value?: string): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionList(options: BuiltinProps['field']['options']): ComboboxOption[] {
  return (options ?? []).map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
}

function stringArray(value: FormFieldValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function selectRenderer({ field, value, onChange, inputId }: BuiltinProps) {
  return (
    <Combobox
      id={inputId}
      options={optionList(field.options)}
      value={String(value ?? '') || undefined}
      placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
      disabled={field.disabled}
      asyncItems={field.asyncItems}
      onCreate={field.onCreate}
      footerAction={field.footerAction}
      onChange={(next) => onChange(next ?? '')}
    />
  );
}

const textDefinition = (id: Extract<FieldType, 'text' | 'email' | 'url'>): FieldDefinition => ({
  id,
  zod:
    id === 'email'
      ? () =>
          z.string().refine((value) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
            message: 'Enter a valid email address.',
          })
      : id === 'url'
        ? () =>
            z.string().refine(
              (value) => {
                if (!value.trim()) return true;
                try {
                  new URL(value);
                  return true;
                } catch {
                  return false;
                }
              },
              { message: 'Enter a valid URL.' },
            )
        : undefined,
  renderer: ({ field, value, onChange, inputId }) => {
    const shouldDisableSpellcheck = field.type === 'email' || field.type === 'url';
    return (
      <Input
        type={field.type === 'email' || field.type === 'url' ? field.type : 'text'}
        id={inputId}
        name={field.name}
        value={String(value ?? '')}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete ?? 'off'}
        spellCheck={shouldDisableSpellcheck ? false : undefined}
        disabled={field.disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const raw = event.target.value;
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
  },
});

export const textFieldDefinition = textDefinition('text');
export const emailFieldDefinition = textDefinition('email');
export const urlFieldDefinition = textDefinition('url');

export const textareaFieldDefinition: FieldDefinition = {
  id: 'textarea',
  renderer: ({ field, value, onChange, inputId }) => (
    <Textarea
      id={inputId}
      name={field.name}
      value={String(value ?? '')}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete ?? 'off'}
      disabled={field.disabled}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
    />
  ),
};

export const selectFieldDefinition: FieldDefinition = { id: 'select', renderer: selectRenderer };
export const comboboxFieldDefinition: FieldDefinition = {
  id: 'combobox',
  renderer: selectRenderer,
};
export const relationFieldDefinition: FieldDefinition = {
  id: 'relation',
  renderer: selectRenderer,
};

export const multiselectFieldDefinition: FieldDefinition = {
  id: 'multiselect',
  renderer: ({ field, value, onChange, inputId }) => (
    <MultiSelect
      id={inputId}
      options={optionList(field.options) as MultiSelectOption[]}
      value={stringArray(value)}
      placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
      disabled={field.disabled}
      onChange={(next) => onChange(next)}
    />
  ),
};

export const tagsFieldDefinition: FieldDefinition = {
  id: 'tags',
  renderer: ({ field, value, onChange, inputId }) => (
    <TagsInput
      id={inputId}
      value={stringArray(value)}
      placeholder={field.placeholder ?? 'Add tag…'}
      disabled={field.disabled}
      onChange={(next) => onChange(next)}
    />
  ),
};

export const radioFieldDefinition: FieldDefinition = {
  id: 'radio',
  renderer: ({ field, value, onChange, inputId }) => (
    <RadioGroupField
      id={inputId}
      options={optionList(field.options)}
      value={String(value ?? '') || undefined}
      disabled={field.disabled}
      orientation={field.radioOrientation}
      onChange={(next) => onChange(next)}
    />
  ),
};

export const vocabularyFieldDefinition: FieldDefinition = {
  id: 'vocabulary',
  renderer: ({ field, value, onChange, inputId, context }) => {
    if (!field.vocabulary) {
      return (
        <Input
          id={inputId}
          value={String(value ?? '')}
          disabled={field.disabled}
          placeholder={field.placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
      );
    }

    const options = context.vocabularyOptions[field.vocabulary];
    if (field.vocabularyDisplay === 'radio') {
      return (
        <RadioGroupField
          id={inputId}
          options={options}
          value={String(value ?? '') || undefined}
          disabled={field.disabled}
          orientation={field.radioOrientation}
          onChange={(next) => onChange(next)}
        />
      );
    }

    return (
      <Combobox
        id={inputId}
        options={options}
        value={String(value ?? '') || undefined}
        placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
        disabled={field.disabled}
        onChange={(next) => onChange(next ?? '')}
      />
    );
  },
};

export const phoneFieldDefinition: FieldDefinition = {
  id: 'phone',
  renderer: ({ field, value, onChange, inputId, context }) => (
    <PhoneInput
      id={inputId}
      value={String(value ?? '')}
      disabled={field.disabled}
      placeholder={field.placeholder ?? 'Local number'}
      countries={field.phoneCountries ?? context.defaultPhoneCountries}
      onChange={(next) => onChange(next)}
    />
  ),
};

export const addressFieldDefinition: FieldDefinition = {
  id: 'address',
  renderer: ({ field, value, onChange, inputId, context }) => {
    const addressValue = isAddressValue(value) ? value : EMPTY_ADDRESS;
    const mapsUrl = buildGoogleMapsSearchUrlFromAddress(addressValue);
    return (
      <div className="space-y-2">
        <AddressField
          id={inputId}
          value={addressValue}
          countries={field.countries ?? context.defaultCountryOptions}
          disabled={field.disabled}
          onChange={(next) => onChange(next)}
        />
        {mapsUrl ? (
          <GoogleMapsPreviewButton
            url={mapsUrl}
            label="Preview address"
            title={`${field.label} map preview`}
          />
        ) : null}
      </div>
    );
  },
};

export const countryFieldDefinition: FieldDefinition = {
  id: 'country',
  renderer: ({ field, value, onChange, inputId, context }) => (
    <Combobox
      id={inputId}
      options={field.countries ?? buildCountryOptions(context.locale, field.countryMode ?? 'all')}
      value={String(value ?? '') || undefined}
      placeholder={field.placeholder ?? 'Select country…'}
      searchPlaceholder="Search country…"
      disabled={field.disabled}
      onChange={(next) => onChange(next ?? '')}
    />
  ),
};

export const currencySelectFieldDefinition: FieldDefinition = {
  id: 'currencySelect',
  renderer: ({ field, value, onChange, inputId, context }) => (
    <Combobox
      id={inputId}
      options={field.currencyOptions ?? context.defaultCurrencyOptions}
      value={String(value ?? '') || undefined}
      placeholder={field.placeholder ?? 'Select currency…'}
      searchPlaceholder="Search currency…"
      disabled={field.disabled}
      onChange={(next) => onChange(next ?? '')}
    />
  ),
};

export const checkboxFieldDefinition: FieldDefinition = {
  id: 'checkbox',
  renderer: ({ field, value, onChange, inputId }) => (
    <Checkbox
      id={inputId}
      checked={Boolean(value)}
      disabled={field.disabled}
      onCheckedChange={(checked) => onChange(Boolean(checked))}
    />
  ),
};

export const switchFieldDefinition: FieldDefinition = {
  id: 'switch',
  renderer: ({ field, value, onChange, inputId }) => (
    <Switch
      id={inputId}
      checked={Boolean(value)}
      disabled={field.disabled}
      onCheckedChange={(checked) => onChange(Boolean(checked))}
    />
  ),
};

export const dateFieldDefinition: FieldDefinition = {
  id: 'date',
  renderer: ({ field, value, onChange, inputId }) => (
    <DatePicker
      id={inputId}
      value={String(value ?? '') || undefined}
      mode="date"
      placeholder={field.placeholder}
      disabled={field.disabled}
      minuteStep={field.minuteStep}
      onChange={(next) => onChange(next ?? '')}
    />
  ),
};

export const timeFieldDefinition: FieldDefinition = {
  id: 'time',
  renderer: ({ field, value, onChange, inputId }) => (
    <DatePicker
      id={inputId}
      value={String(value ?? '') || undefined}
      mode={'time' satisfies DatePickerMode}
      placeholder={field.placeholder}
      disabled={field.disabled}
      minuteStep={field.minuteStep}
      onChange={(next) => onChange(next ?? '')}
    />
  ),
};

export const datetimeFieldDefinition: FieldDefinition = {
  id: 'datetime',
  renderer: ({ field, value, onChange, inputId }) => (
    <DatePicker
      id={inputId}
      value={String(value ?? '') || undefined}
      mode={'datetime' satisfies DatePickerMode}
      placeholder={field.placeholder}
      disabled={field.disabled}
      minuteStep={field.minuteStep}
      onChange={(next) => onChange(next ?? '')}
    />
  ),
};

export const currencyFieldDefinition: FieldDefinition = {
  id: 'currency',
  renderer: ({ field, value, onChange, inputId, context }) => (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
        {field.currencySymbol ?? '€'}
      </span>
      <NumberInput
        id={inputId}
        value={String(value ?? '')}
        locale={context.locale}
        decimals={2}
        placeholder={field.placeholder ?? '0.00'}
        disabled={field.disabled}
        min={parseNumericBound(field.min)}
        max={parseNumericBound(field.max)}
        className="pl-7"
        onChange={(next) => onChange(next)}
      />
    </div>
  ),
};

export const numberFieldDefinition: FieldDefinition = {
  id: 'number',
  renderer: ({ field, value, onChange, inputId, context }) => (
    <NumberInput
      id={inputId}
      value={String(value ?? '')}
      locale={context.locale}
      decimals={0}
      placeholder={field.placeholder}
      disabled={field.disabled}
      min={parseNumericBound(field.min)}
      max={parseNumericBound(field.max)}
      onChange={(next) => onChange(next)}
    />
  ),
};

export const fileFieldDefinition: FieldDefinition = {
  id: 'file',
  renderer: ({ field, value, onChange, inputId }) => (
    <FileInput
      id={inputId}
      value={value instanceof File ? value : null}
      accept={field.accept}
      disabled={field.disabled}
      placeholder={field.placeholder}
      onChange={(next: File | null) => onChange(next)}
    />
  ),
};

export const jsonFieldDefinition: FieldDefinition = {
  id: 'json',
  zod: () =>
    z.string().refine(
      (value) => {
        if (!value.trim()) return true;
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Enter valid JSON.' },
    ),
  renderer: ({ field, value, onChange, inputId }) => (
    <JsonField
      id={inputId}
      value={String(value ?? '')}
      placeholder={field.placeholder}
      disabled={field.disabled}
      onChange={(next) => onChange(next)}
    />
  ),
};

export const repeatingFieldDefinition: FieldDefinition = {
  id: 'repeating',
  zod: (field) => {
    let schema = z.array(z.record(z.string(), z.unknown()));
    if (field.minItems != null) schema = schema.min(field.minItems);
    if (field.maxItems != null) schema = schema.max(field.maxItems);
    return schema;
  },
  renderer: ({ field, value, onChange, inputId, context }) => (
    <LineItemArray
      id={inputId}
      value={Array.isArray(value) ? (value as LineItemRow[]) : []}
      itemFields={field.itemFields ?? []}
      addLabel={field.addLabel}
      minItems={field.minItems}
      maxItems={field.maxItems}
      reorderable={field.reorderable}
      totals={field.totals}
      disabled={field.disabled}
      context={context}
      onChange={(rows) => onChange(rows)}
    />
  ),
};

export const builtinFieldDefinitions: FieldDefinition[] = [
  textFieldDefinition,
  emailFieldDefinition,
  urlFieldDefinition,
  textareaFieldDefinition,
  selectFieldDefinition,
  comboboxFieldDefinition,
  relationFieldDefinition,
  multiselectFieldDefinition,
  tagsFieldDefinition,
  radioFieldDefinition,
  vocabularyFieldDefinition,
  phoneFieldDefinition,
  addressFieldDefinition,
  countryFieldDefinition,
  currencySelectFieldDefinition,
  checkboxFieldDefinition,
  switchFieldDefinition,
  dateFieldDefinition,
  timeFieldDefinition,
  datetimeFieldDefinition,
  currencyFieldDefinition,
  numberFieldDefinition,
  fileFieldDefinition,
  jsonFieldDefinition,
  repeatingFieldDefinition,
];
