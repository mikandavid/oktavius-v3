import React, { Suspense, lazy } from 'react';

import { Skeleton } from '@oktavius/base-ui';

const OctStat = lazy(() => import('./components/OctStat'));
const OctDataCard = lazy(() => import('./components/OctDataCard'));
const OctEmail = lazy(() => import('./components/OctEmail'));
const OctBarChart = lazy(() => import('./components/OctBarChart'));
const OctLineChart = lazy(() => import('./components/OctLineChart'));
const OctPieChart = lazy(() => import('./components/OctPieChart'));

export interface OctComponentProps {
  attrs: Record<string, string>;
  body: string;
}

const REGISTRY: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<OctComponentProps>>
> = {
  'oct-stat': OctStat,
  'oct-data-card': OctDataCard,
  'oct-email': OctEmail,
  'oct-bar-chart': OctBarChart,
  'oct-line-chart': OctLineChart,
  'oct-pie-chart': OctPieChart,
};

type OctComponentRendererProps = {
  name: string;
  attrs: Record<string, string>;
  body: string;
};

export function OctComponentRenderer({ name, attrs, body }: OctComponentRendererProps) {
  const Component = REGISTRY[name];
  if (!Component) return null;
  return (
    <Suspense fallback={<Skeleton className="h-16 w-full rounded-md" />}>
      <Component attrs={attrs} body={body} />
    </Suspense>
  );
}

export function isKnownOctTag(name: string): boolean {
  return name in REGISTRY;
}
