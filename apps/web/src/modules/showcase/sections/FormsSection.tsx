import {
  Button,
  DatePicker,
  FormField as FormFieldControl,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { CustomFieldsFormSection } from '@/components/custom-fields';
import { EntityForm, type FormField as EntityFormField } from '@/components/forms/EntityForm';
import { JsonField } from '@/components/forms/JsonField';
import { PageFileDrop } from '@/components/forms/PageFileDrop';
import { RecipientCombobox } from '@/components/forms/RecipientCombobox';
import { type CustomFieldValues } from '@/lib/custom-fields';
import {
  buildCustomFieldDefaults,
  getCustomFieldDefinitions,
} from '@/lib/custom-fields/demoDefinitions';
import { type FieldDefinition, fieldRegistry } from '@/lib/fields';
import { withFieldErrors } from '@/lib/formValidation';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const customRatingDefinition: FieldDefinition = {
  id: 'customRating',
  renderer: ({ value, onChange, field }) => (
    <div className="flex flex-wrap gap-2" aria-label={field.label}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = Number(value ?? 0) >= rating;
        return (
          <Button
            key={rating}
            type="button"
            size="icon"
            variant={active ? 'default' : 'outline'}
            aria-label={`${rating} of 5`}
            onClick={() => onChange(rating)}
          >
            {rating}
          </Button>
        );
      })}
    </div>
  ),
};

if (!fieldRegistry.get(customRatingDefinition.id)) {
  fieldRegistry.register(customRatingDefinition);
}

const ALL_FIELD_TYPES: EntityFormField[] = [
  { name: 'name', label: 'Text', type: 'text', required: true, section: 'Text & contact' },
  { name: 'email', label: 'Email', type: 'email', section: 'Text & contact' },
  { name: 'phone', label: 'Phone', type: 'phone', section: 'Text & contact' },
  { name: 'website', label: 'Website', type: 'url', section: 'Text & contact' },
  { name: 'quantity', label: 'Number', type: 'number', section: 'Text & contact' },
  { name: 'notes', label: 'Textarea', type: 'textarea', colSpan: 2, section: 'Text & contact' },
  {
    name: 'plan',
    label: 'Combobox',
    type: 'combobox',
    options: ['Starter', 'Professional', 'Enterprise'],
    section: 'Choice',
  },
  {
    name: 'teams',
    label: 'Multiselect',
    type: 'multiselect',
    options: ['Sales', 'Support', 'Finance'],
    section: 'Choice',
  },
  { name: 'tags', label: 'Tags', type: 'tags', section: 'Choice' },
  { name: 'terms', label: 'Accept terms', type: 'checkbox', section: 'Boolean' },
  { name: 'notifications', label: 'Email notifications', type: 'switch', section: 'Boolean' },
  {
    name: 'billingCycle',
    label: 'Billing cycle',
    type: 'radio',
    options: ['Monthly', 'Annual'],
    section: 'Boolean',
  },
  { name: 'startDate', label: 'Start date', type: 'date', section: 'Dates & money' },
  { name: 'reminderTime', label: 'Reminder time', type: 'time', section: 'Dates & money' },
  { name: 'deadline', label: 'Deadline', type: 'datetime', section: 'Dates & money' },
  {
    name: 'budget',
    label: 'Budget',
    type: 'currency',
    currencySymbol: '€',
    section: 'Dates & money',
  },
  { name: 'country', label: 'Country', type: 'country', section: 'Reference' },
  {
    name: 'status',
    label: 'Client status',
    type: 'vocabulary',
    vocabulary: 'clientStatus',
    section: 'Reference',
  },
  {
    name: 'client',
    label: 'Related client',
    type: 'relation',
    options: ['Apex Technologies', 'Bruckner Consulting'],
    section: 'Reference',
  },
  { name: 'attachment', label: 'Attachment', type: 'file', section: 'Reference' },
  {
    name: 'metadataJson',
    label: 'Metadata JSON',
    type: 'json',
    colSpan: 2,
    section: 'Reference',
    placeholder: '{ "source": "import" }',
  },
];

type DemoFormValues = {
  name: string;
  email: string;
  phone: string;
  website: string;
  quantity: string;
  notes: string;
  plan: string;
  teams: string[];
  tags: string[];
  terms: boolean;
  notifications: boolean;
  billingCycle: string;
  startDate: string;
  reminderTime: string;
  deadline: string;
  budget: string;
  country: string;
  status: string;
  client: string;
  attachment: File | null;
  metadataJson: string;
};

