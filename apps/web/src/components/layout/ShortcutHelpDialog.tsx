import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@oktavius/base-ui';

type ShortcutItem = {
  keys: string[];
  description: string;
};

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', 'Shift', 'A'], description: 'Toggle AI chat sidebar' },
  { keys: ['Esc'], description: 'Close dialog or panel' },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
];

type ShortcutHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts?: ShortcutItem[];
};

export function ShortcutHelpDialog({
  open,
  onOpenChange,
  shortcuts = DEFAULT_SHORTCUTS,
}: ShortcutHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2">
          {shortcuts.map((shortcut) => (
            <li
              key={shortcut.description}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{shortcut.description}</span>
              <span className="inline-flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={`${shortcut.description}-${key}`}
                    className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
