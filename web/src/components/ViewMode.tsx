import React, { useEffect, useRef, useState } from 'react';
import { Tab } from '../types';
import { Edit3, Copy, Check } from 'lucide-react';

interface ViewModeProps {
  tab: Tab;
  fontSize: number;
  readingWidth: number;
  onEnterEdit: () => void;
  onOpenExternal: (url: string) => void;
  onOpenRelative: (path: string) => void;
}

export const ViewMode: React.FC<ViewModeProps> = ({
  tab,
  fontSize,
  readingWidth,
  onEnterEdit,
  onOpenExternal,
  onOpenRelative,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Intercept link clicks
    const links = containerRef.current.querySelectorAll('a');
    links.forEach((link) => {
      link.onclick = (e) => {
        const href = link.getAttribute('href');
        if (!href) return;
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.getElementById(href.substring(1));
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
          e.preventDefault();
          onOpenExternal(href);
        } else if (href.endsWith('.md') || href.endsWith('.markdown') || href.includes('.md#')) {
          e.preventDefault();
          onOpenRelative(href);
        }
      };
    });

    // Inject Copy Buttons into pre code blocks
    const preBlocks = containerRef.current.querySelectorAll('pre');
    preBlocks.forEach((pre, index) => {
      if (pre.querySelector('.code-copy-btn')) return; // already injected

      const button = document.createElement('button');
      button.className =
        'code-copy-btn absolute top-3 right-3 p-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all opacity-0 group-hover:opacity-100 border border-[var(--border)] shadow-sm';
      button.title = 'Copy code snippet';
      button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;

      pre.style.position = 'relative';
      pre.classList.add('group');

      button.onclick = () => {
        const codeText = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText);
        setCopiedIndex(index);
        button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--accent)"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
        }, 2000);
      };

      pre.appendChild(button);
    });
  }, [tab.doc?.rendered_html, onOpenExternal, onOpenRelative]);

  if (!tab.doc) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--text-muted)]">
        No document content available.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative p-8 flex flex-col items-center">
      {/* Floating Action Button for EDIT mode */}
      <div className="fixed bottom-10 right-8 z-20">
        <button
          onClick={onEnterEdit}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] text-xs font-semibold rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95"
          title="Switch active tab to Edit Mode"
        >
          <Edit3 className="w-4 h-4" />
          Edit Document
        </button>
      </div>

      <article
        ref={containerRef}
        className="markdown-body w-full"
        style={{
          maxWidth: `${readingWidth}px`,
          fontSize: `${fontSize}px`,
        }}
        dangerouslySetInnerHTML={{ __html: tab.doc.rendered_html }}
      />
    </div>
  );
};
