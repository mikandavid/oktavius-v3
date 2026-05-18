import { AgentChatProvider } from './agent-chat-data';
import { DemoDataProvider } from './demo-data';
import { AppRouter } from './router';

export function App() {
  return (
    <DemoDataProvider>
      <AgentChatProvider>
        <AppRouter />
      </AgentChatProvider>
    </DemoDataProvider>
  );
}
