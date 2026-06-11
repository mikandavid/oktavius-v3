import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { RefreshIcon, WarningIcon } from '@/lib/icons';

import { triggerChunkLoadAutoReload } from './chunkLoadRecovery';
import { captureException } from './sentry';

type SectionErrorBoundaryProps = {
  sectionId: string;
  children: ReactNode;
};

type SectionErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

function SectionErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-card bg-muted/60 p-4 text-sm text-muted-foreground">
      <div className="flex items-start gap-3">
        <WarningIcon size={20} className="mt-0.5 shrink-0 text-destructive" weight="duotone" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{t('errors.sectionCrashBody')}</p>
          {error ? <p className="mt-1 font-mono text-xs">{error.message}</p> : null}
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onRetry}>
            <RefreshIcon size={14} aria-hidden="true" />
            {t('errors.moduleCrashRetry')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    if (triggerChunkLoadAutoReload(error)) {
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, {
      extra: { sectionId: this.props.sectionId, componentStack: errorInfo.componentStack },
      tags: { boundary: 'section' },
    });
    console.error(
      `[SectionErrorBoundary] Error in section "${this.props.sectionId}":`,
      error,
      errorInfo,
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <SectionErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
