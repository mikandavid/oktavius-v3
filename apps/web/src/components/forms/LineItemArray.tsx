import { Button, cn, FormField as FormFieldControl } from '@oktavius/base-ui';

import { fieldRegistry, type FieldRenderContext } from '@/lib/fields';

import type { FormField, FormFieldValue } from './EntityForm';

export type LineItemRow = Record<string, FormFieldValue>;

type LineItemArrayProps = {
  id: string;
  value: LineItemRow[];
  itemFields: FormField[];
  onChange: (rows: LineItemRow[]) => void;
  context: FieldRenderContext;
  addLabel?: string;
  minItems?: number;
  maxItems?: number;
  reorderable?: boolean;
  totals?: (rows: LineItemRow[]) => { label: string; value: string }[];
  disabled?: boolean;
};

function defaultValueForField(field: FormField): FormFieldValue {
  if (field.type === 'checkbox' || field.type === 'switch') return false;
  if (field.type === 'multiselect' || field.type === 'tags') return [];
  if (field.type === 'repeating') return [];
  return '';
}

function createEmptyRow(fields: FormField[]): LineItemRow {
  return fields.reduce<LineItemRow>((row, field) => {
    row[field.name] = defaultValueForField(field);
    return row;
  }, {});
}

function moveRow(rows: LineItemRow[], index: number, offset: -1 | 1) {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= rows.length) return rows;
  const next = [...rows];
  const [row] = next.splice(index, 1);
  if (!row) return rows;
  next.splice(nextIndex, 0, row);
  return next;
}

export function LineItemArray({
  id,
  value,
  itemFields,
  onChange,
  context,
  addLabel = 'Add row',
  minItems = 0,
  maxItems,
  reorderable = false,
  totals,
  disabled = false,
}: LineItemArrayProps) {
  const rows = Array.isArray(value) ? value : [];
  const footerTotals = totals?.(rows) ?? [];
  const canAdd = !disabled && (maxItems == null || rows.length < maxItems);

  return (
    <div id={id} className="overflow-hidden rounded-md border border-border">
      <div className="divide-y divide-border">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid gap-3 p-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-3 md:grid-cols-2">
              {itemFields.map((field) => {
                const definition = fieldRegistry.get(field.type);
                if (!definition) return null;
                const inputId = `${id}-${rowIndex}-${field.name}`;

                return (
                  <FormFieldControl
                    key={field.name}
                    id={inputId}
                    label={field.label}
                    required={field.required}
                    className={cn(field.colSpan === 2 ? 'md:col-span-2' : undefined)}
                  >
                    {definition.renderer({
                      value: row[field.name],
                      onChange: (nextValue) => {
                        const next = rows.map((candidate, candidateIndex) =>
                          candidateIndex === rowIndex
                            ? { ...candidate, [field.name]: nextValue }
                            : candidate,
                        );
                        onChange(next);
                      },
                      field,
                      formValues: row,
                      inputId,
                      context,
                    })}
                  </FormFieldControl>
                );
              })}
            </div>
            <div className="flex items-start justify-end gap-2">
              {reorderable ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || rowIndex === 0}
                    onClick={() => onChange(moveRow(rows, rowIndex, -1))}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || rowIndex === rows.length - 1}
                    onClick={() => onChange(moveRow(rows, rowIndex, 1))}
                  >
                    Down
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || rows.length <= minItems}
                onClick={() =>
                  onChange(rows.filter((_, candidateIndex) => candidateIndex !== rowIndex))
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No rows added.</p>
        ) : null}
      </div>
      {footerTotals.length > 0 ? (
        <dl className="grid gap-2 border-t border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
          {footerTotals.map((total) => (
            <div key={total.label} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{total.label}</dt>
              <dd className="font-medium text-foreground">{total.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="border-t border-border p-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canAdd}
          onClick={() => onChange([...rows, createEmptyRow(itemFields)])}
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
