import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, SectionCard, StepperLayout } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { toast } from '@/lib/toast';

import { casesPageIcon } from './shared';

const STEPS = [
  { key: 'intake', label: 'Intake', description: 'Case type & client' },
  { key: 'details', label: 'Details', description: 'Priority & summary' },
  { key: 'review', label: 'Review', description: 'Confirm & create' },
] as const;

const intakeFields: FormField[] = [
  {
    name: 'type',
    label: 'Case type',
    type: 'select',
    options: ['Support', 'Legal', 'Billing', 'Onboarding'],
    required: true,
    section: 'Classification',
  },
  { name: 'clientName', label: 'Client', type: 'text', required: true, section: 'Classification' },
  { name: 'title', label: 'Title', type: 'text', required: true, colSpan: 2, section: 'Classification' },
];

const detailFields: FormField[] = [
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    options: ['Low', 'Normal', 'High', 'Critical'],
    required: true,
    section: 'Handling',
  },
  { name: 'assignee', label: 'Owner', type: 'text', required: true, section: 'Handling' },
  { name: 'dueAt', label: 'Due date', type: 'date', required: true, section: 'Handling' },
  { name: 'summary', label: 'Summary', type: 'textarea', colSpan: 2, section: 'Description' },
];

type IntakeValues = { type: string; clientName: string; title: string };
type DetailValues = { priority: string; assignee: string; dueAt: string; summary: string };

export function CaseCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<IntakeValues>({ type: 'Support', clientName: '', title: '' });
  const [details, setDetails] = useState<DetailValues>({
    priority: 'Normal',
    assignee: 'Anna Hofer',
    dueAt: '',
    summary: '',
  });

  return (
    <ModulePage title="New case" subtitle="Multi-step intake wizard for complex case records." backTo="/cases" icon={casesPageIcon()}>
      <StepperLayout
        steps={[...STEPS]}
        currentStep={step}
        footer={
          step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )
        }
      >
        {step === 0 ? (
          <EntityForm<IntakeValues>
            title="Case intake"
            fields={intakeFields}
            defaultValues={intake}
            submitLabel="Continue"
            submitVariant="cta"
            onSubmit={(v) => {
              setIntake(v);
              setStep(1);
            }}
          />
        ) : null}
        {step === 1 ? (
          <EntityForm<DetailValues>
            title="Case details"
            fields={detailFields}
            defaultValues={details}
            submitLabel="Continue"
            submitVariant="cta"
            onSubmit={(v) => {
              setDetails(v);
              setStep(2);
            }}
          />
        ) : null}
        {step === 2 ? (
          <SectionCard
            title="Review"
            actions={
              <Button variant="cta" onClick={() => {
                toast.success('Case created (demo).');
                navigate('/cases');
              }}>
                Create case
              </Button>
            }
          >
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Type</dt>
                <dd className="mt-0.5 font-medium">{intake.type}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Client</dt>
                <dd className="mt-0.5 font-medium">{intake.clientName || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Title</dt>
                <dd className="mt-0.5 font-medium">{intake.title || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Priority</dt>
                <dd className="mt-0.5 font-medium">{details.priority}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Owner</dt>
                <dd className="mt-0.5 font-medium">{details.assignee}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Summary</dt>
                <dd className="mt-0.5 text-muted-foreground">{details.summary || '—'}</dd>
              </div>
            </dl>
          </SectionCard>
        ) : null}
      </StepperLayout>
    </ModulePage>
  );
}
