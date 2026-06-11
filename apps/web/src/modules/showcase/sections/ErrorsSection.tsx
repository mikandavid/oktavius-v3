import { useState } from 'react';

import { Button } from '@oktavius/base-ui';

import { ModuleErrorBoundary } from '@/core/errors/ModuleErrorBoundary';
import { SectionErrorBoundary } from '@/core/errors/SectionErrorBoundary';

import { ShowcaseBlock } from '../shared';

function CrashPanel({ shouldThrow, label }: { shouldThrow: boolean; label: string }) {
  if (shouldThrow) {
    throw new Error(`${label} demo crash`);
  }

  return (
    <div className="rounded-card bg-muted/60 p-4 text-sm text-muted-foreground">
      {label} is rendering normally.
    </div>
  );
}

export function ErrorsSection() {
  const [moduleCrash, setModuleCrash] = useState(false);
  const [sectionCrash, setSectionCrash] = useState(false);

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="Module error boundary"
        meta="Full module fallback with retry and capture hook"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setModuleCrash(true)}>
              Trigger crash
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setModuleCrash(false)}>
              Reset
            </Button>
          </div>
        }
      >
        <ModuleErrorBoundary moduleId="showcase-errors">
          <CrashPanel shouldThrow={moduleCrash} label="Module content" />
        </ModuleErrorBoundary>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Section error boundary"
        meta="Inline fallback for nested panels"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setSectionCrash(true)}>
              Trigger crash
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSectionCrash(false)}>
              Reset
            </Button>
          </div>
        }
      >
        <SectionErrorBoundary sectionId="showcase-errors-panel">
          <CrashPanel shouldThrow={sectionCrash} label="Section content" />
        </SectionErrorBoundary>
      </ShowcaseBlock>
    </div>
  );
}
