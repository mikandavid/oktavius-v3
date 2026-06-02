import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import { UserPreferencesProvider } from '@/lib/userPreferences';

import { AgentChatProvider } from './agent-chat-data';
import { DemoDataProvider } from './demo-data';
import { AppRouter } from './router';

export function App() {
  return (
    <UserPreferencesProvider>
      <DemoDataProvider>
        <ActiveLocationProvider>
          <AgentChatProvider>
            <AppRouter />
          </AgentChatProvider>
        </ActiveLocationProvider>
      </DemoDataProvider>
    </UserPreferencesProvider>
  );
}
