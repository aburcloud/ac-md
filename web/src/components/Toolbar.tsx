import React from 'react';
import { Tab } from '../types';
import {
  List,
  Search,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  Settings as SettingsIcon,
  Columns,
  Eye,
  FileText,
  Save,
} from 'lucide-react';

export type LayoutMode = 'split' | 'preview' | 'editor';

interface ToolbarProps {
  activeTab: Tab | null;
  zoomLevel: number;
  layoutMode: LayoutMode;
  onSelectLayout: (mode: LayoutMode) => void;
  onToggleTOC: () => void;
  onToggleFind: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onOpenSettings: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTab,
  zoomLevel,
  layoutMode,
  onSelectLayout,
  onToggleTOC,
  onToggleFind,
  onZoomIn,
  onZoomOut,
  onOpenFile,
  onSaveFile,
  onOpenSettings,
}) => {
  return (
    <header className="h-12 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 flex items-center justify-between select-none shrink-0">
      {/* Left controls: TOC Outline & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleTOC}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Toggle Outline (Ctrl+Shift+T)"
        >
          <List className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 font-semibold text-sm text-[var(--text-primary)] truncate max-w-[300px]">
          <span className="truncate">{activeTab ? activeTab.title : 'AburMD'}</span>
          {activeTab?.isDirty && <span className="text-[var(--accent)] font-bold">*</span>}
        </div>
      </div>

      {/* Center: Layout View Selector Pills */}
      {activeTab && (
        <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] shadow-xs">
          <button
            onClick={() => onSelectLayout('split')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              layoutMode === 'split'
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Split Editor & Live Preview"
          >
            <Columns className="w-3.5 h-3.5" />
            Split
          </button>
          <button
            onClick={() => onSelectLayout('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              layoutMode === 'preview'
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Full Preview Reader"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => onSelectLayout('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              layoutMode === 'editor'
                ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Full Source Editor"
          >
            <FileText className="w-3.5 h-3.5" />
            Editor
          </button>
        </div>
      )}

      {/* Right controls: Find, Zoom, Open, Save, Settings */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleFind}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Find in document (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-[var(--text-muted)] min-w-[36px] text-center font-mono">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        <button
          onClick={onOpenFile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border)] text-xs font-semibold transition-colors border border-[var(--border)] shadow-xs"
          title="Open Document (Ctrl+O)"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Open
        </button>

        {activeTab && (
          <button
            onClick={onSaveFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] text-xs font-semibold transition-colors shadow-sm"
            title="Save Document (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors ml-1"
          title="Settings & About"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
