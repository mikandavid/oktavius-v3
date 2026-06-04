export type OsirisOrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OsirisPermissionKey = string;

export type OsirisPermissionSubject = {
  isSuperadmin: boolean;
  role: OsirisOrgRole | null;
  permissions: readonly OsirisPermissionKey[];
};

export type OsirisPermissionRequirement =
  | OsirisPermissionKey
  | OsirisPermissionKey[]
  | 'superadmin'
  | ((subject: OsirisPermissionSubject) => boolean);
