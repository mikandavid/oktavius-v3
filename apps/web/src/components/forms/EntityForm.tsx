import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  type ComboboxOption,
  DatePicker,
  type DatePickerMode,
  FileInput,
  Input,
  Label,
  MultiSelect,
  type MultiSelectOption,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TagsInput,
  Textarea,
} from '@oktavius/base-ui';

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
  | 'date'
  | 'time'
  | 'datetime'
  | 'currency'
  | 'file';

export type FormFieldValue = string | boolean | number | string[] | File | null | undefined;

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
};

// ─── Field Renderer ───────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  inputId,
}: {
  field: FormField;
  value: FormFieldValue;
  onChange: (value: FormFieldValue) => void;
  inputId: string;
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

    case 'select': {
      const opts = (field.options ?? []).map((o) =>
        typeof o === 'string' ? { value: o, label: o } : o,
      );
      return (
        <Select value={strValue} disabled={field.disabled} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={inputId} aria-label={field.label}>
            <SelectValue
              placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            {opts.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

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

    case 'checkbox':
      return (
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            id={inputId}
            checked={boolValue}
            disabled={field.disabled}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
          />
          <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {field.placeholder ?? field.label}
          </Label>
        </div>
      );

    case 'switch':
      return (
        <div className="flex items-center gap-2 py-1">
          <Switch
            id={inputId}
            checked={boolValue}
            disabled={field.disabled}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
          />
          <Label htmlFor={inputId} className="text-sm text-muted-foreground">
            {boolValue ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
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
          <Input
            type="number"
            id={inputId}
            name={field.name}
            value={strValue}
            placeholder={field.placeholder ?? '0.00'}
            disabled={field.disabled}
            autoComplete={textLikeAutoComplete}
            className="pl-7"
            step="0.01"
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          />
        </div>
      );
    }

    case 'file': {
      const fileValue = value instanceof File ? value : null;
      return (
        <FileInput
          id={inputId}
          value={fileValue}
          accept={field.accept}
          disabled={field.disabled}
          placeholder={field.placeholder}
          onChange={(f) => onChange(f)}
        />
      );
    }

    default:
      return (
        <Input
          type={field.type === 'number' ? 'number' : field.type}
          id={inputId}
          name={field.name}
          value={strValue}
          placeholder={field.placeholder}
          autoComplete={textLikeAutoComplete}
          spellCheck={shouldDisableSpellcheck ? false : undefined}
          disabled={field.disabled}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      );
  }
}

// ─── EntityForm ───────────────────────────────────────────────────────────────

export function EntityForm<T extends Record<string, FormFieldValue>>({
  title,
  fields,
  defaultValues,
  submitLabel = 'Save',
  subtitle,
  onSubmit,
  isSubmitting = false,
  footerActions,
}: EntityFormProps<T>) {
  const [values, setValues] = useState<T>(defaultValues);

  const groupedFields = fields.reduce(
    (sections, field) => {
      const key = field.section ?? 'General';
      if (!sections[key]) sections[key] = [];
      sections[key].push(field);
      return sections;
    },
    {} as Record<string, FormField[]>,
  );

  const set = (name: string, value: FormFieldValue) =>
    setValues((current) => ({ ...current, [name]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="space-y-4">
            {Object.entries(groupedFields).map(([section, sectionFields], index) => (
              <section
                key={section}
                className={
                  index === 0 ? 'space-y-3' : 'space-y-3 border-t border-border/70 pt-4'
                }
              >
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {section}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {sectionFields.map((field) => {
                    const isBoolean = field.type === 'checkbox' || field.type === 'switch';
                    const inputId = `field-${field.name}`;
                    return (
                      <div
                        key={field.name}
                        className={
                          field.colSpan === 2 ? 'space-y-1.5 md:col-span-2' : 'space-y-1.5'
                        }
                      >
                        {!isBoolean ? (
                          <Label
                            htmlFor={`field-${field.name}`}
                            className="text-sm font-medium text-foreground"
                          >
                            {field.label}
                            {field.required ? (
                              <span className="ml-0.5 text-destructive">*</span>
                            ) : null}
                          </Label>
                        ) : null}
                        <FieldInput
                          field={field}
                          value={values[field.name]}
                          inputId={inputId}
                          onChange={(v) => set(field.name, v)}
                        />
                        {field.description ? (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-4">
            {footerActions}
            <Button type="submit" variant="cta" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
