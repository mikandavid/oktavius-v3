import { z } from 'zod';

import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { validateFormFields } from '@/lib/formValidation';

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
  });
}
