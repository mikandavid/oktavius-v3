import { cn, SettingsLayout, type SettingsLayoutProps } from '@oktavius/base-ui';

import { useRegisterSecondaryNav } from './AppShellLayoutContext';

/**
 * SettingsLayout wrapper that compacts the app sidebar while the section nav is visible.
 */
export function AppSectionNavLayout({ className, ...props }: SettingsLayoutProps) {
  useRegisterSecondaryNav();
  return <SettingsLayout {...props} className={cn('min-h-0 flex-1', className)} />;
}
