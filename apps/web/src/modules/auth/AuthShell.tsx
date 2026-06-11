import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';

const AUTH_BACKGROUND_TEMPLATES = {
  oktavius: 'auth-bg-oktavius',
  plain: 'bg-card',
} as const;

type AuthBackgroundTemplate = keyof typeof AUTH_BACKGROUND_TEMPLATES;

type AuthShellProps = {
  title: string;
  subtitle?: string;
  backgroundTemplate?: AuthBackgroundTemplate;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  backgroundTemplate = 'oktavius',
  children,
}: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden p-4 ${AUTH_BACKGROUND_TEMPLATES[backgroundTemplate]}`}
    >
      {backgroundTemplate === 'oktavius' ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="auth-bg-oktavius__aurora" />
          <div className="auth-bg-oktavius__ribbon" />
          <div className="auth-bg-oktavius__grid" />
          <div className="auth-bg-oktavius__flow" />
          <div className="auth-bg-oktavius__wash" />
        </div>
      ) : null}
      <div className="relative w-full max-w-sm">
        <Card className="rounded-card bg-card/90 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mb-5 flex min-w-0 items-center justify-center gap-2">
              <img
                src="/oktavius_shaded.svg"
                alt=""
                className="h-7 w-7 shrink-0"
                aria-hidden="true"
              />
              <p className="truncate text-sm font-semibold text-foreground">
                {t('auth.productName')}
              </p>
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {subtitle ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