const FORM_DEFAULTS: DemoFormValues = {
  name: 'Demo record',
  email: 'demo@oktavius.test',
  phone: '+43 1 234 5678',
  website: 'https://oktavius.test',
  quantity: '12',
  notes: '',
  plan: 'Professional',
  teams: ['Sales'],
  tags: ['demo'],
  terms: true,
  notifications: true,
  billingCycle: 'Monthly',
  startDate: '2024-12-01',
  reminderTime: '09:00',
  deadline: '2024-12-31T17:00',
  budget: '45000',
  country: 'AT',
  status: 'active',
  client: '',
  attachment: null,
  metadataJson: '{\n  "source": "showcase"\n}',
};

const CONDITIONAL_FIELDS: EntityFormField[] = [
  {
    name: 'recordType',
    label: 'Record type',
    type: 'combobox',
    options: ['Standard', 'Enterprise'],
    section: 'Conditional',
  },
  {
    name: 'enterpriseCode',
    label: 'Enterprise code',
    type: 'text',
    section: 'Conditional',
    visibleIf: (values) => values.recordType === 'Enterprise',
    validate: { required: true, message: 'Enterprise code is required for enterprise records.' },
  },
  {
    name: 'supportTier',
    label: 'Support tier',
    type: 'combobox',
    options: ['Bronze', 'Silver', 'Gold'],
    section: 'Conditional',
    visibleIf: (values) => values.recordType === 'Enterprise',
  },
];

type ConditionalFormValues = {
  recordType: string;
  enterpriseCode: string;
  supportTier: string;
};

const REGISTRY_FIELDS: EntityFormField[] = [
  {
    name: 'rating',
    label: 'Priority rating',
    type: 'customRating',
    section: 'Custom field',
  },
  {
    name: 'hasWindow',
    label: 'Set delivery window',
    type: 'switch',
    section: 'Visibility',
  },
  {
    name: 'start',
    label: 'Start',
    type: 'date',
    section: 'Visibility',
    visibleIf: (values) => values.hasWindow === true,
    dependsOn: ['hasWindow'],
  },
  {
    name: 'end',
    label: 'End',
    type: 'date',
    section: 'Visibility',
    visibleIf: (values) => values.hasWindow === true,
    dependsOn: ['hasWindow', 'start'],
    crossValidate: (values) =>
      values.hasWindow === true && String(values.end) < String(values.start)
        ? 'End must be after start.'
        : null,
  },
];

type RegistryFormValues = {
  rating: number;
  hasWindow: boolean;
  start: string;
  end: string;
};

type InvoiceLine = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceFormValues = {
  invoiceNumber: string;
  lines: InvoiceLine[];
};

const INVOICE_FIELDS: EntityFormField[] = [
  {
    name: 'invoiceNumber',
    label: 'Invoice number',
    type: 'text',
    section: 'Header',
    required: true,
  },
  {
    name: 'lines',
    label: 'Line items',
    type: 'repeating',
    section: 'Lines',
    colSpan: 2,
    minItems: 1,
    maxItems: 5,
    addLabel: 'Add line',
    reorderable: true,
    itemFields: [
      { name: 'description', label: 'Description', type: 'text', colSpan: 2, required: true },
      { name: 'quantity', label: 'Qty', type: 'number', required: true },
      { name: 'unitPrice', label: 'Unit price', type: 'currency', required: true },
    ],
    totals: (rows) => {
      const total = rows.reduce((sum, row) => {
        const quantity = Number(row.quantity ?? 0);
        const unitPrice = Number(row.unitPrice ?? 0);
        return sum + quantity * unitPrice;
      }, 0);
      return [{ label: 'Invoice total', value: `€${total.toFixed(2)}` }];
    },
  },
];

const INVOICE_DEFAULTS: InvoiceFormValues = {
  invoiceNumber: 'INV-2026-001',
  lines: [
    { description: 'Consulting day', quantity: '2', unitPrice: '950' },
    { description: 'Implementation package', quantity: '1', unitPrice: '2400' },
  ],
};

