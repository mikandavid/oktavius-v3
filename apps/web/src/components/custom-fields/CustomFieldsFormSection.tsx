import type { ChangeEvent } from 'react';

import {
  Combobox,
  DatePicker,
  FormField as FormFieldControl,
  Input,
  MultiSelect,
  NumberInput,
  SectionCard,
  SettingsRow,
  Switch,
  Textarea,
} from '@oktavius/base-ui';

import { FIELD_GROUP_LABEL_CLASS } from '@/components/common/pageChrome';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import {
  type CustomFieldDefinition,
  type CustomFieldValues,
  useCustomFieldDefinitions,
} from '@/lib/custom-fields';

type CustomFieldsFormSectionProps = {
  entityType: string;
  values: CustomFieldValues;
  onChange: (fieldKey: string, value: FormFieldValue) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  title?: string;
  surface?: 'section' | 'embedded';
};

function toFormValue(value: CustomFieldValues[string]): FormFieldValue {
  if (value == null) return '';
  return value;
}

function stringArray(value: FormFieldValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function CustomFieldInput({
  definition,
  value,
  onChange,
  error,
  disabled,
}: {
  definition: CustomFieldDefinition;
  value: FormFieldValue;
  onChange: (value: FormFieldValue) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputId = `custom-field-${definition.fieldKey}`;

  const control = (() => {
    switch (definition.fieldType) {
      case 'textarea':
        return (
          <Textarea
            id={inputId}
            value={String(value ?? '')}
            placeholder={definition.placeholder}
            disabled={disabled}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
          />
        );
      case 'select':
        return (
          <Combobox
            id={inputId}
            options={(definition.options ?? []).map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={String(value ?? '') || undefined}
            placeholder={definition.placeholder ?? `Select ${definition.label.toLowerCase()}`}
            disabled={disabled}
            onChange={(next) => onChange(next ?? '')}
          />
        );
      case 'multiselect':
        return (
          <MultiSelect
            id={inputId}
            options={(definition.options ?? []).map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={stringArray(value)}
            placeholder={definition.placeholder ?? `Select ${definition.label.toLowerCase()}`}
            disabled={disabled}
            onChange={(next) => onChange(next)}
          />
        );
      case 'checkbox':
        return (
          <Switch
            id={inputId}
            checked={Boolean(value)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
          />
        );
      case 'currency':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              €
            </span>
            <NumberInput
              id={inputId}
              value={String(value ?? '')}
              decimals={2}
              placeholder={definition.placeholder ?? '0.00'}
              disabled={disabled}
              className="pl-7"
              onChange={(next) => onChange(next)}
            />
          </div>
        );
      case 'date':
        return (
          <DatePicker
            id={inputId}
            mode="date"
            value={String(value ?? '') || undefined}
            placeholder={definition.placeholder}
            disabled={disabled}
            onChange={(next) => onChange(next ?? '')}
          />
        );
      case 'number':
        return (
          <NumberInput
            id={inputId}
            value={String(value ?? '')}
            decimals={0}
            placeholder={definition.placeholder}
            disabled={disabled}
            onChange={(next) => onChange(next)}
          />
        );
      case 'email':
        return (
          <Input
            id={inputId}
            type="email"
            value={String(value ?? '')}
            placeholder={definition.placeholder}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        );
      default:
        return (
          <Input
            id={inputId}
            value={String(value ?? '')}
            placeholder={definition.placeholder}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
        );
    }
  })();

  if (definition.fieldType === 'checkbox') {
    return (
      <SettingsRow label={definition.label} description={definition.description}>
        {control}
      </SettingsRow>
    );
  }

  return (
    <FormFieldControl
      id={inputId}
      label={definition.label}
      required={definition.required}
      description={definition.description}
      error={error}
      className={definition.fieldType === 'textarea' ? 'md:col-span-2' : undefined}
    >
      {control}
    </FormFieldControl>
  );
}

export function CustomFieldsFormSection({
  entityType,
  values,
  onChange,
  errors,
  disabled = false,
  title = 'Custom fields',
  surface = 'section',
}: CustomFieldsFormSectionProps) {
  const { definitions, isLoading } = useCustomFieldDefinitions(entityType);

  if (isLoading || definitions.length === 0) return null;

  const grouped = definitions.reduce(
    (sections, definition) => {
      const key = definition.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(definition);
      return sections;
    },
    {} as Record<string, CustomFieldDefinition[]>,
  );

  const body = (
    <div className="space-y-4">
      {Object.entries(grouped).map(([section, sectionDefinitions]) => (
        <div key={section} className="space-y-3">
          {Object.keys(grouped).length > 1 ? (
            <h4 className={FIELD_GROUP_LABEL_CLASS}>{section}</h4>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {sectionDefinitions.map((definition) => (
              <CustomFieldInput
                key={definition.id}
                definition={definition}
                value={toFormValue(values[definition.fieldKey])}
                error={errors?.[definition.fieldKey]}
                disabled={disabled}
                onChange={(next) => onChange(definition.fieldKey, next)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (surface === 'embedded') {
    return (
      <div className="space-y-3 border-t border-border/70 pt-4">
        <h3 className={FIELD_GROUP_LABEL_CLASS}>{title}</h3>
        {body}
      </div>
    );
  }

  return <SectionCard title={title}>{body}</SectionCard>;
}
