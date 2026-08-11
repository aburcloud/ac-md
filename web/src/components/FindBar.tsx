import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindBar: React.FC<FindBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Element[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      clearHighlights();
      setQuery('');
      setMatches([]);
      setCurrentIndex(-1);
    }
  }, [isOpen]);

  const clearHighlights = () => {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
  };

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    clearHighlights();

    if (!searchTerm.trim()) {
      setMatches([]);
      setCurrentIndex(-1);
      return;
    }

    const container = document.querySelector('.markdown-body');
    if (!container) return;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Node[] = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    const foundElements: Element[] = [];

    textNodes.forEach((node) => {
      if (node.nodeValue && regex.test(node.nodeValue)) {
        const parent = node.parentNode;
        if (!parent || parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE') return;

        const frag = document.createDocumentFragment();
        const parts = node.nodeValue.split(regex);

        parts.forEach((part) => {
          if (part.toLowerCase() === searchTerm.toLowerCase()) {
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = part;
            frag.appendChild(mark);
            foundElements.push(mark);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        });

        parent.replaceChild(frag, node);
      }
    });

    setMatches(foundElements);
    if (foundElements.length > 0) {
      setCurrentIndex(0);
      foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setCurrentIndex(-1);
    }
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    matches[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    matches[prevIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-6 z-30 flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border)] p-2 rounded-lg shadow-xl text-xs select-none animate-modal-in">
      <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-1 rounded-md w-64">
        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Find in document..."
          className="bg-transparent text-[var(--text-primary)] outline-none w-full text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'Enter') {
              if (e.shiftKey) handlePrev();
              else handleNext();
            }
          }}
        />
        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap font-mono">
          {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : '0/0'}
        </span>
      </div>

      <button
        onClick={handlePrev}
        className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleNext}
        className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        title="Next match (Enter)"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-1 transition-colors"
        title="Close search (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
