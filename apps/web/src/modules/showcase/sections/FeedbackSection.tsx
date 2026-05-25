import { useState } from 'react';

import {
  AlertBanner,
  DetailSkeleton,
  InlineEmptyState,
  PageSkeleton,
  Skeleton,
} from '@oktavius/base-ui';

import { EmptyState } from '@/components/common/EmptyState';
import { InfoBox } from '@/components/common/InfoBox';
import { InfoIcon, SuccessIcon, WarningIcon } from '@/lib/icons';

import { ShowcaseBlock } from '../shared';

export function FeedbackSection() {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <div className="space-y-4">
      {bannerVisible ? (
        <AlertBanner tone="warning" dismissible onDismiss={() => setBannerVisible(false)}>
          Trial expires in 14 days. Upgrade to keep advanced modules enabled.
        </AlertBanner>
      ) : (
        <ShowcaseBlock title="AlertBanner dismissed" meta="Click below to restore">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setBannerVisible(true)}
          >
            Show banner again
          </button>
        </ShowcaseBlock>
      )}

      <ShowcaseBlock title="InfoBox tones" meta="Inline contextual alerts inside sections">
        <div className="grid gap-4 lg:grid-cols-2">
          <InfoBox tone="neutral" title="Neutral">
            General guidance or contextual help for a workflow step.
          </InfoBox>
          <InfoBox tone="info" icon={<InfoIcon size={18} weight="fill" />} title="Info">
            Informational note with an optional leading icon.
          </InfoBox>
          <InfoBox tone="success" icon={<SuccessIcon size={18} weight="fill" />} title="Success">
            Operation completed successfully.
          </InfoBox>
          <InfoBox tone="warning" icon={<WarningIcon size={18} weight="fill" />} title="Warning">
            Review required before continuing.
          </InfoBox>
          <InfoBox tone="destructive" title="Destructive">
            This action permanently removes data.
          </InfoBox>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Empty states" meta="Page-level EmptyState · section InlineEmptyState">
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState
            title="No records yet"
            description="Create your first record to get started."
          />
          <InlineEmptyState text="No line items in this section." centered />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Loading skeletons"
        meta="PageSkeleton · DetailSkeleton · inline Skeleton"
        actions={
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setShowSkeleton((v) => !v)}
          >
            {showSkeleton ? 'Hide' : 'Show'} skeletons
          </button>
        }
      >
        {showSkeleton ? (
          <div className="space-y-6">
            <PageSkeleton />
            <DetailSkeleton />
          </div>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full max-w-xs" />
          </div>
        )}
      </ShowcaseBlock>
    </div>
  );
}
