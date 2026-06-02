import type { BadgeProps } from '@oktavius/base-ui';

import { PageHeaderCtaLink, PageHeaderOutlineLink } from '@/components/common/PageHeaderButtons';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import type { CaseRecord } from '@/app/demo-data';
import { PlusIcon, ProjectIcon } from '@/lib/icons';
import { casesPageIcon } from '@/lib/modulePageIcons';

import { CASE_STAGE_VARIANT, CASE_TYPE_VARIANT } from './caseModuleConfig';

export { casesPageIcon, CASE_TYPE_VARIANT, CASE_STAGE_VARIANT };

export const CASE_PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  Low: 'secondary',
  Normal: 'info',
  High: 'warning',
  Critical: 'destructive',
};

export const CASE_SLA_VARIANT: Record<string, BadgeProps['variant']> = {
  ok: 'success',
  warning: 'warning',
  breach: 'destructive',
};

export type CaseFormValues = {
  title: string;
  type: CaseRecord['type'];
  stage: CaseRecord['stage'];
  priority: CaseRecord['priority'];
  clientName: string;
  assignee: string;
  dueAt: string;
  summary: string;
};

export function CasesBoardLink({
  label,
  basePath = '/cases',
}: {
  label: string;
  basePath?: string;
}) {
  return (
    <PageHeaderOutlineLink to={`${basePath}/board`}>
      <ProjectIcon size={14} />
      {label}
    </PageHeaderOutlineLink>
  );
}

export function CasesHeaderAction({
  boardLabel,
  newLabel,
  basePath = '/cases',
}: {
  boardLabel: string;
  newLabel: string;
  basePath?: string;
}) {
  return (
    <>
      <CasesBoardLink label={boardLabel} basePath={basePath} />
      <PageHeaderCtaLink to={`${basePath}/new`}>
        <PlusIcon size={14} />
        {newLabel}
      </PageHeaderCtaLink>
    </>
  );
}

export function caseTypeBadge(type: CaseRecord['type']) {
  return <StatusBadge status={type} variantMap={CASE_TYPE_VARIANT} />;
}

export function caseStageBadge(stage: CaseRecord['stage']) {
  return <StatusBadge status={stage} variantMap={CASE_STAGE_VARIANT} />;
}

export function casePriorityBadge(priority: CaseRecord['priority']) {
  return <StatusBadge status={priority} variantMap={CASE_PRIORITY_VARIANT} />;
}

export function caseSlaBadge(slaStatus: CaseRecord['slaStatus']) {
  const labels: Record<CaseRecord['slaStatus'], string> = {
    ok: 'On track',
    warning: 'At risk',
    breach: 'Breached',
  };
  return <StatusBadge status={slaStatus} label={labels[slaStatus]} variantMap={CASE_SLA_VARIANT} />;
}
