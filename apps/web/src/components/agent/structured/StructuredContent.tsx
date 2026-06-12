import { cn, Skeleton } from '@oktavius/base-ui';

import { FormattedText } from '@/components/common/FormattedText';

import { parseStructuredContent } from './parser';
import { isKnownOctTag, OctComponentRenderer } from './registry';

type StructuredContentProps = {
  text: string;
  className?: string;
};

export function StructuredContent({ text, className }: StructuredContentProps) {
  const segments = parseStructuredContent(text);

  if (segments.length === 1 && segments[0].type === 'text') {
    return <FormattedText text={segments[0].text} className={className} />;
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          if (!segment.text.trim()) return null;
          return <FormattedText key={`text-${index}`} text={segment.text} />;
        }
        if (segment.type === 'partial') {
          return (
            <div key={`partial-${index}`} className="my-1">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          );
        }
        if (!isKnownOctTag(segment.name)) return null;
        return (
          <OctComponentRenderer
            key={`tag-${index}`}
            name={segment.name}
            attrs={segment.attrs}
            body={segment.body}
          />
        );
      })}
    </div>
  );
}
