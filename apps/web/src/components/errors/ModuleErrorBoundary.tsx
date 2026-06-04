import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@oktavius/base-ui';

import { getChunkLoadRecoveryState, registerChunkLoadReload } from '@/lib/chunkLoadRecovery';
import { WarningIcon } from '@/lib/icons';

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
  return (
    <div className="flex h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <WarningIcon size={48} className="mx-auto mb-4 text-destructive" />
        <h2 className="mb-2 text-lg font-semibold text-foreground">Module failed to load</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Something went wrong in the <span className="font-medium">{moduleId}</span> module. The
          rest of the app is still available.
        </p>
        {error ? (
          <p className="mb-4 rounded-control bg-muted p-2 font-mono text-xs text-muted-foreground">
            {error.message}
          </p>
        ) : null}
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

/** Isolates module crashes so one broken route does not white-screen the shell. */
export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ModuleErrorBoundaryState {
    const recovery = getChunkLoadRecoveryState(error);
    if (recovery.shouldAutoReload && registerChunkLoadReload()) {
      window.location.reload();
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
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
