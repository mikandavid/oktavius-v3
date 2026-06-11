import { ApiAuthorizationError } from '@/api/contracts';

import {
  canUsePermissionRequirement,
  type PermissionRequirement,
  type PermissionSubject,
} from './permissions';

type AsyncHandler = (...args: never[]) => Promise<unknown>;

type DeletableHandlers = {
  delete: (id: string) => Promise<void>;
};

type OrganizationAdminHandlers = {
  list: AsyncHandler;
  get: AsyncHandler;
  create: AsyncHandler;
  update: AsyncHandler;
  delete: AsyncHandler;
};

type UserAdminHandlers = OrganizationAdminHandlers;

type PermissionedRegistry = {
  cases: DeletableHandlers;
  clients: DeletableHandlers;
  contracts: DeletableHandlers;
  incidents: DeletableHandlers;
  invoices: DeletableHandlers;
  orders: DeletableHandlers;
  organizations: OrganizationAdminHandlers;
  products: DeletableHandlers;
  projects: DeletableHandlers;
  users: UserAdminHandlers;
};

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

function withPermission<THandler extends AsyncHandler>(
  subject: PermissionSubject,
  requirement: PermissionRequirement,
  actionLabel: string,
  handler: THandler,
): THandler {
  return (async (...args: Parameters<THandler>): Promise<Awaited<ReturnType<THandler>>> => {
    requireApiPermission(subject, requirement, actionLabel);
    return (await handler(...args)) as Awaited<ReturnType<THandler>>;
  }) as THandler;
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

function guardOrganizations<THandlers extends OrganizationAdminHandlers>(
  handlers: THandlers,
  subject: PermissionSubject,
): THandlers {
  return {
    ...handlers,
    list: withPermission(subject, 'superadmin', 'List organizations', handlers.list),
    get: withPermission(subject, 'superadmin', 'View organization', handlers.get),
    create: withPermission(subject, 'superadmin', 'Create organization', handlers.create),
    update: withPermission(subject, 'superadmin', 'Update organization', handlers.update),
    delete: withPermission(subject, 'superadmin', 'Delete organization', handlers.delete),
  };
}

function guardUsers<THandlers extends UserAdminHandlers>(
  handlers: THandlers,
  subject: PermissionSubject,
): THandlers {
  return {
    ...handlers,
    list: withPermission(subject, 'manageOrganization', 'List users', handlers.list),
    get: withPermission(subject, 'manageOrganization', 'View user', handlers.get),
    create: withPermission(subject, 'manageOrganization', 'Create user', handlers.create),
    update: withPermission(subject, 'manageOrganization', 'Update user', handlers.update),
    delete: withPermission(subject, 'deleteRecords', 'Delete user', handlers.delete),
  };
}

export function withPermissionedDemoApiRegistry<TRegistry extends PermissionedRegistry>(
  registry: TRegistry,
  subject: PermissionSubject,
): TRegistry {
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
