import { useMemo } from 'react';

import { cn } from '@oktavius/base-ui';

import { sanitizeEmailHtml } from './sanitizeEmailHtml';

type EmailMessageBodyHtmlProps = {
  bodyHtml: string;
  className?: string;
};

const PROSE_CLASS =
  'text-sm leading-6 text-foreground ' +
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 ' +
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ' +
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_li]:my-0.5 ' +
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground ' +
  '[&_strong]:font-semibold [&_em]:italic ' +
  '[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-sm';

export function EmailMessageBodyHtml({ bodyHtml, className }: EmailMessageBodyHtmlProps) {
  const safe = useMemo(() => sanitizeEmailHtml(bodyHtml), [bodyHtml]);
  return <div className={cn(PROSE_CLASS, className)} dangerouslySetInnerHTML={{ __html: safe }} />;
}
