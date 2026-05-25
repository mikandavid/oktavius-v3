/** Press scale for buttons, chips, and icon controls. */
export const pressableMicroClasses =
  'transition-[transform,colors,background-color,box-shadow,opacity] duration-150 ease-out active:scale-[0.97]';

/** Color transitions for surfaces without press scale (inputs, rows). */
export const surfaceMicroClasses = 'transition-colors duration-150 ease-out';

/** Row / list item press feedback. */
export const surfacePressMicroClasses =
  'transition-colors duration-150 ease-out active:bg-muted/70';

/** Brief success flash after a completed action (copy, save, etc.). */
export const successFeedbackClasses =
  'bg-success/10 text-success hover:bg-success/15 active:bg-success/20';

/** Popover / pill entrance. */
export const popoverEnterMicroClasses = 'animate-in fade-in-0 zoom-in-95 duration-150';
