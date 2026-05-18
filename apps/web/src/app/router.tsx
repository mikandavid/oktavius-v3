import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { AgentChatPage } from '@/modules/agent-chat/AgentChatPage';
import { ClientCreatePage } from '@/modules/clients/ClientCreatePage';
import { ClientDetailPage } from '@/modules/clients/ClientDetailPage';
import { ClientsListPage } from '@/modules/clients/ClientsListPage';
import { UserCreatePage } from '@/modules/users/UserCreatePage';
import { UserDetailPage } from '@/modules/users/UserDetailPage';
import { UsersListPage } from '@/modules/users/UsersListPage';
import { ComponentShowcasePage } from '@/pages/ComponentShowcasePage';
import { DashboardPage } from '@/pages/DashboardPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ai-chat" element={<AgentChatPage />} />
          <Route path="/showcase" element={<ComponentShowcasePage />} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/new" element={<UserCreatePage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/new" element={<ClientCreatePage />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
