import React from 'react';
import { Tab } from '../types';
import { Plus, X, FileText } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div className="flex items-center h-10 bg-[var(--bg-surface)] border-b border-[var(--border)] px-3 overflow-x-auto select-none gap-1 shrink-0">
      {/* Brand Icon Pill */}
      <div className="flex items-center gap-2 mr-2 shrink-0 select-none">
        <div className="w-5 h-5 rounded-md bg-[var(--accent-muted)] text-[var(--accent)] font-bold text-xs flex items-center justify-center shadow-xs border border-[var(--accent-muted)]">
          A
        </div>
        <span className="font-bold text-xs text-[var(--text-primary)] tracking-tight hidden sm:inline">
          AburMD
        </span>
        <div className="w-[1px] h-4 bg-[var(--border)] ml-1" />
      </div>

      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                onCloseTab(tab.id);
              }
            }}
            className={`group relative flex items-center h-8 max-w-[220px] min-w-[120px] px-3 rounded-t-md text-xs cursor-pointer transition-all border-t border-x ${
              isActive
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] font-semibold border-b-transparent shadow-xs'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-transparent font-medium'
            }`}
            title={tab.path || tab.title}
          >
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] rounded-t-md" />
            )}
            <FileText className="w-3.5 h-3.5 mr-2 shrink-0 opacity-70" />
            <span className="truncate flex-1">
              {tab.title}
              {tab.isDirty && <span className="ml-1 text-[var(--accent)] font-bold">*</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="ml-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
              title="Close tab (Ctrl+W)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <button
        onClick={onNewTab}
        className="flex items-center justify-center w-7 h-7 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors ml-1 shrink-0"
        title="New tab (Ctrl+T)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
