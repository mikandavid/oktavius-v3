import { useLocation } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';

export function ModulePlaceholderPage() {
  const { pathname } = useLocation();

  return (
    <ModulePage title="Module not implemented" subtitle={pathname}>
      <p className="text-sm text-muted-foreground">
        This route is intentionally empty. Generate the module UI from the UI rules and shared
        components.
      </p>
    </ModulePage>
  );
}
