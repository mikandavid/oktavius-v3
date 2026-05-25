import { useState } from 'react';

import {
  Badge,
  Button,
  CARD_CONTENT_TIERS,
  CountBadge,
  MouseTooltip,
  Separator,
  StatusDot,
  StatusDotLabel,
  cn,
} from '@oktavius/base-ui';

import { StatusBadge } from '@/components/feedback/StatusBadge';
import { DeleteIcon, EditIcon, ExportIcon, PlusIcon } from '@/lib/icons';

import { ShowcaseBlock } from '../shared';

export function FoundationsSection() {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="Button variants" meta="Hierarchy: cta → default → outline → ghost">
        <div className="flex flex-wrap gap-2">
          <Button variant="cta">CTA</Button>
          <Button variant="default">Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Button sizes & states" meta="sm h-7 · default h-9 · icon h-9 w-9">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline">
            Small
          </Button>
          <Button size="default" variant="default">
            Default
          </Button>
          <Button size="lg" variant="default">
            Large
          </Button>
          <MouseTooltip content="Export">
            <Button size="icon" variant="outline" aria-label="Export">
              <ExportIcon size={16} />
            </Button>
          </MouseTooltip>
          <Button variant="cta" loading={loading} onClick={simulateLoading}>
            {loading ? 'Saving…' : 'Loading demo'}
          </Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Page header actions" meta="All h-7 — Export icon-only, CTA last">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <MouseTooltip content="Export">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" aria-label="Export">
              <ExportIcon size={14} />
            </Button>
          </MouseTooltip>
          <Button size="sm" variant="outline" className="h-7">
            Board view
          </Button>
          <Button size="sm" variant="cta" className="h-7">
            <PlusIcon size={14} />
            New record
          </Button>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Badges" meta="StatusBadge for domain status · Badge for labels">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <StatusBadge status="Active" />
          <StatusBadge status="Pending" variantMap={{ Pending: 'warning' }} />
          <CountBadge count={12} />
          <CountBadge count={0} hideZero />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="StatusDot" meta="Inline presence and legend">
        <div className="flex flex-wrap items-center gap-4">
          <StatusDotLabel tone="success">Online</StatusDotLabel>
          <StatusDotLabel tone="info">Syncing</StatusDotLabel>
          <StatusDotLabel tone="warning" value="3">
            Warnings
          </StatusDotLabel>
          <StatusDotLabel tone="destructive">Error</StatusDotLabel>
          <StatusDotLabel tone="neutral">Idle</StatusDotLabel>
          <StatusDot tone="muted" size="md" />
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Typography tiers"
        meta="CARD_CONTENT_TIERS — six fixed levels inside cards"
      >
        <div className="space-y-2">
          <p className={CARD_CONTENT_TIERS.hero}>Hero — record identity</p>
          <p className={CARD_CONTENT_TIERS.highlight}>Highlight — emphasized value</p>
          <p className={CARD_CONTENT_TIERS.body}>Body — default field value</p>
          <p className={CARD_CONTENT_TIERS.label}>Label — field caption</p>
          <p className={CARD_CONTENT_TIERS.meta}>Meta — secondary context</p>
          <p className={CARD_CONTENT_TIERS.micro}>cli_1001 · micro ID</p>
        </div>
        <Separator className="my-4" />
        <div className="flex items-center gap-3">
          <MouseTooltip content="Edit record">
            <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Edit">
              <EditIcon size={14} />
            </Button>
          </MouseTooltip>
          <MouseTooltip content="Delete record">
            <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Delete">
              <DeleteIcon size={14} />
            </Button>
          </MouseTooltip>
          <span className={cn('text-xs text-muted-foreground')}>
            Icon buttons always need tooltips
          </span>
        </div>
      </ShowcaseBlock>
    </div>
  );
}
