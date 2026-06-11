import { z } from 'zod';

import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { fieldRegistry } from '@/lib/fields';
import { isFieldVisible, validateFormFields } from '@/lib/formValidation';

/** Builds a Zod schema from declarative EntityForm field configs. */
export function buildFormZodSchema(fields: FormField[]) {
  return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
    const errors = validateFormFields(fields, values as Record<string, FormFieldValue>);
    for (const [fieldName, message] of Object.entries(errors)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [fieldName],
        message,
      });
    }

    for (const field of fields) {
      if (!isFieldVisible(field, values as Record<string, FormFieldValue>)) continue;
      const definition = fieldRegistry.get(field.type);
      const fieldSchema = definition?.zod?.(field);
      if (!fieldSchema) continue;

      const result = fieldSchema.safeParse(values[field.name]);
      if (!result.success) {
        const issue = result.error.issues[0];
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.name],
          message: issue?.message ?? `${field.label} is invalid.`,
        });
      }
    }
  });
}
