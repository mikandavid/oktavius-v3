import { useNavigate } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';
import { useDemoData } from '@/app/demo-data';
import { toast } from '@/lib/toast';

import { userFormDefaults, userFormFields, usersPageIcon, type UserFormValues } from './shared';

export function UserCreatePage() {
  const navigate = useNavigate();
  const { createUser } = useDemoData();

  const handleSubmit = async (values: UserFormValues) => {
    const created = createUser(values);
    toast.success('User created.');
    navigate(`/users/${created.id}`);
  };

  return (
    <ModulePage title="New user" icon={usersPageIcon()} backTo="/users">
      <EntityForm
        title="User details"
        fields={userFormFields}
        defaultValues={userFormDefaults}
        submitLabel="Create user"
        onSubmit={handleSubmit}
      />
    </ModulePage>
  );
}
