import { RuntimeProviders } from './runtimeProviders';
import { AppRouter } from './router';

export function App() {
  return (
    <RuntimeProviders>
      <AppRouter />
    </RuntimeProviders>
  );
}
