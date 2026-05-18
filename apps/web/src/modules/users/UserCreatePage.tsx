import { CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoData } from '@/app/demo-data';
import { InfoBox } from '@/components/common/InfoBox';
import { ModulePage } from '@/components/common/PageLayout';
import { EntityForm } from '@/components/forms/EntityForm';

import { userFormFields } from './shared';

type CreateUserFormValues = {
  name: string;
  email: string;
  team: string;
  role: string;
  status: string;
  notes: string;
};

const defaultValues: CreateUserFormValues = {
  name: '',
  email: '',
  team: '',
  role: 'Member',
  status: 'Pending',
  notes: '',
};

export function UserCreatePage() {
  const navigate = useNavigate();
  const { createUser } = useDemoData();
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  return (
    <ModulePage
      title="Create User"
      subtitle="Forms in extracted modules should compose the shared entity form."
      backTo="/users"
    >
      {createdMessage ? (
        <InfoBox
          tone="success"
          icon={<CheckCircle size={18} weight="fill" />}
          title="User created"
        >
          {createdMessage}
        </InfoBox>
      ) : null}

      <EntityForm<CreateUserFormValues>
        title="User details"
        subtitle="The extracted frontend base should support sectioned forms with consistent grouping and helper text."
        fields={userFormFields}
        defaultValues={defaultValues}
        submitLabel="Create user"
        onSubmit={(values) => {
          const next = createUser({
            name: values.name,
            email: values.email,
            team: values.team,
            role: values.role as 'Admin' | 'Manager' | 'Member',
            status: values.status as 'Active' | 'Pending' | 'Suspended',
          });
          setCreatedMessage(`${next.name} was added to the extracted frontend sample module.`);
          navigate(`/users/${next.id}`);
        }}
      />
    </ModulePage>
  );
}
