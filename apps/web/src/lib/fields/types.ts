import type { ReactNode } from 'react';
import type { ZodTypeAny } from 'zod';

import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import type { CountryOption, CurrencyOption, PhoneCountry } from '@oktavius/reference-data';
import type { VocabularyOptionsMap } from '@/lib/reference-data';

export type FieldRenderContext = {
  locale: string;
  defaultCountryOptions: CountryOption[];
  defaultPhoneCountries: PhoneCountry[];
  defaultCurrencyOptions: CurrencyOption[];
  vocabularyOptions: VocabularyOptionsMap;
};

export type FieldRendererProps<TValue = FormFieldValue, TConfig extends object = object> = {
  value: TValue;
  onChange: (next: TValue) => void;
  error?: string;
  field: FormField & TConfig;
  formValues: Record<string, unknown>;
  inputId: string;
  context: FieldRenderContext;
};

export type FieldRenderer<TValue = FormFieldValue, TConfig extends object = object> = (
  props: FieldRendererProps<TValue, TConfig>,
) => ReactNode;

export type FieldDefinition<TValue = FormFieldValue, TConfig extends object = object> = {
  id: string;
  renderer: FieldRenderer<TValue, TConfig>;
  zod?: (config: FormField & TConfig) => ZodTypeAny;
  normalize?: (input: unknown) => TValue;
  serialize?: (value: TValue) => unknown;
};
