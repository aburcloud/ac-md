import React from 'react';
import { Tab, Workspace } from '../types';
import { Eye, Edit3, ShieldCheck, Clock, FolderOpen } from 'lucide-react';

interface StatusBarProps {
  activeTab: Tab | null;
  workspace: Workspace | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeTab, workspace }) => {
  const content = activeTab?.draftContent || (activeTab?.doc?.raw_content || '');
  
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <footer className="h-7 bg-[var(--bg-surface)] border-t border-[var(--border)] px-4 flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none shrink-0 font-medium">
      {/* Left: Mode Badge & File Path */}
      <div className="flex items-center gap-3 truncate">
        {activeTab ? (
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)] font-semibold text-[10px]">
            {activeTab.mode === 'VIEW' ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            <span>{activeTab.mode}</span>
          </div>
        ) : (
          <span className="text-[var(--text-muted)] opacity-60">Ready</span>
        )}

        <span className="truncate max-w-[400px]">
          {activeTab?.path ? activeTab.path : activeTab ? activeTab.title : 'AburMD'}
        </span>
        
        {workspace && (
          <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] font-medium text-[10px] border border-[var(--border)]">
            <FolderOpen className="w-3 h-3" />
            <span>{workspace.name}</span>
          </span>
        )}
      </div>

      {/* Right: Notebook Metrics, Reading Time, Encoding, Privacy */}
      <div className="flex items-center gap-4 shrink-0">
        {activeTab && (
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
            <span>{lineCount} lines</span>
            <span className="flex items-center gap-1 text-[var(--text-primary)] font-semibold">
              <Clock className="w-3 h-3 opacity-70" />
              {readTimeMin} min read
            </span>
          </div>
        )}

        <div className="w-[1px] h-3 bg-[var(--border)]" />

        <span>UTF-8</span>

        <div className="flex items-center gap-1 text-[var(--accent)] font-semibold">
          <ShieldCheck className="w-3 h-3" />
          <span>Local & Secured</span>
        </div>
      </div>
    </footer>
  );
};
