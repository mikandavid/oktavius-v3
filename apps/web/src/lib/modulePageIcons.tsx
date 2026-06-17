import type { ComponentType, ReactNode } from 'react';

import {
  CalendarIcon,
  CaseIcon,
  ContractIcon,
  EmailIcon,
  FolderIcon,
  FunnelIcon,
  HistoryIcon,
  HomeIcon,
  type IconProps,
  IncidentIcon,
  InvoiceIcon,
  LifeBuoyIcon,
  LockIcon,
  OrderIcon,
  OrganizationIcon,
  ProductIcon,
  ProjectIcon,
  ProjectsIcon,
  PurchasingIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TeamIcon,
  UserCircleIcon,
  UsersIcon,
  WarningIcon,
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
export const settingsPageIcon = () => modulePageIcon(SettingsIcon);
export const membersPageIcon = () => modulePageIcon(TeamIcon);
export const organizationPageIcon = () => modulePageIcon(OrganizationIcon);
export const showcasePageIcon = () => modulePageIcon(SlidersHorizontalIcon);
export const accessDeniedPageIcon = () => modulePageIcon(LockIcon);
export const notFoundPageIcon = () => modulePageIcon(WarningIcon);
export const emailPageIcon = () => modulePageIcon(EmailIcon);
export const calendarPageIcon = () => modulePageIcon(CalendarIcon);
export const contactsPageIcon = () => modulePageIcon(UserCircleIcon);
export const vendorsPageIcon = () => modulePageIcon(OrganizationIcon);
export const leadsPageIcon = () => modulePageIcon(FunnelIcon);
export const staffPageIcon = () => modulePageIcon(TeamIcon);
export const purchasingPageIcon = () => modulePageIcon(PurchasingIcon);
export const storagePageIcon = () => modulePageIcon(FolderIcon);
export const supportPageIcon = () => modulePageIcon(LifeBuoyIcon);
export const changelogPageIcon = () => modulePageIcon(HistoryIcon);
