import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '../types';
import { Save, Check } from 'lucide-react';

interface EditModeProps {
  tab: Tab;
  fontSize: number;
  readingWidth: number;
  onUpdateDraft: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditMode: React.FC<EditModeProps> = ({
  tab,
  fontSize,
  readingWidth,
  onUpdateDraft,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState(tab.draftContent || (tab.doc?.raw_content ?? ''));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(tab.draftContent || (tab.doc?.raw_content ?? ''));
  }, [tab.id, tab.draftContent, tab.doc]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onUpdateDraft(val);
  };

  // Synchronize Line Numbers scrolling with Textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Intercept Tab key to insert 2 spaces instead of shifting focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const newContent = val.substring(0, start) + '  ' + val.substring(end);
      setContent(newContent);
      onUpdateDraft(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lines = content.split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden">
      {/* Editor Header Bar */}
      <div className="h-10 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <span className="px-2 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)] font-semibold">
            EDITING
          </span>
          <span>{tab.title}</span>
          {tab.isDirty && <span className="text-[var(--accent)] font-bold">*</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!tab.isDirty && !!tab.path}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save (Ctrl+S)
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 flex overflow-hidden justify-center p-4">
        <div
          className="flex-1 flex border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] overflow-hidden shadow-inner"
          style={{ maxWidth: `${readingWidth}px` }}
        >
          {/* Synchronized Line Numbers Column */}
          <div
            ref={lineNumbersRef}
            className="w-12 bg-[var(--bg-primary)] border-r border-[var(--border)] py-4 text-right pr-3 select-none text-[var(--text-muted)] font-mono text-xs overflow-hidden shrink-0"
            style={{ fontSize: `${fontSize * 0.85}px` }}
          >
            {lines.map((_, i) => (
              <div key={i} className="leading-relaxed">{i + 1}</div>
            ))}
          </div>

          {/* Source Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            className="flex-1 p-4 bg-transparent text-[var(--text-primary)] font-mono outline-none resize-none leading-relaxed overflow-y-auto"
            style={{ fontSize: `${fontSize}px` }}
            placeholder="Type Markdown content here..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
