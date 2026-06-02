import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextItalic,
  TextStrikethrough,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';

export type RichTextEditorChangeMeta = {
  editor: Editor;
  plainText: string;
};

export type RichTextToolbarMode = 'email' | 'basic' | 'none';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string, meta: RichTextEditorChangeMeta) => void;
  placeholder?: string;
  minHeightClassName?: string;
  toolbar?: RichTextToolbarMode;
  extensions?: NonNullable<Parameters<typeof useEditor>[0]>['extensions'];
  editable?: boolean;
  className?: string;
  contentClassName?: string;
  'aria-label'?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write a message…',
  minHeightClassName = 'min-h-[10rem]',
  toolbar = 'email',
  extensions,
  editable = true,
  className,
  contentClassName,
  'aria-label': ariaLabel,
}: RichTextEditorProps) {
  const [version, setVersion] = useState(0);
  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      ...(extensions ?? []),
    ],
    [extensions, placeholder],
  );

  const editor = useEditor({
    extensions: editorExtensions,
    content: value,
    editable,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? placeholder,
        class: cn(
          'max-w-none outline-none',
          'text-sm leading-6 text-foreground',
          '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_blockquote]:my-2',
          '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-border/70 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
          '[&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          minHeightClassName,
        ),
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML(), {
        editor: nextEditor,
        plainText: nextEditor.getText().replace(/\s+/g, ' ').trim(),
      });
      setVersion((current) => current + 1);
    },
    onSelectionUpdate: () => setVersion((current) => current + 1),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  return (
    <div className={cn('overflow-hidden rounded-card border border-border/60 bg-card', className)}>
      {toolbar !== 'none' && editor ? (
        <RichTextToolbar editor={editor} mode={toolbar} version={version} />
      ) : null}
      <EditorContent
        editor={editor}
        className={cn(
          'min-w-0 px-3 py-2',
          toolbar !== 'none' && 'border-t border-border/50',
          contentClassName,
        )}
      />
    </div>
  );
}

function RichTextToolbar({
  editor,
  mode,
}: {
  editor: Editor;
  mode: Exclude<RichTextToolbarMode, 'none'>;
  version: number;
}) {
  const showBlocks = mode === 'email' || mode === 'basic';

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1 bg-muted/30 px-2 py-1">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextB size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Strike"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough size={14} />
      </ToolbarButton>

      {showBlocks ? <div className="mx-1 h-5 w-px bg-border/60" /> : null}

      {showBlocks ? (
        <>
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <ListBullets size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListNumbers size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quotes size={14} />
          </ToolbarButton>
        </>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <ArrowCounterClockwise size={14} />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <ArrowClockwise size={14} />
        </ToolbarButton>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? 'default' : 'ghost'}
      className={cn('h-7 w-7', active && 'bg-muted text-foreground')}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
