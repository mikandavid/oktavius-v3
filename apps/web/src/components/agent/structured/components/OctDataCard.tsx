import { Badge, DetailFieldGrid, SectionCard } from '@oktavius/base-ui';

import type { OctComponentProps } from '../registry';

type DataField = {
  label: string;
  value: unknown;
  type?: string;
};

function safeParse(body: string): { fields: DataField[]; error?: string } {
  const trimmed = body.trim();
  if (!trimmed) return { fields: [] };
  try {
    const parsed = JSON.parse(trimmed) as { fields?: unknown };
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.fields)) {
      return { fields: [], error: 'Body must be { "fields": [ ... ] }' };
    }
    const fields = parsed.fields
      .filter(
        (field): field is Record<string, unknown> =>
          !!field &&
          typeof field === 'object' &&
          typeof (field as { label?: unknown }).label === 'string',
      )
      .map((field) => ({
        label: field.label as string,
        value: field.value,
        type: typeof field.type === 'string' ? field.type : undefined,
      }));
    return { fields };
  } catch {
    return { fields: [], error: 'Could not parse JSON body' };
  }
}

function formatFieldValue(field: DataField): string {
  const { value, type } = field;
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'boolean') {
    return value === true || value === 'true' || value === 1 ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ');
  return String(value);
}

export default function OctDataCard({ attrs, body }: OctComponentProps) {
  const { fields, error } = safeParse(body);

  return (
    <SectionCard title={attrs.title} meta={attrs.subtitle}>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {fields.length === 0 && !error ? (
        <p className="text-xs text-muted-foreground">No data.</p>
      ) : (
        <DetailFieldGrid
          fields={fields.map((field) => ({
            label: field.label,
            value:
              field.type === 'badge' ? (
                <Badge variant="secondary">{formatFieldValue(field)}</Badge>
              ) : (
                formatFieldValue(field)
              ),
          }))}
        />
      )}
    </SectionCard>
  );
}
