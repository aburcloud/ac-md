import React from 'react';
import { Tab } from '../types';
import {
  Plus,
  X,
  FileText,
  List,
  Search,
  FolderOpen,
  Settings as SettingsIcon,
  Columns,
  Eye,
  Save,
  LayoutSidebarLeft,
} from 'lucide-react';

export type LayoutMode = 'split' | 'preview' | 'editor';

interface UnifiedNavbarProps {
  tabs: Tab[];
  activeId: string | null;
  activeTab: Tab | null;
  layoutMode: LayoutMode;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onSelectLayout: (mode: LayoutMode) => void;
  onToggleTOC: () => void;
  onToggleFind: () => void;
  onToggleFileExplorer: () => void;
  isFileExplorerOpen: boolean;
  onOpenFile: () => void;
  onOpenWorkspace: () => void;
  onSaveFile: () => void;
  onOpenSettings: () => void;
}

export const UnifiedNavbar: React.FC<UnifiedNavbarProps> = ({
  tabs,
  activeId,
  activeTab,
  layoutMode,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onSelectLayout,
  onToggleTOC,
  onToggleFind,
  onOpenFile,
  onSaveFile,
  onOpenSettings,
}) => {
  return (
    <header className="h-12 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between select-none shrink-0 relative z-20">
      {/* Left 70%: Brand Icon + Tabs + New Tab */}
      <div className="w-[70%] flex items-end h-full px-2 overflow-x-auto gap-1">
        {/* Brand Icon Pill */}
        <div className="flex items-center gap-2 mb-2 mr-2 shrink-0 select-none">
          <div className="w-5 h-5 rounded bg-[var(--accent-muted)] text-[var(--accent)] font-bold text-xs flex items-center justify-center shadow-xs border border-[var(--accent-muted)]">
            A
          </div>
          <span className="font-bold text-xs text-[var(--text-primary)] tracking-tight hidden md:inline">
            AburMD
          </span>
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
              className={`group relative flex items-center h-[36px] max-w-[200px] min-w-[110px] px-3 rounded-t-sm text-xs cursor-pointer transition-all border-t border-x -mb-[1px] z-20 ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border)] border-b-[var(--bg-primary)] font-semibold after:content-[""] after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[2px] after:bg-[var(--bg-primary)] after:border-b after:border-[var(--bg-primary)] after:z-30'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] border-transparent font-medium'
              }`}
              title={tab.path || tab.title}
            >
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
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="flex items-center justify-center w-7 h-7 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors mb-1 ml-1 shrink-0"
          title="New tab (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right 30%: All Action Buttons */}
      <div className="w-[30%] flex items-center justify-end px-3 gap-2 h-full shrink-0">
        {/* Layout Mode Pills */}
        {activeTab && (
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] shadow-xs">
            <button
              onClick={() => onSelectLayout('split')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                layoutMode === 'split'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Split Editor & Live Preview"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Split</span>
            </button>
            <button
              onClick={() => onSelectLayout('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                layoutMode === 'preview'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Full Preview Reader"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Preview</span>
            </button>
            <button
              onClick={() => onSelectLayout('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                layoutMode === 'editor'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Full Source Editor"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Editor</span>
            </button>
          </div>
        )}

        <button
          onClick={onToggleTOC}
          className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Toggle Outline (Ctrl+Shift+T)"
        >
          <List className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onToggleFind}
          className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Find in document (Ctrl+F)"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onToggleFileExplorer}
          className={`p-2 rounded-md transition-colors ${
            isFileExplorerOpen
              ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          }`}
          title="Toggle File Explorer (Ctrl+Shift+E)"
        >
          <LayoutSidebarLeft className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onOpenFile}
          className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Open Document (Ctrl+O)"
        >
          <FolderOpen className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onOpenWorkspace}
          className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Open Workspace (Folder)"
        >
          <FolderOpen className="w-4.5 h-4.5" />
        </button>

        {activeTab && (
          <button
            onClick={onSaveFile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] text-xs font-semibold transition-colors shadow-xs"
            title="Save Document (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Settings & About"
        >
          <SettingsIcon className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};
