import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as React from 'react';

import { cn } from '../lib/utils';

export type RichTextEditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write notes…',
  disabled = false,
  className,
  minHeight = '8rem',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none px-3 py-2 text-sm text-foreground [&_p]:my-1.5',
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={cn(
        'rounded-control border border-border/60 bg-muted/30 transition-colors focus-within:border-primary/30',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
      style={{ minHeight }}
    >
      <EditorContent editor={editor} className="min-h-[inherit]" />
    </div>
  );
}
