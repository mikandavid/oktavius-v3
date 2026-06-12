import { Button, type ButtonProps, buttonVariants, cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import type { PermissionRequirement } from '@/lib/permissions';
import { canUsePermissionRequirement, EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

type DetailActionVariant = Extract<ButtonProps['variant'], 'outline' | 'ghost' | 'cta'>;

export type DetailAction = {
  key: string;
  label: ReactNode;
  ariaLabel?: string;
  to?: string;
  onClick?: () => void | Promise<void>;
  icon?: ReactNode;
  variant?: DetailActionVariant;
  permission?: PermissionRequirement;
  hidden?: boolean | (() => boolean);
  disabled?: boolean;
};

type DetailActionsProps = {
  actions?: DetailAction[];
  className?: string;
};

function isActionHidden(action: DetailAction) {
  return typeof action.hidden === 'function' ? action.hidden() : Boolean(action.hidden);
}

export function usePermittedDetailActions(actions: DetailAction[] = []) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );

  return useMemo(
    () =>
      actions.filter(
        (action) =>
          !isActionHidden(action) &&
          canUsePermissionRequirement(permissionSubject, action.permission),
      ),
    [actions, permissionSubject],
  );
}

/** Permission-aware generated/custom detail actions for page and section headers. */
export function DetailActions({ actions = [], className }: DetailActionsProps) {
  const permittedActions = usePermittedDetailActions(actions);

  if (permittedActions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {permittedActions.map((action) => {
        const content = (
          <>
            {action.icon}
            {action.label}
          </>
        );
        const variant = action.variant ?? 'outline';

        if (action.to) {
          return (
            <Link
              key={action.key}
              to={action.to}
              aria-label={action.ariaLabel}
              className={cn(
                buttonVariants({ variant, size: 'sm' }),
                'inline-flex items-center justify-center gap-1.5',
                action.disabled && 'pointer-events-none opacity-50',
              )}
              aria-disabled={action.disabled || undefined}
            >
              {content}
            </Link>
          );
        }

        return (
          <Button
            key={action.key}
            type="button"
            variant={variant}
            size="sm"
            aria-label={action.ariaLabel}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}
