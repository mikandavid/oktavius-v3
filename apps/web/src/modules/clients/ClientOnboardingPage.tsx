import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, SectionCard, StepperLayout } from '@oktavius/base-ui';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { DialogFormFooter } from '@/components/common/DialogFormFooter';
import { EntityForm, type FormField } from '@/components/forms/EntityForm';
import { clientsPageIcon } from '@/lib/modulePageIcons';
import { useOrgNavPaths } from '@/lib/org-profiles/useOrgProfile';
import { appToast } from '@/lib/toast';

import { completeClientOnboarding } from './clientOnboarding';
import { clientFormDefaults, type ClientFormValues } from './shared';

const STEPS = [
  { key: 'profile', label: 'Profile', description: 'Company details' },
  { key: 'commercial', label: 'Commercial', description: 'Contract terms' },
  { key: 'review', label: 'Review', description: 'Confirm & create' },
] as const;

const profileFields: FormField[] = [
  { name: 'name', label: 'Company / name', type: 'text', required: true },
  { name: 'type', label: 'Type', type: 'vocabulary', vocabulary: 'clientType' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'phone' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'country', label: 'Country', type: 'country' },
];

const commercialFields: FormField[] = [
  { name: 'accountManager', label: 'Account manager', type: 'text' },
  { name: 'annualRevenue', label: 'Annual revenue', type: 'currency', currencySymbol: '€' },
  { name: 'contractStart', label: 'Contract start', type: 'date' },
  { name: 'contractEnd', label: 'Contract end', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
];

export function ClientOnboardingPage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const nav = useOrgNavPaths();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ClientFormValues>({ ...clientFormDefaults });

  const finish = () => {
    void completeClientOnboarding({
      draft,
      clientBasePath: nav.clients,
      createClient: api.clients.create,
      navigate,
      toast: appToast,
    });
  };

  return (
    <ModulePage
      title="Client onboarding"
      subtitle="Multi-step wizard — StepperLayout on a full-page route"
      icon={clientsPageIcon()}
      backTo={nav.clients}
    >
      <StepperLayout
        steps={[...STEPS]}
        currentStep={step}
        footer={
          step === 2 ? (
            <DialogFormFooter
              confirmLabel="Create client"
              onConfirm={finish}
              onCancel={() => setStep(1)}
              leading={
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
              }
            />
          ) : undefined
        }
      >
        {step === 0 ? (
          <EntityForm
            title="Company profile"
            fields={profileFields}
            defaultValues={draft}
            submitLabel="Continue"
            warnOnDirty
            footerActions={
              <Button type="button" variant="ghost" onClick={() => navigate(nav.clients)}>
                Cancel
              </Button>
            }
            onSubmit={(values) => {
              setDraft((current) => ({ ...current, ...values }));
              setStep(1);
            }}
          />
        ) : null}

        {step === 1 ? (
          <EntityForm
            title="Commercial terms"
            fields={commercialFields}
            defaultValues={draft}
            submitLabel="Continue"
            warnOnDirty
            footerActions={
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
            }
            onSubmit={(values) => {
              setDraft((current) => ({ ...current, ...values }));
              setStep(2);
            }}
          />
        ) : null}

        {step === 2 ? (
          <SectionCard title="Review" meta="Confirm before creating the client record">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Name</dt>
                <dd className="text-sm">{draft.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                <dd className="text-sm">{draft.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">City</dt>
                <dd className="text-sm">{draft.city || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Account manager</dt>
                <dd className="text-sm">{draft.accountManager || '—'}</dd>
              </div>
            </dl>
          </SectionCard>
        ) : null}
      </StepperLayout>
    </ModulePage>
  );
}
