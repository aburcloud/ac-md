import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tab } from '../types';
import { marked } from 'marked';
import { Prose } from './Prose';

interface SinglePageWorkspaceProps {
  tab: Tab;
  fontSize: number;
  readingWidth: number;
  layoutMode: 'split' | 'preview' | 'editor';
  onUpdateDraft: (content: string) => void;
  onSave: () => void;
  onOpenExternal: (url: string) => void;
  onOpenRelative: (path: string) => void;
}

export const SinglePageWorkspace: React.FC<SinglePageWorkspaceProps> = ({
  tab,
  fontSize,
  readingWidth,
  layoutMode,
  onUpdateDraft,
  onSave,
  onOpenExternal,
  onOpenRelative,
}) => {
  const [content, setContent] = useState(tab.draftContent || (tab.doc?.raw_content ?? ''));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(tab.draftContent || (tab.doc?.raw_content ?? ''));
  }, [tab.id, tab.draftContent, tab.doc]);

  // Real-time Client-Side GFM Live Render
  const liveRenderedHTML = useMemo(() => {
    if (tab.doc?.rendered_html && content === tab.doc.raw_content) {
      return tab.doc.rendered_html;
    }
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return content;
    }
  }, [content, tab.doc]);

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

  // Handle Tab key (2 spaces) & Ctrl+S shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      onSave();
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
    <div className="flex-1 flex h-full w-full bg-[var(--bg-primary)] overflow-hidden">
      {/* Editor Pane (Shown in 'split' or 'editor' layout) */}
      {(layoutMode === 'split' || layoutMode === 'editor') && (
        <div className={`flex-1 flex overflow-hidden p-4 ${layoutMode === 'split' ? 'border-r border-[var(--border)]' : ''}`}>
          <div
            className="flex-1 flex border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] overflow-hidden shadow-inner mx-auto"
            style={{ maxWidth: layoutMode === 'editor' ? `${readingWidth}px` : '100%' }}
          >
            {/* Synchronized Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="w-12 bg-[var(--bg-primary)] border-r border-[var(--border)] p-4 text-right pr-3 select-none text-[var(--text-muted)] font-mono leading-relaxed overflow-hidden shrink-0"
              style={{ fontSize: `${fontSize}px` }}
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
              placeholder="Type Markdown content here... Live preview will render on the right."
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Live Preview Pane (Shown in 'split' or 'preview' layout) */}
      {(layoutMode === 'split' || layoutMode === 'preview') && (
        <div
          onClick={() => {
            if (layoutMode === 'split') textareaRef.current?.focus();
          }}
          className="flex-1 overflow-y-auto p-8 flex flex-col items-center cursor-text select-text"
        >
          <Prose
            html={liveRenderedHTML}
            fontSize={fontSize}
            readingWidth={readingWidth}
            onOpenExternal={onOpenExternal}
            onOpenRelative={onOpenRelative}
          />
        </div>
      )}
    </div>
  );
};
