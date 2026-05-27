import { useState } from 'react';

import { Button, RichTextEditor, Stepper, StepperLayout } from '@oktavius/base-ui';

import { DialogFormFooter } from '@/components/common/DialogFormFooter';
import { TreeList, type TreeNode } from '@/components/data/TreeList';
import { GoogleMapsPreview, GoogleMapsPreviewButton } from '@/components/maps/GoogleMapsDialog';
import {
  CatalogOptionsManager,
  type CatalogOption,
} from '@/components/settings/CatalogOptionsManager';
import { UploadIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

const DEMO_ROUTE_URL = 'https://www.google.com/maps/dir/Vienna/Salzburg';
const DEMO_PLACE_URL = 'https://www.google.com/maps/search/?api=1&query=Stephansplatz+Vienna';

const TREE_NODES: TreeNode[] = [
  {
    id: 'root',
    label: 'Documents',
    children: [
      {
        id: 'contracts',
        label: 'Contracts',
        children: [
          { id: 'msa', label: 'Master agreements' },
          { id: 'sow', label: 'Statements of work' },
        ],
      },
      { id: 'invoices', label: 'Invoices' },
    ],
  },
  {
    id: 'templates',
    label: 'Templates',
    children: [{ id: 'email', label: 'Email templates' }],
  },
];

const STEPPER_STEPS = [
  { key: 'upload', label: 'Upload', description: 'Choose file' },
  { key: 'map', label: 'Map', description: 'Match columns' },
  { key: 'review', label: 'Review', description: 'Confirm rows' },
];

export function PatternsSection() {
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState('<p>Internal <strong>notes</strong> with rich text.</p>');
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([
    { id: 'c1', label: 'Net 30', code: 'NET30', active: true, sortOrder: 0 },
    { id: 'c2', label: 'Net 14', code: 'NET14', active: true, sortOrder: 1 },
    { id: 'c3', label: 'Due on receipt', code: 'DUE', active: false, sortOrder: 2 },
  ]);

  const handleSaveCatalog = (option: CatalogOption) => {
    setCatalogOptions((current) => {
      const exists = current.some((entry) => entry.id === option.id);
      return exists
        ? current.map((entry) => (entry.id === option.id ? option : entry))
        : [...current, option];
    });
    toast.success('Catalog option saved.');
  };

  const handleDeleteCatalog = (id: string) => {
    setCatalogOptions((current) => current.filter((entry) => entry.id !== id));
    toast.success('Catalog option deleted.');
  };

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="StepperLayout" meta="Multi-step wizard shell">
        <StepperLayout
          steps={STEPPER_STEPS}
          currentStep={step}
          footer={
            step < STEPPER_STEPS.length - 1 ? (
              <DialogFormFooter
                confirmLabel="Next"
                onConfirm={() => setStep((s) => s + 1)}
                onCancel={() => setStep(0)}
                leading={
                  step > 0 ? (
                    <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                      Back
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <DialogFormFooter
                confirmLabel="Finish"
                onConfirm={() => {
                  toast.success('Wizard complete.');
                  setStep(0);
                }}
                onCancel={() => setStep(0)}
              />
            )
          }
        >
          <div className="rounded-control bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {step === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <UploadIcon size={24} className="text-muted-foreground" />
                <span>Step 1 — Upload CSV or XLSX</span>
              </div>
            ) : step === 1 ? (
              'Step 2 — Map columns to entity fields'
            ) : (
              'Step 3 — Review 42 rows before import'
            )}
          </div>
        </StepperLayout>
        <div className="mt-4">
          <Stepper steps={STEPPER_STEPS} currentStep={step} />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="TreeList" meta="Folder tree · CollapsibleSection branches">
        <TreeList nodes={TREE_NODES} defaultExpandedIds={['root', 'contracts']} />
      </ShowcaseBlock>

      <ShowcaseBlock title="GoogleMapsPreview" meta="Inline map · no dialog required">
        <div className="space-y-4">
          <GoogleMapsPreview url={DEMO_ROUTE_URL} title="Vienna → Salzburg" height={280} />
          <GoogleMapsPreview
            url={DEMO_PLACE_URL}
            title="Stephansplatz, Vienna"
            height={240}
            showHeader={false}
          />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="GoogleMapsDialog" meta="Route preview · dialog expand">
        <GoogleMapsPreviewButton url={DEMO_ROUTE_URL} label="Open route dialog" />
      </ShowcaseBlock>

      <ShowcaseBlock title="RichTextEditor" meta="Internal notes in detail tabs">
        <RichTextEditor value={notes} onChange={setNotes} placeholder="Write internal notes…" />
      </ShowcaseBlock>

      <ShowcaseBlock title="CatalogOptionsManager" meta="Settings catalog CRUD pattern">
        <CatalogOptionsManager
          title="Payment terms"
          description="Used on invoices and orders."
          options={catalogOptions}
          onSave={handleSaveCatalog}
          onDelete={handleDeleteCatalog}
        />
      </ShowcaseBlock>
    </div>
  );
}
