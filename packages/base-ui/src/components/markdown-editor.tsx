import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
} from '@phosphor-icons/react';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { Markdown, type MarkdownStorage } from 'tiptap-markdown';

import { cn } from '../lib/utils';
import { Button } from './button';

// tiptap-markdown registers `editor.storage.markdown` at runtime but does not
// augment Tiptap's Storage interface (and @tiptap/core is not a direct
// dependency here, so module augmentation can't target it). Read it through a
// typed helper instead.
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown();
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  contentClassName?: string;
  minHeightClassName?: string;
  'aria-label'?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  editable = true,
  className,
  contentClassName,
  minHeightClassName = 'min-h-[60vh]',
  'aria-label': ariaLabel,
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, horizontalRule: false }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? placeholder,
        class: cn(
          'max-w-none outline-none text-[0.95rem] leading-7 text-foreground',
          '[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold',
          '[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold',
          '[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold',
          '[&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3',
          '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-border/70 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
          '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm',
          '[&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          minHeightClassName,
        ),
      },
    },
    onUpdate: ({ editor: next }) => {
      onChange(getMarkdown(next));
    },
  });

  // Re-sync when the parent swaps the document (different file / loaded content).
  useEffect(() => {
    if (!editor) return;
    if (getMarkdown(editor) === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    // Only toggle when it actually changes — setEditable() dispatches a
    // transaction that would otherwise fire onUpdate on mount.
    if (!editor || editor.isEditable === editable) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {editor ? <MarkdownToolbar editor={editor} /> : null}
      <EditorContent
        editor={editor}
        className={cn('min-w-0 flex-1 overflow-y-auto px-1 py-3', contentClassName)}
      />
    </div>
  );
}

function MarkdownToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/50 pb-2">
      <ToolbarButton
        label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <TextHOne size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <TextHTwo size={16} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
        <TextB size={16} />
      </ToolbarButton>
      <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <TextItalic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough size={16} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBullets size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers size={16} />
      </ToolbarButton>
      <ToolbarButton label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quotes size={16} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <ArrowCounterClockwise size={16} />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <ArrowClockwise size={16} />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
      {children}
    </Button>
  );
}
