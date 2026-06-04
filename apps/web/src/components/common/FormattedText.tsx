import { cn } from '@oktavius/base-ui';

type FormattedTextProps = {
  text: string;
  className?: string;
};

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const MENTION_PATTERN = /(^|\s)@([\w.-]+)/g;

/** Renders plain text with clickable links and highlighted @mentions. */
export function FormattedText({ text, className }: FormattedTextProps) {
  if (!text.trim()) return null;

  const parts: Array<{ kind: 'text' | 'url' | 'mention'; value: string; mention?: string }> = [];
  let cursor = 0;

  const combined = [...text.matchAll(URL_PATTERN), ...text.matchAll(MENTION_PATTERN)].sort(
    (left, right) => (left.index ?? 0) - (right.index ?? 0),
  );

  for (const match of combined) {
    const index = match.index ?? 0;
    if (index < cursor) continue;

    if (index > cursor) {
      parts.push({ kind: 'text', value: text.slice(cursor, index) });
    }

    if (match[0].startsWith('http')) {
      parts.push({ kind: 'url', value: match[0] });
      cursor = index + match[0].length;
      continue;
    }

    const leading = match[1] ?? '';
    const mention = match[2] ?? '';
    if (leading) {
      parts.push({ kind: 'text', value: leading });
    }
    parts.push({ kind: 'mention', value: `@${mention}`, mention });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) {
    parts.push({ kind: 'text', value: text.slice(cursor) });
  }

  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {parts.map((part, index) => {
        if (part.kind === 'url') {
          return (
            <a
              key={`${part.value}-${index}`}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {part.value}
            </a>
          );
        }

        if (part.kind === 'mention') {
          return (
            <span
              key={`${part.value}-${index}`}
              className="rounded-control bg-cta/10 px-1 py-0.5 font-medium text-cta"
            >
              {part.value}
            </span>
          );
        }

        return <span key={`${part.value}-${index}`}>{part.value}</span>;
      })}
    </span>
  );
}

export function extractMentionHandles(text: string) {
  return [...text.matchAll(/@([\w.-]+)/g)].map((match) => match[1]).filter(Boolean);
}
