import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApiRegistry } from '@/api/ApiProvider';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { submitApiForm } from '@/lib/apiFormSubmit';
import { appToast } from '@/lib/toast';

import { userFormDefaults, userFormFields, usersPageIcon, type UserFormValues } from './shared';

export function UserCreatePage() {
  const navigate = useNavigate();
  const api = useApiRegistry();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      return await submitApiForm({
        action: () => api.users.create(values),
        onSuccess: (created) => {
          appToast.success('User created.');
          navigate(`/users/${created.id}`);
        },
        onError: (error) => appToast.fromApiError(error, 'User could not be created.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModulePage title="New user" icon={usersPageIcon()} backTo="/users">
      <EntityForm
        title="User details"
        fields={userFormFields}
        defaultValues={userFormDefaults}
        submitLabel="Create user"
        isSubmitting={isSubmitting}
        warnOnDirty
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
