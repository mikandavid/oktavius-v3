import { useState } from 'react';

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@oktavius/base-ui';

import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { toast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const ALL_FIELD_TYPES: FormField[] = [
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
};

export function FormsSection() {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="EntityForm — all field types"
        meta="Full-page surface · submit uses variant=default"
        actions={
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
        }
      >
        <EntityForm<DemoFormValues>
          title="Create record"
          subtitle="Every supported EntityForm field type in one scrollable form"
          fields={ALL_FIELD_TYPES}
          defaultValues={FORM_DEFAULTS}
          errors={errors}
          submitLabel="Save record"
          onSubmit={(values) => {
            setErrors({});
            setSubmitted(values.name);
            toast.success('Form submitted.');
          }}
        />
        {submitted ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Last submit: <strong className="font-medium text-foreground">{submitted}</strong>
          </p>
        ) : null}
      </ShowcaseBlock>

      <ShowcaseBlock title="Dialog surface" meta="EntityForm surface=dialog → purple CTA submit">
        <Tabs defaultValue="page">
          <TabsList>
            <TabsTrigger value="page">Page (default submit)</TabsTrigger>
            <TabsTrigger value="dialog">Dialog (cta submit)</TabsTrigger>
          </TabsList>
          <TabsContent value="page" className="pt-3 text-sm text-muted-foreground">
            Full-page routes use <code className="text-xs">variant=&quot;default&quot;</code> on
            submit. Open any module create page (e.g. /clients/new) to see the live pattern.
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
