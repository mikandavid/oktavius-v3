import type { ComponentType, ReactNode } from 'react';

import {
  CaseIcon,
  ContractIcon,
  HomeIcon,
  IncidentIcon,
  InvoiceIcon,
  LockIcon,
  OrderIcon,
  OrganizationIcon,
  ProductIcon,
  ProjectIcon,
  ProjectsIcon,
  ReportsIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SuperadminIcon,
  UserCircleIcon,
  UsersIcon,
  CalendarIcon,
  DocumentIcon,
  TasksIcon,
  type IconProps,
} from '@/lib/icons';

/** Standard header orb on ModulePage / CrudMainView — size 20, duotone (matches Users list). */
export function modulePageIcon(Icon: ComponentType<IconProps>): ReactNode {
  return <Icon size={20} weight="duotone" />;
}

export const dashboardPageIcon = () => modulePageIcon(HomeIcon);
export const clientsPageIcon = () => modulePageIcon(ProjectsIcon);
export const casesPageIcon = () => modulePageIcon(CaseIcon);
export const incidentsPageIcon = () => modulePageIcon(IncidentIcon);
export const contractsPageIcon = () => modulePageIcon(ContractIcon);
export const ordersPageIcon = () => modulePageIcon(OrderIcon);
export const invoicesPageIcon = () => modulePageIcon(InvoiceIcon);
export const productsPageIcon = () => modulePageIcon(ProductIcon);
export const projectsPageIcon = () => modulePageIcon(ProjectIcon);
export const usersPageIcon = () => modulePageIcon(UsersIcon);
export const userRecordPageIcon = () => modulePageIcon(UserCircleIcon);
export const reportsPageIcon = () => modulePageIcon(ReportsIcon);
export const settingsPageIcon = () => modulePageIcon(SettingsIcon);
export const superadminPageIcon = () => modulePageIcon(SuperadminIcon);
export const organizationPageIcon = () => modulePageIcon(OrganizationIcon);
export const showcasePageIcon = () => modulePageIcon(SlidersHorizontalIcon);
export const accessDeniedPageIcon = () => modulePageIcon(LockIcon);
export const documentsPageIcon = () => modulePageIcon(DocumentIcon);
export const calendarPageIcon = () => modulePageIcon(CalendarIcon);
export const tasksPageIcon = () => modulePageIcon(TasksIcon);
