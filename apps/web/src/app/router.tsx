import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CommandPaletteProvider } from '@/components/command/CommandPalette';
import { AppLayout } from '@/components/layout/AppLayout';
import { AgentChatPage } from '@/modules/agent-chat/AgentChatPage';
import { CaseCreatePage } from '@/modules/cases/CaseCreatePage';
import { CaseDetailPage } from '@/modules/cases/CaseDetailPage';
import { CasesBoardPage } from '@/modules/cases/CasesBoardPage';
import { CasesListPage } from '@/modules/cases/CasesListPage';
import { ClientCreatePage } from '@/modules/clients/ClientCreatePage';
import { ClientDetailPage } from '@/modules/clients/ClientDetailPage';
import { ClientsListPage } from '@/modules/clients/ClientsListPage';
import { ContractDetailPage } from '@/modules/contracts/ContractDetailPage';
import { ContractsListPage } from '@/modules/contracts/ContractsListPage';
import { InvoiceDetailPage } from '@/modules/invoices/InvoiceDetailPage';
import { InvoicesListPage } from '@/modules/invoices/InvoicesListPage';
import { OrderDetailPage } from '@/modules/orders/OrderDetailPage';
import { OrdersListPage } from '@/modules/orders/OrdersListPage';
import { ProductCreatePage } from '@/modules/products/ProductCreatePage';
import { ProductDetailPage } from '@/modules/products/ProductDetailPage';
import { ProductsListPage } from '@/modules/products/ProductsListPage';
import { ProjectDetailPage } from '@/modules/projects/ProjectDetailPage';
import { ProjectsListPage } from '@/modules/projects/ProjectsListPage';
import { UserCreatePage } from '@/modules/users/UserCreatePage';
import { UserDetailPage } from '@/modules/users/UserDetailPage';
import { UsersListPage } from '@/modules/users/UsersListPage';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';
import { IncidentsWorkspacePage } from '@/pages/IncidentsWorkspacePage';
import { ComponentShowcasePage } from '@/pages/ComponentShowcasePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { OrgCreatePage } from '@/modules/superadmin/OrgCreatePage';
import { OrgDetailPage } from '@/modules/superadmin/OrgDetailPage';
import { SuperadminPage } from '@/modules/superadmin/SuperadminPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <CommandPaletteProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/ai-chat" element={<AgentChatPage />} />
            <Route path="/showcase" element={<ComponentShowcasePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/superadmin" element={<SuperadminPage />} />
            <Route path="/superadmin/orgs/new" element={<OrgCreatePage />} />
            <Route path="/superadmin/orgs/:orgId" element={<OrgDetailPage />} />
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/new" element={<UserCreatePage />} />
            <Route path="/users/:userId" element={<UserDetailPage />} />
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/clients/new" element={<ClientCreatePage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/cases" element={<CasesListPage />} />
            <Route path="/cases/board" element={<CasesBoardPage />} />
            <Route path="/cases/new" element={<CaseCreatePage />} />
            <Route path="/cases/:caseId" element={<CaseDetailPage />} />
            <Route path="/incidents" element={<IncidentsWorkspacePage />} />
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
            <Route path="/access-denied" element={<AccessDeniedPage moduleName="Users" />} />
          </Route>
        </Routes>
      </CommandPaletteProvider>
    </BrowserRouter>
  );
}
