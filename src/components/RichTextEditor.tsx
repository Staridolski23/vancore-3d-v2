'use client';

import { useRef, useEffect } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    handleInput();
  };

  const applyBlock = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('formatBlock', false, tag);
    handleInput();
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 text-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-1.5">
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="h-8 px-2 rounded hover:bg-white/10 text-sm font-bold" title="Bold">B</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="h-8 px-2 rounded hover:bg-white/10 text-sm italic" title="Italic">I</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="h-8 px-2 rounded hover:bg-white/10 text-sm underline" title="Underline">U</button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => applyBlock('h2')} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Heading">H2</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => applyBlock('h3')} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Subheading">H3</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => applyBlock('p')} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Paragraph">P</button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Bullet list">• List</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Numbered list">1. List</button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => {
          const url = prompt('Въведи URL');
          if (url) document.execCommand('createLink', false, url);
          handleInput();
        }} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Link">🔗</button>
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => {
          document.execCommand('unlink');
          handleInput();
        }} className="h-8 px-2 rounded hover:bg-white/10 text-sm" title="Remove link">🔗❌</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[140px] max-h-[420px] overflow-y-auto px-3 py-2 outline-none text-sm leading-relaxed"
        data-placeholder={placeholder}
        style={{ empty: 'before:content-[attr(data-placeholder)] before:text-gray-500 before:pointer-events-none' } as any}
      />
    </div>
  );
}
