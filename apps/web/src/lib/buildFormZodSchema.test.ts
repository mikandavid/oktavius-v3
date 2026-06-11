import { describe, expect, it } from 'vitest';

import type { FormField } from '@/components/forms/EntityForm';

import { buildFormZodSchema } from './buildFormZodSchema';

describe('buildFormZodSchema', () => {
  it('skips required validation for fields hidden by visibleIf', () => {
    const schema = buildFormZodSchema([
      {
        name: 'secret',
        label: 'Secret',
        type: 'text',
        required: true,
        visibleIf: () => false,
      },
    ]);

    expect(schema.safeParse({ secret: '' }).success).toBe(true);
  });

  it('applies cross-field validation errors to the configured field', () => {
    const fields: FormField[] = [
      { name: 'start', label: 'Start', type: 'date', required: true },
      {
        name: 'end',
        label: 'End',
        type: 'date',
        required: true,
        crossValidate: (values) =>
          String(values.end) < String(values.start) ? 'End must be after start.' : null,
      },
    ];

    const result = buildFormZodSchema(fields).safeParse({
      start: '2026-06-09',
      end: '2026-06-08',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['end']);
    expect(result.error?.issues[0]?.message).toBe('End must be after start.');
  });

  it('applies repeating field min and max item validation from the registry', () => {
    const schema = buildFormZodSchema([
      {
        name: 'lines',
        label: 'Lines',
        type: 'repeating',
        itemFields: [{ name: 'description', label: 'Description', type: 'text' }],
        minItems: 1,
        maxItems: 2,
      },
    ]);

    expect(schema.safeParse({ lines: [] }).success).toBe(false);
    expect(schema.safeParse({ lines: [{ description: 'A' }] }).success).toBe(true);
    expect(
      schema.safeParse({
        lines: [{ description: 'A' }, { description: 'B' }, { description: 'C' }],
      }).success,
    ).toBe(false);
  });
});
