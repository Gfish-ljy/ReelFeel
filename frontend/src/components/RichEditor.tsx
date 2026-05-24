import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from './ui/Button';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageSelect?: (files: File[]) => void;
  placeholder?: string;
}

export function RichEditor({
  content,
  onChange,
  onImageSelect,
  placeholder = '写下今天的故事...',
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (files.length && onImageSelect) onImageSelect(files);
    };
    input.click();
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg bg-white">
      <div className="flex gap-1 p-2 border-b">
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleImageUpload}>
          <ImagePlus className="w-4 h-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}
