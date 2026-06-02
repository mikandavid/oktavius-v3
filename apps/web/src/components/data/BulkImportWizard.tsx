import { useEffect, useState } from 'react';

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
import { appToast } from '@/lib/toast';

import { completeBulkImport } from './bulkImportActions';
import { loadImportPreview, type ImportPreview } from './importPreview';

const STEPS = [
  { key: 'file', label: 'Upload', description: 'Choose CSV or XLSX' },
  { key: 'map', label: 'Map columns', description: 'Match fields' },
  { key: 'review', label: 'Review', description: 'Preview rows' },
] as const;

type BulkImportWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel?: string;
  onImport?: (file: File) => Promise<number | void>;
};

export function BulkImportWizard({
  open,
  onOpenChange,
  entityLabel = 'records',
  onImport = async () => undefined,
}: BulkImportWizardProps) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setFile(null);
    setIsImporting(false);
    setPreview(null);
    setIsPreviewLoading(false);
    setPreviewError(null);
    onOpenChange(false);
  };

  const finishImport = async () => {
    setIsImporting(true);
    const imported = await completeBulkImport({
      file,
      entityLabel,
      onImport,
      toast: appToast,
    });
    setIsImporting(false);
    if (imported) reset();
  };

  useEffect(() => {
    if (step !== 2 || !file) return;

    let cancelled = false;
    setIsPreviewLoading(true);
    setPreviewError(null);
    void loadImportPreview(file).then(
      (nextPreview) => {
        if (cancelled) return;
        setPreview(nextPreview);
        setIsPreviewLoading(false);
      },
      (error: unknown) => {
        if (cancelled) return;
        setPreview(null);
        setPreviewError(
          error instanceof Error ? error.message : 'Import preview could not be loaded.',
        );
        setIsPreviewLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [file, step]);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : reset())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import {entityLabel}</DialogTitle>
          <DialogDescription>
            Upload a CSV or spreadsheet file, review the mapped columns, then import.
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
                confirmDisabled={step === 0 && !file}
                onCancel={reset}
                leading={
                  step > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
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
                onConfirm={() => void finishImport()}
                confirmDisabled={!file || isImporting}
                confirmLoading={isImporting}
                onCancel={reset}
                leading={
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((current) => current - 1)}
                  >
                    Back
                  </Button>
                }
              />
            )
          }
        >
          {step === 0 ? (
            <SectionCard title="Upload file">
              <FileInput
                accept=".csv,.xlsx"
                value={file}
                onChange={(nextFile) => {
                  setFile(nextFile);
                  setPreview(null);
                  setPreviewError(null);
                }}
                maxSize={5 * 1024 * 1024}
              />
              <p className="mt-2 text-xs text-muted-foreground">Drag a file or browse. Max 5 MB.</p>
            </SectionCard>
          ) : null}
          {step === 1 ? (
            <SectionCard title="Column mapping">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Headers are normalized automatically before import.</p>
                <p>Examples: Client Name → client_name, Product SKU → product_sku.</p>
              </div>
            </SectionCard>
          ) : null}
          {step === 2 ? (
            <SectionCard title="Preview" meta={file?.name ?? 'No file selected'}>
              {isPreviewLoading ? (
                <div className="rounded-control border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                  Loading preview…
                </div>
              ) : previewError ? (
                <div className="rounded-control border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {previewError}
                </div>
              ) : preview && preview.totalRows > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-control border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <p className="font-medium text-foreground">
                      {preview.totalRows} {entityLabel} row{preview.totalRows === 1 ? '' : 's'}{' '}
                      detected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Import will validate each row against the {entityLabel} API before saving.
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-control border border-border/60">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          {preview.columns.map((column) => (
                            <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t border-border/50">
                            {preview.columns.map((column) => (
                              <td
                                key={column}
                                className="max-w-[14rem] truncate px-3 py-2 text-foreground"
                              >
                                {row[column] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-control border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">{file?.name ?? 'No file selected'}</p>
                  <p className="text-xs text-muted-foreground">
                    No importable rows were found in this file.
                  </p>
                </div>
              )}
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
  onImport,
}: {
  entityLabel?: string;
  className?: string;
  onImport?: (file: File) => Promise<number | void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
        <UploadIcon size={14} className="mr-1.5" />
        Import
      </Button>
      <BulkImportWizard
        open={open}
        onOpenChange={setOpen}
        entityLabel={entityLabel}
        onImport={onImport}
      />
    </>
  );
}
