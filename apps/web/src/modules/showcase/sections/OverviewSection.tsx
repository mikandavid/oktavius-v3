import { Button } from '@oktavius/base-ui';

import { InfoBox } from '@/components/common/InfoBox';
import { useCommandPalette } from '@/components/command/CommandPalette';
import { appToast } from '@/lib/toast';

import { ShowcaseBlock } from '../shared';

export function OverviewSection() {
  const { setOpen: openCommandPalette } = useCommandPalette();

  return (
    <div className="space-y-4">
      <ShowcaseBlock
        title="About this gallery"
        meta="Every block is interactive — click, type, toggle, and confirm to see real behaviour"
      >
        <p className="text-sm text-muted-foreground">
          Use the sidebar to browse component categories. Each section demonstrates live states:
          hover, focus, loading, validation, dismiss, and destructive confirms. All examples follow
          the rules in <code className="text-xs">docs/ui-rules/</code>.
        </p>
      </ShowcaseBlock>

      <ShowcaseBlock title="Toast notifications" meta="Action feedback via sonner">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => appToast.success('Record saved successfully.')}
          >
            Success
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => appToast.error('Failed to save — try again.')}
          >
            Error
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => appToast.warning('Contract expires in 7 days.')}
          >
            Warning
          </Button>
          <Button size="sm" variant="outline" onClick={() => appToast.info('3 rows selected.')}>
            Info
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              appToast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
                loading: 'Exporting…',
                success: 'Export complete.',
                error: 'Export failed.',
              })
            }
          >
            Promise
          </Button>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Command palette" meta="⌘K · routes, clients, orders">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="cta" onClick={() => openCommandPalette(true)}>
            Open command palette
          </Button>
          <span className="text-xs text-muted-foreground">Keyboard: ⌘K / Ctrl+K</span>
        </div>
      </ShowcaseBlock>

      <InfoBox tone="info" title="Design tokens">
        Grays come from the <strong className="font-medium">neutral ramp</strong> (
        <code className="text-xs">neutral-0</code> … <code className="text-xs">neutral-950</code>
        ). Surface roles like <strong className="font-medium">bg-card</strong> and{' '}
        <strong className="font-medium">bg-muted</strong> alias that ramp. Shell chrome (nav,
        header, chat) shares <strong className="font-medium">bg-card</strong>. Primary actions use{' '}
        <strong className="font-medium">variant="cta"</strong> (brand violet). Tune editable tokens
        live under <strong className="font-medium">Design tokens</strong> in this gallery (
        <span className="text-xs">docs/ui-rules/foundation.md</span>).
      </InfoBox>
    </div>
  );
}
