import {
  Button,
  cn,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroupField,
  SettingsRow,
  Switch,
} from '@oktavius/base-ui';
import { useState } from 'react';

import { Settings2Icon } from '@/lib/icons';

import type { AgentModelMode, AgentRuntimeMode } from './types';

type AgentSettingsPopoverProps = {
  modelMode: AgentModelMode;
  onModelModeChange: (mode: AgentModelMode) => void;
  runtimeMode?: AgentRuntimeMode;
  onRuntimeModeChange?: (mode: AgentRuntimeMode) => void;
  connectionLabel?: string;
  connectionTone?: 'success' | 'warning' | 'info' | 'muted';
  className?: string;
};

const CONNECTION_TONE_CLASS = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  muted: 'bg-muted-foreground/50',
} as const;

const MODEL_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'thinking', label: 'Thinking' },
  { value: 'fast', label: 'Fast' },
];

/** Chat header settings for model mode and runtime connection. */
export function AgentSettingsPopover({
  modelMode,
  onModelModeChange,
  runtimeMode = 'cloud',
  onRuntimeModeChange,
  connectionLabel = 'Connected',
  connectionTone = 'success',
  className,
}: AgentSettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = runtimeMode === 'desktop';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-muted-foreground', className)}
          aria-label="Agent settings"
        >
          <Settings2Icon size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agent settings</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Model behavior and runtime connection for this workspace.
            </p>
          </div>

          <SettingsRow label="Model mode" description="Balance speed and reasoning depth.">
            <RadioGroupField
              id="agent-model-mode"
              options={MODEL_OPTIONS}
              value={modelMode}
              orientation="vertical"
              onChange={(value) => onModelModeChange(value as AgentModelMode)}
            />
          </SettingsRow>

          {onRuntimeModeChange ? (
            <SettingsRow
              label="Runtime"
              description={isDesktop ? 'Desktop agent active' : 'Cloud agent active'}
            >
              <div className="flex items-center gap-2">
                <Label htmlFor="agent-runtime" className="text-xs text-muted-foreground">
                  Cloud
                </Label>
                <Switch
                  id="agent-runtime"
                  checked={isDesktop}
                  onCheckedChange={(checked) => onRuntimeModeChange(checked ? 'desktop' : 'cloud')}
                />
                <Label htmlFor="agent-runtime" className="text-xs text-muted-foreground">
                  Desktop
                </Label>
              </div>
            </SettingsRow>
          ) : null}

          <div className="rounded-control border border-border/60 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={cn('h-2 w-2 rounded-full', CONNECTION_TONE_CLASS[connectionTone])} />
              <span className="font-medium text-foreground">{connectionLabel}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
