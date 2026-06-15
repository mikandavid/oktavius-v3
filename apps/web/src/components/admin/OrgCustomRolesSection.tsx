import { Badge, Button, SettingsRow, SettingsSection } from '@oktavius/base-ui';

import { PlusIcon } from '@/lib/icons';

import { RoleSelector } from './RoleSelector';

export type OrgCustomRole = {
  id: string;
  name: string;
  description?: string;
};

type OrgCustomRolesSectionProps = {
  roles: OrgCustomRole[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string | null) => void;
  onCreateRole?: () => void;
};

export function OrgCustomRolesSection({
  roles,
  selectedRoleId,
  onSelectRole,
  onCreateRole,
}: OrgCustomRolesSectionProps) {
  return (
    <SettingsSection title="Custom roles">
      <SettingsRow label="Active role">
        <RoleSelector
          value={selectedRoleId}
          onChange={onSelectRole}
          options={roles.map((role) => ({ value: role.id, label: role.name }))}
        />
      </SettingsRow>
      {roles.map((role) => (
        <SettingsRow key={role.id} label={role.name} description={role.description}>
          <Badge variant="secondary">{role.id}</Badge>
        </SettingsRow>
      ))}
      {onCreateRole ? (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onCreateRole}>
            <PlusIcon size={14} className="mr-1.5" />
            Add custom role
          </Button>
        </div>
      ) : null}
    </SettingsSection>
  );
}
