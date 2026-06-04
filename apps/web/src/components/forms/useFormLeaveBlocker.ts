import { useEffect, type RefObject } from 'react';
import { useBlocker } from 'react-router-dom';

import type { FormFieldValue } from '@/components/forms/EntityForm';
import { valuesAreDirty } from '@/lib/formValidation';

type UseFormLeaveBlockerOptions<T extends Record<string, FormFieldValue>> = {
  values?: T;
  initialValues?: T;
  isDirty?: boolean;
  enabled?: boolean;
  message?: string;
  /** Set to true synchronously before post-submit navigation so the blocker does not fire. */
  allowNavigationRef?: RefObject<boolean>;
};

/** Blocks in-app navigation when a form has unsaved changes (complements beforeunload guard). */
export function useFormLeaveBlocker<T extends Record<string, FormFieldValue>>({
  values,
  initialValues,
  isDirty: isDirtyProp,
  enabled = true,
  message = 'You have unsaved changes. Leave this page anyway?',
  allowNavigationRef,
}: UseFormLeaveBlockerOptions<T>) {
  const isDirty =
    isDirtyProp ??
    (values != null && initialValues != null ? valuesAreDirty(values, initialValues) : false);

  const blocker = useBlocker(() => {
    if (!enabled) return false;
    if (allowNavigationRef?.current) return false;
    return Boolean(isDirty);
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const shouldLeave = window.confirm(message);
    if (shouldLeave) {
      blocker.proceed();
      return;
    }
    blocker.reset();
  }, [blocker, message]);

  return { isDirty: enabled && isDirty, blockerState: blocker.state };
}
