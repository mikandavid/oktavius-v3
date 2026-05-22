import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FileInput,
  SectionCard,
  StepperLayout,
} from '@oktavius/base-ui';

import { DialogFormFooter } from '@/components/common/DialogFormFooter';
import { UploadIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

const STEPS = [
  { key: 'file', label: 'Upload', description: 'Choose CSV or XLSX' },
  { key: 'map', label: 'Map columns', description: 'Match fields' },
  { key: 'review', label: 'Review', description: 'Preview rows' },
] as const;

type BulkImportWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel?: string;
};

export function BulkImportWizard({
  open,
  onOpenChange,
  entityLabel = 'records',
}: BulkImportWizardProps) {
  const [step, setStep] = useState(0);

  const reset = () => {
    setStep(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : reset())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import {entityLabel}</DialogTitle>
          <DialogDescription>
            Multi-step import wizard — upload, map columns, review, then import. UI-only demo.
          </DialogDescription>
        </DialogHeader>

        <StepperLayout
          steps={[...STEPS]}
          currentStep={step}
          footer={
            step < STEPS.length - 1 ? (
              <DialogFormFooter
                confirmLabel="Next"
                onConfirm={() => setStep((current) => current + 1)}
                onCancel={reset}
                leading={
                  step > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep((current) => current - 1)}
                    >
                      Back
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DialogFormFooter
                confirmLabel="Import"
                onConfirm={() => {
                  toast.success(`Imported sample ${entityLabel}.`);
                  reset();
                }}
                onCancel={reset}
                leading={
                  <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
                    Back
                  </Button>
                }
              />
            )
          }
        >
          {step === 0 ? (
            <SectionCard title="Upload file">
              <FileInput accept=".csv,.xlsx" />
              <p className="mt-2 text-xs text-muted-foreground">
                Drag a file or browse. Max 5 MB for demo imports.
              </p>
            </SectionCard>
          ) : null}
          {step === 1 ? (
            <SectionCard title="Column mapping">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Name → client_name</p>
                <p>Email → contact_email</p>
                <p>Status → lifecycle_status</p>
              </div>
            </SectionCard>
          ) : null}
          {step === 2 ? (
            <SectionCard title="Preview" meta="3 rows">
              <div className="rounded-control border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">Apex Technologies GmbH</p>
                <p className="text-xs text-muted-foreground">billing@apex.at · Active</p>
              </div>
              <div className="mt-2 rounded-control border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">West Region Branch</p>
                <p className="text-xs text-muted-foreground">ops@west.example · Trial</p>
              </div>
            </SectionCard>
          ) : null}
        </StepperLayout>
      </DialogContent>
    </Dialog>
  );
}

export function BulkImportTrigger({
  entityLabel = 'records',
  className,
}: {
  entityLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        <UploadIcon size={14} className="mr-1.5" />
        Import
      </Button>
      <BulkImportWizard open={open} onOpenChange={setOpen} entityLabel={entityLabel} />
    </>
  );
}
