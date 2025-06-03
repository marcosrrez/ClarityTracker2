import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';

interface CustomRichEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onEditorReady?: (editor: any) => void;
}

export const CustomRichEditor = ({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '500px',
  onEditorReady,
}: CustomRichEditorProps) => {
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none ${className}`,
        style: `min-height: ${minHeight}; padding: 0; font-family: Charter, "Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, "Source Serif Pro", serif; font-size: 18px; line-height: 1.75; color: rgb(31, 41, 55); font-weight: 400; letter-spacing: 0.015em;`,
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      editorRef.current = editor;
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  return (
    <div className="w-full h-full border-none bg-transparent">
      <EditorContent 
        editor={editor} 
        className="w-full h-full prose-editor-content"
        style={{
          fontFamily: 'Charter, "Iowan Old Style", "Apple Garamond", Baskerville, serif',
        }}
      />
    </div>
  );
};