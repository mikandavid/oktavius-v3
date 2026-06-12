import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type DefaultValues, type Path, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  type AddressValue,
  Button,
  FormField as FormFieldControl,
  Label,
  SectionCard,
  SettingsRow,
  cn,
} from '@oktavius/base-ui';

import {
  useCountryOptions,
  useCurrencyOptions,
  usePhoneCountries,
  useVocabularyOptionsMap,
} from '@/lib/reference-data';
import { useUserPreferences } from '@/lib/userPreferences';
import {
  filterPermittedFormFields,
  filterVisibleFields,
  type FormSubmissionResult,
  normalizeFormSubmissionFailure,
} from '@/lib/formValidation';
import { EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { buildFormZodSchema } from '@/lib/buildFormZodSchema';
import { FIELD_GROUP_LABEL_CLASS } from '@/components/common/pageChrome';
import { usePreloadNamespaces } from '@/core/i18n';
import { fieldRegistry, type FieldRenderContext } from '@/lib/fields';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { useFormDirtyGuard } from './useFormDirtyGuard';
import { useFormLeaveBlocker } from './useFormLeaveBlocker';

export type { AddressValue };
export { EMPTY_ADDRESS } from '@oktavius/base-ui';

// Field types are defined in the lib layer so lib utilities never depend on
// this component. Re-exported here for existing consumers.
export type { FieldType, FieldValidationRule, FormField, FormFieldValue } from '@/lib/forms/types';
import type { FormField, FormFieldValue } from '@/lib/forms/types';

// ─── Form Props ───────────────────────────────────────────────────────────────

type EntityFormProps<T extends Record<string, FormFieldValue>> = {
  title: string;
  fields: FormField[];
  defaultValues: T;
  submitLabel?: string;
  subtitle?: string;
  onSubmit: (values: T) => FormSubmissionResult | Promise<FormSubmissionResult>;
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
  /** Notifies parent when dirty state changes (for dialog close guards). */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Skip built-in client validation (server-only forms). */
  skipClientValidation?: boolean;
  /** Debounced autosave for generated edit forms. Uses `onSubmit` unless `onSave` is provided. */
  autoSave?: boolean | EntityFormAutoSaveOptions<T>;
};

export type EntityFormAutoSaveOptions<T extends Record<string, FormFieldValue>> = {
  enabled?: boolean;
  delayMs?: number;
  onSave?: (values: T) => FormSubmissionResult | Promise<FormSubmissionResult>;
};

export function isAddressValue(value: FormFieldValue): value is AddressValue {
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

function serializeAutosaveValues(values: Record<string, FormFieldValue>) {
  try {
    return JSON.stringify(values, (_key, value: unknown) => {
      if (value instanceof File) {
        return {
          name: value.name,
          size: value.size,
          type: value.type,
          lastModified: value.lastModified,
        };
      }
      return value;
    });
  } catch {
    return String(Date.now());
  }
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

export function parseNumericBound(value?: string): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FieldInput({
  field,
  value,
  onChange,
  inputId,
  values,
  context,
}: {
  field: FormField;
  value: FormFieldValue;
  onChange: (value: FormFieldValue) => void;
  inputId: string;
  values: Record<string, FormFieldValue>;
  context: FieldRenderContext;
}) {
  const definition = fieldRegistry.get(field.type);
  if (!definition) {
    return null;
  }

  return definition.renderer({
    value,
    onChange,
    field,
    formValues: values,
    inputId,
    context,
  });
}

// ─── EntityForm ───────────────────────────────────────────────────────────────

function EntityFormFields<T extends Record<string, FormFieldValue>>({
  fields,
  values,
  errors,
  set,
  fieldContext,
  surface = 'page',
}: {
  fields: FormField[];
  values: T;
  errors?: Partial<Record<keyof T & string, string>>;
  set: (name: string, value: FormFieldValue) => void;
  fieldContext: FieldRenderContext;
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
          {hideSectionHeading ? null : <h3 className={FIELD_GROUP_LABEL_CLASS}>{section}</h3>}
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
                        values={values}
                        context={fieldContext}
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
                        values={values}
                        context={fieldContext}
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
                    values={values}
                    context={fieldContext}
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
  onDirtyChange,
  skipClientValidation = false,
  autoSave = false,
}: EntityFormProps<T>) {
  usePreloadNamespaces(['forms']);
  const allowNavigationRef = useRef(false);
  const [submissionErrors, setSubmissionErrors] = useState<
    Partial<Record<keyof T & string, string>>
  >({});
  const [submissionMessage, setSubmissionMessage] = useState<string | undefined>();
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );
  const permittedFields = useMemo(
    () => filterPermittedFormFields(fields, permissionSubject),
    [fields, permissionSubject],
  );
  const schema = useMemo(() => buildFormZodSchema(permittedFields), [permittedFields]);
  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    trigger,
    formState: { errors: formErrors, isDirty },
  } = useForm<T>({
    defaultValues: defaultValues as DefaultValues<T>,
    resolver: zodResolver(schema) as Resolver<T>,
    mode: 'onBlur',
  });

  useEffect(() => {
    reset(defaultValues);
    setSubmissionErrors({});
    setSubmissionMessage(undefined);
    allowNavigationRef.current = false;
  }, [defaultValues, reset]);

  const values = watch();
  const valuesRef = useRef(values);
  const { locale } = useUserPreferences();
  const defaultCountryOptions = useCountryOptions();
  const defaultPhoneCountries = usePhoneCountries();
  const defaultCurrencyOptions = useCurrencyOptions();
  const vocabularyOptions = useVocabularyOptionsMap();
  const fieldContext = useMemo<FieldRenderContext>(
    () => ({
      locale,
      defaultCountryOptions,
      defaultPhoneCountries,
      defaultCurrencyOptions,
      vocabularyOptions,
    }),
    [
      defaultCountryOptions,
      defaultCurrencyOptions,
      defaultPhoneCountries,
      locale,
      vocabularyOptions,
    ],
  );

  useFormDirtyGuard({ enabled: warnOnDirty, isDirty });
  useFormLeaveBlocker({
    enabled: warnOnDirty && !isSubmitting,
    isDirty,
    allowNavigationRef,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const rhfErrorMap = useMemo(() => {
    const next: Partial<Record<keyof T & string, string>> = {};
    for (const [key, error] of Object.entries(formErrors)) {
      if (error?.message) {
        next[key as keyof T & string] = String(error.message);
      }
    }
    return next;
  }, [formErrors]);

  const mergedErrors = { ...rhfErrorMap, ...submissionErrors, ...errors };

  const set = (name: string, value: FormFieldValue) => {
    setValue(name as Path<T>, value as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const resolvedSubmitVariant = submitVariant ?? (surface === 'dialog' ? 'cta' : 'default');
  const resolvedShowHeader = showHeader === true && surface === 'dialog';
  const autoSaveOptions = typeof autoSave === 'object' ? autoSave : undefined;
  const autoSaveEnabled =
    Boolean(autoSave) && (typeof autoSave !== 'object' || autoSave.enabled !== false);
  const autoSaveDelayMs = Math.max(0, autoSaveOptions?.delayMs ?? 1000);
  const autoSaveHandler = autoSaveOptions?.onSave ?? onSubmit;
  const autoSaveValuesKey = useMemo(() => serializeAutosaveValues(values), [values]);

  const submitValues = useCallback(
    async (
      submitted: T,
      handler: (values: T) => FormSubmissionResult | Promise<FormSubmissionResult>,
    ) => {
      setSubmissionErrors({});
      setSubmissionMessage(undefined);

      try {
        const result = await handler(submitted);
        const failure = normalizeFormSubmissionFailure(result);
        if (failure) {
          setSubmissionErrors(failure.errors as Partial<Record<keyof T & string, string>>);
          setSubmissionMessage(failure.message);
          return;
        }
      } catch (error) {
        const failure = normalizeFormSubmissionFailure(error);
        if (!failure) throw error;

        setSubmissionErrors(failure.errors as Partial<Record<keyof T & string, string>>);
        setSubmissionMessage(failure.message);
        return;
      }

      allowNavigationRef.current = true;
      reset(submitted as DefaultValues<T>);
    },
    [reset],
  );

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || isSubmitting) return undefined;

    const timer = window.setTimeout(() => {
      const saveCurrentValues = async () => {
        if (!skipClientValidation) {
          const isValid = await trigger(undefined, { shouldFocus: false });
          if (!isValid) return;
        }

        await submitValues(valuesRef.current as T, autoSaveHandler);
      };

      void saveCurrentValues().catch(() => undefined);
    }, autoSaveDelayMs);

    return () => window.clearTimeout(timer);
  }, [
    autoSaveDelayMs,
    autoSaveEnabled,
    autoSaveHandler,
    autoSaveValuesKey,
    isDirty,
    isSubmitting,
    skipClientValidation,
    submitValues,
    trigger,
  ]);

  const form = (
    <form
      className="space-y-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (skipClientValidation) {
          void submitValues(values, onSubmit).catch(() => undefined);
          return;
        }
        void handleSubmit((submitted) => submitValues(submitted, onSubmit))(event).catch(
          () => undefined,
        );
      }}
    >
      {resolvedShowHeader ? (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      <EntityFormFields
        fields={permittedFields}
        values={values}
        errors={mergedErrors}
        set={set}
        fieldContext={fieldContext}
        surface={surface}
      />
      {renderAfterFields ? renderAfterFields({ values, set, errors: mergedErrors }) : null}
      {submissionMessage ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {submissionMessage}
        </p>
      ) : null}
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
