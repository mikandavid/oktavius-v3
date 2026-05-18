import { StatCard } from '@oktavius/base-ui';

import { ModulePage } from '@/components/common/PageLayout';
import { InfoBox } from '@/components/common/InfoBox';
import { InfoIcon } from '@/lib/icons';

export function DashboardPage() {
  return (
    <ModulePage
      title="ERP Frontend Base"
      subtitle="First extraction slice: app shell, page chrome, shared primitives, and a sample users module."
    >
      <InfoBox tone="info" icon={<InfoIcon size={18} weight="fill" />} title="Extraction status">
        This workspace is the extracted frontend base. Next slices: richer CRUD tooling,
        detail views, and the first backend-backed module contract.
      </InfoBox>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Modules"
          value="2"
          description="clients · users"
        />
        <StatCard
          label="Shared Primitives"
          value="6"
          description="layout, data, forms, feedback, display, nav"
        />
        <StatCard
          label="Next Phase"
          value="Tables + Forms"
          description="backend-backed module contracts"
        />
      </div>
    </ModulePage>
  );
}
