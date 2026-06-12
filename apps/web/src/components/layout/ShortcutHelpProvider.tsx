import { type ReactNode, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { ShortcutHelpDialog } from './ShortcutHelpDialog';

export function ShortcutHelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useHotkeys(
    'mod+/',
    (event) => {
      event.preventDefault();
      setOpen(true);
    },
    { enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'] },
  );

  return (
    <>
      {children}
      <ShortcutHelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
