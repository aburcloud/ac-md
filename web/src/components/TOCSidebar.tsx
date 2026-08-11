import React from 'react';
import { TOCItem } from '../types';
import { X, List } from 'lucide-react';

interface TOCSidebarProps {
  items: TOCItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const TOCSidebar: React.FC<TOCSidebarProps> = ({ items, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col shrink-0 select-none">
      <div className="h-10 px-4 flex items-center justify-between border-b border-[var(--border)] font-semibold text-xs text-[var(--text-primary)]">
        <div className="flex items-center gap-2">
          <List className="w-3.5 h-3.5 opacity-70" />
          <span>Document Outline</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {items.length === 0 ? (
          <div className="p-4 text-xs text-[var(--text-muted)] text-center">
            No headings found in document.
          </div>
        ) : (
          items.map((item, idx) => (
            <a
              key={`${item.id}-${idx}`}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block px-4 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)] truncate transition-colors border-l-2 border-transparent hover:border-[var(--accent)] ${
                item.level === 1 ? 'font-semibold text-[var(--text-primary)]' : ''
              }`}
              style={{ paddingLeft: `${item.level * 12 + 4}px` }}
            >
              {item.text}
            </a>
          ))
        )}
      </nav>
    </aside>
  );
};
