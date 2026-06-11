import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-foreground">{t('auth.productName')}</h1>
        </div>
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
