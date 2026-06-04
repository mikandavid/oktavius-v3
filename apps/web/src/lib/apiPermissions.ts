import {
  ApiAuthorizationError,
  type DemoApiRegistry,
  type OrganizationsHandlers,
  type UsersHandlers,
} from '@/api/demo-client';

import {
  canUsePermissionRequirement,
  type PermissionRequirement,
  type PermissionSubject,
} from './permissions';

function requirementName(requirement: PermissionRequirement) {
  if (Array.isArray(requirement)) return requirement.join(',');
  return typeof requirement === 'function' ? 'custom' : requirement;
}

export function requireApiPermission(
  subject: PermissionSubject,
  requirement: PermissionRequirement,
  actionLabel: string,
) {
  if (canUsePermissionRequirement(subject, requirement)) return;

  throw new ApiAuthorizationError(
    `${actionLabel} is not allowed for the current user.`,
    requirementName(requirement),
  );
}

function withPermission<TArgs extends unknown[], TResult>(
  subject: PermissionSubject,
  requirement: PermissionRequirement,
  actionLabel: string,
  handler: (...args: TArgs) => Promise<TResult>,
) {
  return async (...args: TArgs) => {
    requireApiPermission(subject, requirement, actionLabel);
    return handler(...args);
  };
}

function guardDelete<THandlers extends { delete: (id: string) => Promise<void> }>(
  handlers: THandlers,
  subject: PermissionSubject,
  label: string,
): THandlers {
  return {
    ...handlers,
    delete: withPermission(subject, 'deleteRecords', label, handlers.delete),
  };
}

function guardOrganizations(
  handlers: OrganizationsHandlers,
  subject: PermissionSubject,
): OrganizationsHandlers {
  return {
    ...handlers,
    list: withPermission(subject, 'superadmin', 'List organizations', handlers.list),
    get: withPermission(subject, 'superadmin', 'View organization', handlers.get),
    create: withPermission(subject, 'superadmin', 'Create organization', handlers.create),
    update: withPermission(subject, 'superadmin', 'Update organization', handlers.update),
    delete: withPermission(subject, 'superadmin', 'Delete organization', handlers.delete),
  };
}

function guardUsers(handlers: UsersHandlers, subject: PermissionSubject): UsersHandlers {
  return {
    ...handlers,
    list: withPermission(subject, 'manageOrganization', 'List users', handlers.list),
    get: withPermission(subject, 'manageOrganization', 'View user', handlers.get),
    create: withPermission(subject, 'manageOrganization', 'Create user', handlers.create),
    update: withPermission(subject, 'manageOrganization', 'Update user', handlers.update),
    delete: withPermission(subject, 'deleteRecords', 'Delete user', handlers.delete),
  };
}

export function withPermissionedDemoApiRegistry(
  registry: DemoApiRegistry,
  subject: PermissionSubject,
): DemoApiRegistry {
  return {
    ...registry,
    cases: guardDelete(registry.cases, subject, 'Delete case'),
    clients: guardDelete(registry.clients, subject, 'Delete client'),
    contracts: guardDelete(registry.contracts, subject, 'Delete contract'),
    incidents: guardDelete(registry.incidents, subject, 'Delete incident'),
    invoices: guardDelete(registry.invoices, subject, 'Delete invoice'),
    orders: guardDelete(registry.orders, subject, 'Delete order'),
    organizations: guardOrganizations(registry.organizations, subject),
    products: guardDelete(registry.products, subject, 'Delete product'),
    projects: guardDelete(registry.projects, subject, 'Delete project'),
    users: guardUsers(registry.users, subject),
  };
}
