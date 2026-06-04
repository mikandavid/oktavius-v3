import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import { UserPreferencesProvider } from '@/lib/userPreferences';
import { OsirisAuthProvider } from '@/runtime/osiris/AuthProvider';

import { AgentChatProvider } from './agent-chat-data';
import { DemoDataProvider } from './demo-data';
import { AppRouter } from './router';

const USE_DEMO_RUNTIME = import.meta.env.VITE_OKTAVIUS_RUNTIME === 'demo';

export function App() {
  const app = (
    <DemoDataProvider>
      <ActiveLocationProvider>
        <AgentChatProvider>
          <AppRouter />
        </AgentChatProvider>
      </ActiveLocationProvider>
    </DemoDataProvider>
  );

  return (
    <UserPreferencesProvider>
      {USE_DEMO_RUNTIME ? app : <OsirisAuthProvider>{app}</OsirisAuthProvider>}
    </UserPreferencesProvider>
  );
}
