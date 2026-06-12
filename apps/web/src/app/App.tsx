import { AppRouter } from './router';
import { RuntimeProviders } from './runtimeProviders';

export function App() {
  return (
    <RuntimeProviders>
      <AppRouter />
    </RuntimeProviders>
  );
}
