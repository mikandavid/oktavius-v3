import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { RefreshIcon, WarningIcon } from '@/lib/icons';

import { triggerChunkLoadAutoReload } from './chunkLoadRecovery';
import { captureException } from './sentry';

type ModuleErrorBoundaryProps = {
  moduleId: string;
  children: ReactNode;
};

type ModuleErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

function ModuleErrorFallback({
  moduleId,
  error,
  onRetry,
}: {
  moduleId: string;
  error: Error | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <WarningIcon size={48} className="mx-auto mb-4 text-destructive" weight="duotone" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {t('errors.moduleCrashTitle')}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('errors.moduleCrashBody', { moduleId })}
        </p>
        {error ? (
          <p className="mb-4 rounded-control bg-muted p-2 font-mono text-xs text-muted-foreground">
            {error.message}
          </p>
        ) : null}
        <Button type="button" onClick={onRetry}>
          <RefreshIcon size={16} aria-hidden="true" />
          {t('errors.moduleCrashRetry')}
        </Button>
      </div>
    </div>
  );
}

export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    if (triggerChunkLoadAutoReload(error)) {
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, {
      extra: { moduleId: this.props.moduleId, componentStack: errorInfo.componentStack },
      tags: { boundary: 'module' },
    });
    console.error(
      `[ModuleErrorBoundary] Error in module "${this.props.moduleId}":`,
      error,
      errorInfo,
    );
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ModuleErrorFallback
          moduleId={this.props.moduleId}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
