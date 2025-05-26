import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = 'Start writing your notes...',
  className,
  minHeight = '200px',
  maxLength = 10000,
  showCharacterCount = true,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'ordered-list',
        },
      }),
      ListItem,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'prose-headings:text-foreground prose-p:text-foreground',
          'prose-strong:text-foreground prose-em:text-foreground',
          'prose-blockquote:text-muted-foreground prose-blockquote:border-l-border',
          'prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground',
          'prose-code:text-foreground prose-pre:bg-muted',
          className
        ),
        style: `min-height: ${minHeight}; padding: 16px;`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children, 
    title 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 p-0 text-muted-foreground hover:text-foreground",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2">
        <div className="flex items-center space-x-1 flex-wrap gap-1">
          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <span className="text-xs font-bold">H1</span>
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <span className="text-xs font-bold">H2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <span className="text-xs font-bold">H3</span>
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="prose-editor-content focus-within:ring-1 focus-within:ring-ring"
        />
      </div>

      {/* Character Count */}
      {showCharacterCount && (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {editor.storage.characterCount.characters()} / {maxLength} characters
            </span>
            <span>
              {editor.storage.characterCount.words()} words
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom styles for the editor
export const RichTextEditorStyles = () => (
  <style jsx global>{`
    .prose-editor-content .ProseMirror {
      outline: none;
    }
    
    .prose-editor-content .ProseMirror p.is-editor-empty:first-child::before {
      color: hsl(var(--muted-foreground));
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }
    
    .prose-editor-content .bullet-list {
      list-style-type: disc;
      margin-left: 1rem;
      padding-left: 0.5rem;
    }
    
    .prose-editor-content .ordered-list {
      list-style-type: decimal;
      margin-left: 1rem;
      padding-left: 0.5rem;
    }
    
    .prose-editor-content .bullet-list li,
    .prose-editor-content .ordered-list li {
      margin: 0.25rem 0;
    }
    
    .prose-editor-content blockquote {
      border-left: 4px solid hsl(var(--border));
      padding-left: 1rem;
      margin: 1rem 0;
      font-style: italic;
      color: hsl(var(--muted-foreground));
    }
    
    .prose-editor-content h1 {
      font-size: 1.875rem;
      font-weight: 700;
      line-height: 2.25rem;
      margin: 1.5rem 0 1rem 0;
    }
    
    .prose-editor-content h2 {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 2rem;
      margin: 1.25rem 0 0.75rem 0;
    }
    
    .prose-editor-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.75rem;
      margin: 1rem 0 0.5rem 0;
    }
    
    .prose-editor-content p {
      margin: 0.75rem 0;
      line-height: 1.6;
    }
    
    .prose-editor-content mark {
      background-color: #fef08a;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
    }
  `}</style>
);