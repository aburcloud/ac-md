import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface ProseProps {
  html: string;
  fontSize?: number;
  readingWidth?: number;
  onOpenExternal?: (url: string) => void;
  onOpenRelative?: (path: string) => void;
}

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

export const Prose: React.FC<ProseProps> = ({
  html,
  fontSize = 16,
  readingWidth = 900,
  onOpenExternal,
  onOpenRelative,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process Callouts, Mermaid Diagrams, Syntax Highlighting, Links, and Copy Buttons
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Process GitHub Alerts / Callouts (> [!NOTE], > [!TIP], etc.)
    const blockquotes = container.querySelectorAll('blockquote');
    blockquotes.forEach((bq) => {
      const text = bq.innerHTML.trim();
      const match = text.match(/^<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      if (match) {
        const type = match[1].toUpperCase();
        bq.classList.add('gfm-alert', `gfm-alert-${type.toLowerCase()}`);
        bq.innerHTML = bq.innerHTML.replace(
          /^<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i,
          `<div className="gfm-alert-title font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider mb-1.5">${type}</div><p>`
        );
      }
    });

    // 2. Render Mermaid Diagrams
    const mermaidNodes = container.querySelectorAll('pre code.language-mermaid, pre.language-mermaid');
    mermaidNodes.forEach((node, index) => {
      const parent = node.closest('pre') || (node as HTMLElement);
      const codeText = node.textContent || '';
      if (!codeText.trim()) return;

      const diagramId = `mermaid-svg-${Date.now()}-${index}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-diagram-container flex justify-center my-6 overflow-x-auto p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xs';
      
      parent.replaceWith(wrapper);

      try {
        mermaid.render(diagramId, codeText).then(({ svg }) => {
          wrapper.innerHTML = svg;
        }).catch((err) => {
          console.warn('[Mermaid Error]', err);
          wrapper.innerHTML = `<pre className="text-xs text-red-400 p-2 font-mono">${codeText}</pre>`;
        });
      } catch (err) {
        wrapper.innerHTML = `<pre className="text-xs text-red-400 p-2 font-mono">${codeText}</pre>`;
      }
    });

    // 3. Highlight Syntax in Code Blocks (Go, JS, TS, Python, HTML, CSS, C++, Rust, JSON, Bash, etc.)
    const codeElements = container.querySelectorAll('pre code');
    codeElements.forEach((codeEl) => {
      const el = codeEl as HTMLElement;
      if (el.classList.contains('language-mermaid') || el.dataset.highlighted === 'yes') return;
      try {
        hljs.highlightElement(el);
      } catch (err) {
        console.warn('[HLJS Warning]', err);
      }
    });

    // 4. Intercept Links (Anchor, External, Relative)
    const links = container.querySelectorAll('a');
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
          if (onOpenExternal) onOpenExternal(href);
        } else if (href.endsWith('.md') || href.endsWith('.markdown') || href.includes('.md#')) {
          e.preventDefault();
          if (onOpenRelative) onOpenRelative(href);
        }
      };
    });

    // 5. Code Block Copy Buttons
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
      if (pre.querySelector('.code-copy-btn') || pre.classList.contains('mermaid-diagram-container')) return;

      const button = document.createElement('button');
      button.className =
        'code-copy-btn absolute top-3 right-3 p-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all opacity-0 group-hover:opacity-100 border border-[var(--border)] shadow-xs cursor-pointer';
      button.title = 'Copy code snippet';
      button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;

      pre.style.position = 'relative';
      pre.classList.add('group');

      button.onclick = (e) => {
        e.stopPropagation();
        const codeText = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText);
        button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--accent)"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        setTimeout(() => {
          button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
        }, 2000);
      };

      pre.appendChild(button);
    });
  }, [html, onOpenExternal, onOpenRelative]);

  return (
    <article
      ref={containerRef}
      className="markdown-body prose-container w-full animate-live-writing"
      style={{
        maxWidth: `${readingWidth}px`,
        fontSize: `${fontSize}px`,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
