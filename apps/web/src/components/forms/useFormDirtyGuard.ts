import { useEffect } from 'react';

import type { FormFieldValue } from '@/components/forms/EntityForm';
import { valuesAreDirty } from '@/lib/formValidation';

type UseFormDirtyGuardOptions<T extends Record<string, FormFieldValue>> = {
  values?: T;
  initialValues?: T;
  isDirty?: boolean;
  enabled?: boolean;
  message?: string;
};

export function useFormDirtyGuard<T extends Record<string, FormFieldValue>>({
  values,
  initialValues,
  isDirty: isDirtyProp,
  enabled = true,
  message = 'You have unsaved changes. Leave this page anyway?',
}: UseFormDirtyGuardOptions<T>) {
  const isDirty =
    enabled &&
    (isDirtyProp ??
      (values != null && initialValues != null ? valuesAreDirty(values, initialValues) : false));

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, message]);

  return { isDirty };
}
