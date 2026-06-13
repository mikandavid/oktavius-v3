// apps/web/src/modules/members/shared.tsx
import type { BadgeProps, ComboboxOption } from '@oktavius/base-ui';
import { formatDisplayDate } from '@oktavius/base-ui';

import { statusColumn } from '@/components/data/columns';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField } from '@/components/forms/EntityForm';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';
import type { OsirisInvitation, OsirisInviteLink } from '@/runtime/osiris/invitationsAdminClient';
import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';
import type { OsirisOrgRole } from '@/runtime/osiris/types';

/** Standard org role labels (owner is shown but never assignable through the UI). */
export const STANDARD_ROLE_OPTIONS: ComboboxOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export const ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  owner: 'success',
  admin: 'info',
  member: 'secondary',
  viewer: 'outline',
};

export const INVITE_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  pending: 'warning',
  accepted: 'success',
  expired: 'outline',
};

/** Build role options for the change-role dialog: standard roles + this org's custom roles. */
export function buildRoleOptions(customRoles: OsirisCustomRole[]): ComboboxOption[] {
  return [
    ...STANDARD_ROLE_OPTIONS,
    ...customRoles.map((role) => ({ value: `custom:${role.id}`, label: role.name })),
  ];
}

/** Map a member to the current role-selector value (`custom:<id>` when a custom role is set). */
export function memberRoleValue(member: OsirisOrgMember): string {
  return member.customRoleId ? `custom:${member.customRoleId}` : member.role;
}

/** Translate a role-selector value back into an updateMemberRole payload. */
export function roleValueToInput(value: string): {
  role: OsirisOrgRole;
  customRoleId: string | null;
} {
  if (value.startsWith('custom:')) {
    return { role: 'member', customRoleId: value.slice('custom:'.length) };
  }
  return { role: value as OsirisOrgRole, customRoleId: null };
}

export function roleLabel(member: OsirisOrgMember, customRoles: OsirisCustomRole[]): string {
  if (member.customRoleId) {
    return customRoles.find((role) => role.id === member.customRoleId)?.name ?? 'Custom';
  }
  return member.role;
}

/** Row shape for the members CrudTable (flat, sortable/searchable). */
export type MemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleValue: string;
  roleLabel: string;
  member: OsirisOrgMember;
};

export function toMemberRow(member: OsirisOrgMember, customRoles: OsirisCustomRole[]): MemberRow {
  return {
    id: member.userId,
    userId: member.userId,
    name: member.fullName || member.email || member.userId,
    email: member.email ?? '',
    roleValue: memberRoleValue(member),
    roleLabel: roleLabel(member, customRoles),
    member,
  };
}

export const MEMBER_COLUMNS: CrudColumn<MemberRow>[] = [
  { key: 'name', header: 'Member', sortable: true },
  { key: 'email', header: 'Email', sortable: true, hideBelow: 'sm' },
  statusColumn<MemberRow>('roleLabel', 'Role', ROLE_VARIANT, { sortable: true }),
];

/** Email-invite dialog fields. Role options injected at call site to include custom roles. */
export function inviteFormFields(roleOptions: ComboboxOption[]): FormField[] {
  return [
    { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'off' },
    {
      name: 'role',
      label: 'Role',
      type: 'combobox',
      required: true,
      options: STANDARD_ROLE_OPTIONS,
    },
    {
      name: 'expiresInDays',
      label: 'Expires in (days)',
      type: 'number',
      required: true,
      min: '1',
      max: '30',
    },
  ].map((field) => (field.name === 'role' ? { ...field, options: roleOptions } : field));
}

/** Invite-link dialog fields (links only allow member/viewer). */
export const INVITE_LINK_FORM_FIELDS: FormField[] = [
  {
    name: 'role',
    label: 'Role',
    type: 'combobox',
    required: true,
    options: [
      { value: 'member', label: 'Member' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  { name: 'maxUses', label: 'Max uses', type: 'number', required: true, min: '1', max: '100' },
  {
    name: 'expiresInDays',
    label: 'Expires in (days)',
    type: 'number',
    required: true,
    min: '1',
    max: '30',
  },
];

/** Custom-role create/edit dialog fields. */
export const CUSTOM_ROLE_FORM_FIELDS: FormField[] = [
  { name: 'name', label: 'Role name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  {
    name: 'baseRole',
    label: 'Base role',
    type: 'combobox',
    required: true,
    options: [
      { value: 'member', label: 'Member' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  { name: 'agentAccess', label: 'AI agent access', type: 'switch' },
];

export function formatInviteExpiry(value: string | null): string {
  return value ? formatDisplayDate(value) : '—';
}

export function inviteStatus(invitation: OsirisInvitation): string {
  if (invitation.acceptedAt) return 'accepted';
  if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now())
    return 'expired';
  return 'pending';
}

export function inviteLinkUsage(link: OsirisInviteLink): string {
  return `${link.useCount}/${link.maxUses}`;
}
