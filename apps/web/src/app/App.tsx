import { UserPreferencesProvider } from '@/lib/userPreferences';

import { AgentChatProvider } from './agent-chat-data';
import { DemoDataProvider } from './demo-data';
import { AppRouter } from './router';

export function App() {
  return (
    <UserPreferencesProvider>
      <DemoDataProvider>
        <AgentChatProvider>
          <AppRouter />
        </AgentChatProvider>
      </DemoDataProvider>
    </UserPreferencesProvider>
  );
}
