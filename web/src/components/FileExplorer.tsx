import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileTreeItem, Workspace } from '../types';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Plus, X, Search, Home, RefreshCw, MoreVertical } from 'lucide-react';

interface FileExplorerProps {
  workspace: Workspace | null;
  onFileClick: (path: string) => void;
  onNewFile: (dirPath: string) => void;
  onNewFolder: (dirPath: string) => void;
  onRefresh: () => void;
  onCloseWorkspace: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FILE_EXPLORER_WIDTH = 280;

export const FileExplorer: React.FC<FileExplorerProps> = ({
  workspace,
  onFileClick,
  onNewFile,
  onNewFolder,
  onRefresh,
  onCloseWorkspace,
  isOpen,
  onToggle,
}) => {
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load file tree when workspace changes
  useEffect(() => {
    if (workspace) {
      loadFileTree(workspace.path);
    } else {
      setFileTree([]);
    }
  }, [workspace]);

  const loadFileTree = async (rootPath: string) => {
    setIsLoading(true);
    try {
      // Use IPC to get file tree from Go backend
      if ((window as any).getFileTree) {
        const tree = await (window as any).getFileTree(rootPath);
        setFileTree(tree);
      } else {
        // Fallback for WebView2
        sendIPC({ action: 'get_file_tree', path: rootPath });
      }
    } catch (err) {
      console.error('Failed to load file tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for file tree updates from Go backend
  useEffect(() => {
    if ((window as any).onFileTreeUpdate) {
      const handler = (tree: FileTreeItem[]) => {
        setFileTree(tree);
        setIsLoading(false);
      };
      (window as any).onFileTreeUpdate = handler;
      return () => { (window as any).onFileTreeUpdate = null; };
    }
  }, []);

  const sendIPC = (msg: object) => {
    const json = JSON.stringify(msg);
    if ((window as any).postToGo) {
      (window as any).postToGo(json);
    } else if ((window as any).chrome?.webview) {
      (window as any).chrome.webview.postMessage(json);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const isExpanded = (path: string) => expandedFolders.has(path);

  const handleFileClick = (item: FileTreeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isDirectory) {
      onFileClick(item.path);
    } else {
      toggleFolder(item.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileTreeItem) => {
    e.preventDefault();
    e.stopPropagation();
    // Could add context menu here for rename, delete, etc.
  };

  const filterTree = (items: FileTreeItem[]): FileTreeItem[] => {
    if (!filter.trim()) return items;
    const lowerFilter = filter.toLowerCase();
    return items.filter(item => {
      const matches = item.name.toLowerCase().includes(lowerFilter);
      if (item.isDirectory && item.children) {
        const filteredChildren = filterTree(item.children);
        return matches || filteredChildren.length > 0;
      }
      return matches;
    });
  };

  const renderTree = (items: FileTreeItem[], depth: number = 0): React.ReactNode => {
    const filtered = filterTree(items);
    return filtered.map(item => (
      <FileTreeNode
        key={item.path}
        item={item}
        depth={depth}
        isExpanded={isExpanded(item.path)}
        onToggle={toggleFolder}
        onClick={handleFileClick}
        onContextMenu={handleContextMenu}
        onNewFile={onNewFile}
        onNewFolder={onNewFolder}
      />
    ));
  };

  return (
    <div
      className={`fixed top-0 left-0 bottom-12 bg-[var(--bg-surface)] border-r border-[var(--border)] z-40 transition-all duration-200 flex flex-col ${
        isOpen ? `w-[${FILE_EXPLORER_WIDTH}px]` : 'w-0 overflow-hidden'
      }`}
      style={{ display: isOpen || true ? 'flex' : 'none' }}
      ref={containerRef}
    >
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Close File Explorer"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="font-semibold text-xs text-[var(--text-primary)] truncate max-w-[180px]">
            {workspace?.name || 'No Workspace'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            title="Refresh (Ctrl+R)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onCloseWorkspace}
            className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Close Workspace"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search/Filter */}
      <div className="p-2 border-b border-[var(--border)] shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b border-[var(--border)] shrink-0 flex items-center gap-1">
        <button
          onClick={() => workspace && onNewFile(workspace.path)}
          className="flex-1 p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
          title="New File"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">New File</span>
        </button>
        <button
          onClick={() => workspace && onNewFolder(workspace.path)}
          className="flex-1 p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
          title="New Folder"
        >
          <Folder className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">New Folder</span>
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-4">
            <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm text-center">No workspace open</p>
            <p className="text-xs text-center opacity-70">Open a folder to browse files</p>
          </div>
        ) : (
          <div className="space-y-0.5">{renderTree(fileTree)}</div>
        )}
      </div>
    </div>
  );
};

interface FileTreeNodeProps {
  item: FileTreeItem;
  depth: number;
  isExpanded: boolean;
  onToggle: (path: string) => void;
  onClick: (item: FileTreeItem, e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, item: FileTreeItem) => void;
  onNewFile: (dirPath: string) => void;
  onNewFolder: (dirPath: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  item,
  depth,
  isExpanded,
  onToggle,
  onClick,
  onContextMenu,
  onNewFile,
  onNewFolder,
}) => {
  const hasChildren = item.isDirectory && item.children && item.children.length > 0;
  const indent = depth * 16;

  if (!item.isDirectory) {
    return (
      <div
        onClick={(e) => onClick(item, e)}
        onContextMenu={(e) => onContextMenu(e, item)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors group`}
        style={{ paddingLeft: `${12 + indent}px` }}
        title={item.path}
      >
        <FileText className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        <span className="truncate text-xs text-[var(--text-primary)]">{item.name}</span>
      </div>
    );
  }

  return (
    <div className="select-none">
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.path);
        }}
        onContextMenu={(e) => onContextMenu(e, item)}
        className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors group`}
        style={{ paddingLeft: `${12 + indent}px` }}
        title={item.path}
      >
        <span className="w-5 flex items-center justify-center">
          {hasChildren && (
            <span
              className={`inline-block transition-transform duration-150 text-[var(--text-muted)] ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </span>
        {isExpanded ? (
          <FolderOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        )}
        <span className="truncate text-xs font-medium text-[var(--text-primary)]">{item.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="overflow-hidden">
          {item.children!.map(child => (
            <FileTreeNode
              key={child.path}
              item={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onClick={onClick}
              onContextMenu={onContextMenu}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};