export function FormsSection() {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [simulateServerError, setSimulateServerError] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [eventDatetime, setEventDatetime] = useState('2024-12-05T10:00');
  const [recipients, setRecipients] = useState<string[]>(['maria.keller@apex.example']);
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  const customFieldDefinitions = useMemo(() => getCustomFieldDefinitions('client'), []);
  const [customFieldValues, setCustomFieldValues] = useState(() =>
    buildCustomFieldDefaults(customFieldDefinitions),
  );
  const [jsonPreview, setJsonPreview] = useState('{\n  "enabled": true\n}');

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="EntityForm — all field types"
        meta="Full-page surface · submit uses variant=default"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={simulateServerError ? 'default' : 'outline'}
              onClick={() => setSimulateServerError((current) => !current)}
            >
              Simulate server error
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setErrors({
                  email: 'Invalid email address',
                  name: 'Name is required',
                })
              }
            >
              Show validation errors
            </Button>
          </div>
        }
      >
        <EntityForm<DemoFormValues>
          title="Create record"
          subtitle="Every supported EntityForm field type in one scrollable form"
          fields={ALL_FIELD_TYPES}
          defaultValues={FORM_DEFAULTS}
          errors={errors}
          submitLabel="Save record"
          warnOnDirty
          onSubmit={withFieldErrors((values) => {
            setErrors({});
            if (simulateServerError) {
              throw {
                fieldErrors: {
                  email: 'A record with this email already exists.',
                  website: 'Website failed backend reachability validation.',
                },
                formError: 'Server rejected the record.',
              };
            }
            setSubmitted(values.name);
            appToast.success('Form submitted.');
          })}
        />
        {submitted ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Last submit: <strong className="font-medium text-foreground">{submitted}</strong>
          </p>
        ) : null}
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Conditional fields + client validation"
        meta="visibleIf · validate · warnOnDirty on submit"
      >
        <EntityForm<ConditionalFormValues>
          title="Conditional record"
          fields={CONDITIONAL_FIELDS}
          defaultValues={{ recordType: 'Standard', enterpriseCode: '', supportTier: '' }}
          submitLabel="Validate"
          warnOnDirty
          onSubmit={() => {
            appToast.success('Conditional form passed validation.');
          }}
        />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Field registry extension"
        meta="customRating · visibleIf · dependsOn · crossValidate"
      >
        <EntityForm<RegistryFormValues>
          title="Registry-driven workflow"
          fields={REGISTRY_FIELDS}
          defaultValues={{
            rating: 3,
            hasWindow: true,
            start: '2026-06-08',
            end: '2026-06-10',
          }}
          submitLabel="Save workflow"
          onSubmit={() => {
            appToast.success('Registry form submitted.');
          }}
        />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Repeating line items"
        meta="repeating field · add/remove/reorder · min/max · totals"
      >
        <EntityForm<InvoiceFormValues>
          title="Invoice draft"
          fields={INVOICE_FIELDS}
          defaultValues={INVOICE_DEFAULTS}
          submitLabel="Save invoice"
          onSubmit={() => {
            appToast.success('Invoice lines submitted.');
          }}
        />
      </ShowcaseBlock>

      <ShowcaseBlock
        title="CustomFieldsFormSection"
        meta="Schema-driven org fields · client entity"
      >
        <CustomFieldsFormSection
          entityType="client"
          values={customFieldValues}
          onChange={(fieldKey, value) =>
            setCustomFieldValues((current: CustomFieldValues) => ({
              ...current,
              [fieldKey]: value as CustomFieldValues[string],
            }))
          }
        />
      </ShowcaseBlock>

      <ShowcaseBlock title="JsonField" meta="Admin JSON editor · format + parse validation">
        <JsonField value={jsonPreview} onChange={setJsonPreview} />
      </ShowcaseBlock>

      <ShowcaseBlock title="Form helpers" meta="DatePicker · RecipientCombobox · PageFileDrop">
        <div className="grid gap-6 lg:grid-cols-2">
          <FormFieldControl id="form-event-datetime" label="Event date & time">
            <DatePicker
              id="form-event-datetime"
              mode="datetime"
              value={eventDatetime}
              onChange={(v) => setEventDatetime(v ?? '')}
            />
          </FormFieldControl>
          <RecipientCombobox
            value={recipients}
            onChange={setRecipients}
            options={[
              { value: 'maria.keller@apex.example', label: 'Maria Keller' },
              { value: 'jonas.weber@apex.example', label: 'Jonas Weber' },
              { value: 'ops@oktavius.test', label: 'Ops team' },
            ]}
          />
        </div>
        <div className="mt-4">
          <PageFileDrop
            onFiles={(files) => {
              setDroppedFiles(files.map((file) => file.name));
              appToast.success(`${files.length} file(s) dropped.`);
            }}
          />
          {droppedFiles.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Dropped: {droppedFiles.join(', ')}</p>
          ) : null}
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Dialog surface" meta="EntityForm surface=dialog → purple CTA submit">
        <Tabs defaultValue="page">
          <TabsList>
            <TabsTrigger value="page">Page (default submit)</TabsTrigger>
            <TabsTrigger value="dialog">Dialog (cta submit)</TabsTrigger>
          </TabsList>
          <TabsContent value="page" className="pt-3 text-sm text-muted-foreground">
            Full-page routes use <code className="text-xs">variant=&quot;default&quot;</code> on
            submit. Use generated module create pages to see the live pattern.
          </TabsContent>
          <TabsContent value="dialog" className="pt-3 text-sm text-muted-foreground">
            Dialogs use <code className="text-xs">surface=&quot;dialog&quot;</code> or{' '}
            <code className="text-xs">SubEntityFormDialog</code> — see Dialogs section for live
            demos.
          </TabsContent>
        </Tabs>
      </ShowcaseBlock>
    </div>
  );
}
