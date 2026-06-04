import { Button, cn } from '@oktavius/base-ui';

import { MicIcon, StopIcon } from '@/lib/icons';

type VoiceRecorderProps = {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
};

export function VoiceRecorder({ isRecording, onStart, onStop, className }: VoiceRecorderProps) {
  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'ghost'}
      size="icon"
      className={cn('h-9 w-9 shrink-0', className)}
      onClick={isRecording ? onStop : onStart}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      {isRecording ? <StopIcon size={18} /> : <MicIcon size={18} />}
    </Button>
  );
}

type RecordingBarProps = {
  isRecording: boolean;
  transcript?: string;
  className?: string;
};

export function RecordingBar({ isRecording, transcript, className }: RecordingBarProps) {
  if (!isRecording && !transcript) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs',
        className,
      )}
    >
      {isRecording ? (
        <>
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <span className="font-medium text-destructive">Recording…</span>
        </>
      ) : null}
      {transcript ? <span className="truncate text-muted-foreground">{transcript}</span> : null}
    </div>
  );
}
