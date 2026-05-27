import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AgentPageContextProvider } from '@/components/agent/page-context';
import { AccessDeniedPage } from '@/components/common/AccessDeniedPage';
import { CommandPaletteProvider } from '@/components/command/CommandPalette';
import { RouteErrorPage } from '@/components/errors/AppErrorPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ShortcutHelpProvider } from '@/components/layout/ShortcutHelpProvider';
import { AIChatPage } from '@/modules/ai-chat/AIChatPage';
import { CalendarPage } from '@/modules/calendar/CalendarPage';
import { CaseCreatePage } from '@/modules/cases/CaseCreatePage';
import { CaseDetailPage } from '@/modules/cases/CaseDetailPage';
import { CasesBoardPage } from '@/modules/cases/CasesBoardPage';
import { CasesListPage } from '@/modules/cases/CasesListPage';
import { ClientCreatePage } from '@/modules/clients/ClientCreatePage';
import { ClientDetailPage } from '@/modules/clients/ClientDetailPage';
import { ClientOnboardingPage } from '@/modules/clients/ClientOnboardingPage';
import { ClientsListPage } from '@/modules/clients/ClientsListPage';
import { ContractDetailPage } from '@/modules/contracts/ContractDetailPage';
import { ContractsListPage } from '@/modules/contracts/ContractsListPage';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { DocumentsPage } from '@/modules/documents/DocumentsPage';
import { IncidentDetailPage } from '@/modules/incidents/IncidentDetailPage';
import { IncidentsListPage } from '@/modules/incidents/IncidentsListPage';
import { InvoiceDetailPage } from '@/modules/invoices/InvoiceDetailPage';
import { InvoicesListPage } from '@/modules/invoices/InvoicesListPage';
import { OrderDetailPage } from '@/modules/orders/OrderDetailPage';
import { OrdersListPage } from '@/modules/orders/OrdersListPage';
import { ProductCreatePage } from '@/modules/products/ProductCreatePage';
import { ProductDetailPage } from '@/modules/products/ProductDetailPage';
import { ProductsListPage } from '@/modules/products/ProductsListPage';
import { ProjectDetailPage } from '@/modules/projects/ProjectDetailPage';
import { ProjectsListPage } from '@/modules/projects/ProjectsListPage';
import { ReportsPage } from '@/modules/reports/ReportsPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
import { ComponentShowcasePage } from '@/modules/showcase/ComponentShowcasePage';
import { OrganizationCreatePage } from '@/modules/superadmin/OrganizationCreatePage';
import { OrganizationDetailPage } from '@/modules/superadmin/OrganizationDetailPage';
import { SuperadminPage } from '@/modules/superadmin/SuperadminPage';
import { TasksPage } from '@/modules/tasks/TasksPage';
import { UserCreatePage } from '@/modules/users/UserCreatePage';
import { UserDetailPage } from '@/modules/users/UserDetailPage';
import { UsersListPage } from '@/modules/users/UsersListPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AgentPageContextProvider>
        <ShortcutHelpProvider>
          <CommandPaletteProvider>
            <Routes>
              <Route element={<AppLayout />} errorElement={<RouteErrorPage />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/showcase" element={<ComponentShowcasePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/superadmin" element={<SuperadminPage />} />
                <Route path="/superadmin/orgs/new" element={<OrganizationCreatePage />} />
                <Route path="/superadmin/orgs/:orgId" element={<OrganizationDetailPage />} />
                <Route path="/users" element={<UsersListPage />} />
                <Route path="/users/new" element={<UserCreatePage />} />
                <Route path="/users/:userId" element={<UserDetailPage />} />
                <Route path="/clients" element={<ClientsListPage />} />
                <Route path="/clients/new" element={<ClientCreatePage />} />
                <Route path="/clients/onboarding" element={<ClientOnboardingPage />} />
                <Route path="/clients/:clientId" element={<ClientDetailPage />} />
                <Route path="/cases" element={<CasesListPage />} />
                <Route path="/cases/board" element={<CasesBoardPage />} />
                <Route path="/cases/new" element={<CaseCreatePage />} />
                <Route path="/cases/:caseId" element={<CaseDetailPage />} />
                <Route path="/incidents" element={<IncidentsListPage />} />
                <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
                <Route path="/contracts" element={<ContractsListPage />} />
                <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
                <Route path="/orders" element={<OrdersListPage />} />
                <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                <Route path="/invoices" element={<InvoicesListPage />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
                <Route path="/products" element={<ProductsListPage />} />
                <Route path="/products/new" element={<ProductCreatePage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
                <Route path="/projects" element={<ProjectsListPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />
              </Route>
            </Routes>
          </CommandPaletteProvider>
        </ShortcutHelpProvider>
      </AgentPageContextProvider>
    </BrowserRouter>
  );
}
