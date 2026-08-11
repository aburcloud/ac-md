import React, { useState, useEffect } from 'react';
import { Tab, AppSettings, Workspace, FileTreeItem, Frontmatter } from './types';
import { UnifiedNavbar, LayoutMode } from './components/UnifiedNavbar';
import { SinglePageWorkspace } from './components/SinglePageWorkspace';
import { TOCSidebar } from './components/TOCSidebar';
import { FindBar } from './components/FindBar';
import { SettingsModal } from './components/SettingsModal';
import { UnsavedDialog } from './components/UnsavedDialog';
import { StatusBar } from './components/StatusBar';
import { FileExplorer } from './components/FileExplorer';
import { Upload, FolderOpen, Save as SaveIcon } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accent: 'orange',
  openLinksExternal: true,
  renderRawHTML: false,
  showOutline: true,
  restoreSession: true,
  fontSize: 16,
  readingWidth: 900,
  showFileExplorer: true,
  autoSave: true,
  notebookMode: false,
};

const SETTINGS_STORAGE_KEY = 'aburmd_settings';

const sendIPC = (msg: object) => {
  const json = JSON.stringify(msg);
  if ((window as any).postToGo) {
    (window as any).postToGo(json);
  } else if ((window as any).chrome?.webview) {
    (window as any).chrome.webview.postMessage(json);
  }
};

// Helper to extract top H1/H2 header title from Markdown content
const extractMarkdownTitle = (content: string, path: string, fallback: string): string => {
  if (content && content.trim()) {
    const match = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  }
  if (path) {
    const parts = path.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    if (filename) return filename;
  }
  return fallback;
};

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('preview');
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Settings with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // UI Drawer states
  const [isTOCOpen, setIsTOCOpen] = useState<boolean>(true);
  const [isFindOpen, setIsFindOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState<boolean>(true);

  // Workspace state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Unsaved confirmation state
  const [pendingCloseTabId, setPendingCloseTabId] = useState<string | null>(null);

  // Apply Theme and Accent attributes to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }
    root.setAttribute('data-accent', settings.accent);
  }, [settings.theme, settings.accent]);

  // Synchronize OS Window Title with Active Tab Display Title
  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  useEffect(() => {
    if (activeTab) {
      document.title = `${activeTab.title} - AburMD`;
      sendIPC({ action: 'set_title', title: `${activeTab.title} - AburMD` });
    } else {
      document.title = 'AburMD';
      sendIPC({ action: 'set_title', title: 'AburMD' });
    }
  }, [activeTabId, activeTab?.title]);

  // IPC Bridge listener from Go host & ready signal
  useEffect(() => {
    (window as any).renderDocument = (doc: any) => {
      openDocInTab(doc);
    };
    (window as any).showEmptyState = () => {
      setTabs((currentTabs) => {
        if (currentTabs.length === 0) {
          const newId = `tab-${Date.now()}`;
          const fallbackTitle = 'Untitled-1.md';
          const newTab: Tab = {
            id: newId,
            path: '',
            title: fallbackTitle,
            doc: null,
            mode: 'EDIT',
            isDirty: false,
            draftContent: '',
            scrollTop: 0,
          };
          setActiveTabId(newId);
          setLayoutMode('split');
          return [newTab];
        }
        return currentTabs;
      });
    };

    // File tree update handler
    (window as any).onFileTreeUpdate = (tree: FileTreeItem[]) => {
      setFileTree(tree);
    };

    // Workspace loaded handler
    (window as any).onWorkspaceLoaded = (ws: Workspace) => {
      setWorkspace(ws);
    };

    sendIPC({ action: 'ready' });
  }, []);

  const createNewTab = (doc: any = null) => {
    const newId = `tab-${Date.now()}`;
    const fallbackTitle = doc?.name || `Untitled-${tabs.length + 1}.md`;
    const title = extractMarkdownTitle(doc?.raw_content || '', doc?.path || '', fallbackTitle);
    const newTab: Tab = {
      id: newId,
      path: doc?.path || '',
      title: title,
      doc: doc,
      mode: 'VIEW',
      isDirty: !doc,
      draftContent: doc?.raw_content || '',
      scrollTop: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setLayoutMode(doc ? 'preview' : 'split');
  };

  const openDocInTab = (doc: any) => {
    const fallbackTitle = doc.name || 'Document.md';
    const title = extractMarkdownTitle(doc.raw_content || '', doc.path || '', fallbackTitle);

    setTabs((prevTabs) => {
      const existing = prevTabs.find((t) => (t.path && t.path === doc.path) || t.title === title);
      if (existing) {
        setActiveTabId(existing.id);
        setLayoutMode('preview');
        return prevTabs.map((t) =>
          t.id === existing.id
            ? { ...t, path: doc.path, title: title, doc, draftContent: doc.raw_content, isDirty: false }
            : t
        );
      }
      const newId = `tab-${Date.now()}`;
      const newTab: Tab = {
        id: newId,
        path: doc.path || '',
        title: title,
        doc: doc,
        mode: 'VIEW',
        isDirty: false,
        draftContent: doc.raw_content || '',
        scrollTop: 0,
      };
      setActiveTabId(newId);
      setLayoutMode('preview');
      return [...prevTabs, newTab];
    });
  };

  // Workspace management functions
  const openWorkspace = (path: string) => {
    sendIPC({ action: 'open_workspace', path });
  };

  const closeWorkspace = () => {
    setWorkspace(null);
    setFileTree([]);
    setExpandedFolders(new Set());
  };

  const handleNewFile = (dirPath: string) => {
    sendIPC({ action: 'new_file', path: dirPath });
  };

  const handleNewFolder = (dirPath: string) => {
    sendIPC({ action: 'new_folder', path: dirPath });
  };

  const handleRefreshFileTree = () => {
    if (workspace) {
      sendIPC({ action: 'refresh_file_tree', path: workspace.path });
    }
  };

  const handleFileClick = (path: string) => {
    sendIPC({ action: 'open_file', path });
  };

  const handleCloseTab = (id: string) => {
    const tabToClose = tabs.find((t) => t.id === id);
    if (!tabToClose) return;

    if (tabToClose.isDirty) {
      setPendingCloseTabId(id);
    } else {
      forceCloseTab(id);
    }
  };

  const forceCloseTab = (id: string) => {
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      if (newTabs.length > 0) {
        const nextIdx = Math.min(idx, newTabs.length - 1);
        setActiveTabId(newTabs[nextIdx].id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  const handleUpdateDraft = (id: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const original = t.doc?.raw_content || '';
          const fallback = t.path ? extractMarkdownTitle('', t.path, 'Document.md') : 'Untitled.md';
          const newTitle = extractMarkdownTitle(content, t.path, fallback);
          return {
            ...t,
            title: newTitle,
            draftContent: content,
            isDirty: content !== original,
          };
        }
        return t;
      })
    );
  };

  const handleSaveTab = (id: string) => {
    const target = tabs.find((t) => t.id === id);
    if (!target) return;

    sendIPC({
      action: 'save_file',
      path: target.path,
      content: target.draftContent,
    });

    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDirty: false } : t))
    );
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const raw = evt.target?.result as string;
            createNewTab({
              path: file.name,
              name: file.name,
              dir: '',
              raw_content: raw,
              rendered_html: `<pre><code>${raw}</code></pre>`,
              table_of_contents: [],
            });
          };
          reader.readAsText(file);
        }
      });
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        createNewTab();
      } else if (e.ctrlKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (activeTabId) handleSaveTab(activeTabId);
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'Tab' || e.key === 'ISO_Left_Tab')) {
        e.preventDefault();
        if (tabs.length > 1 && activeTabId) {
          const idx = tabs.findIndex((t) => t.id === activeTabId);
          const prevIdx = (idx - 1 + tabs.length) % tabs.length;
          setActiveTabId(tabs[prevIdx].id);
        }
      } else if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (tabs.length > 1 && activeTabId) {
          const idx = tabs.findIndex((t) => t.id === activeTabId);
          const nextIdx = (idx + 1) % tabs.length;
          setActiveTabId(tabs[nextIdx].id);
        }
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        setIsTOCOpen((prev) => !prev);
      } else if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsFindOpen(true);
      } else if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        sendIPC({ action: 'open_dialog' });
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        setIsFileExplorerOpen((prev) => !prev);
      } else if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleRefreshFileTree();
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        sendIPC({ action: 'export_pdf' });
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        sendIPC({ action: 'export_html' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs, workspace]);

  const pendingCloseTab = tabs.find((t) => t.id === pendingCloseTabId);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-[var(--bg-primary)] overflow-hidden relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-[var(--accent)] border-4 border-dashed border-[var(--accent)] rounded-xl m-4 select-none">
          <Upload className="w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-1">Drop Markdown Files Here</h2>
          <p className="text-sm text-[var(--text-muted)]">AburMD will open your files in new tabs.</p>
        </div>
      )}

      {/* File Explorer Sidebar */}
      <FileExplorer
        workspace={workspace}
        onFileClick={handleFileClick}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onRefresh={handleRefreshFileTree}
        onCloseWorkspace={closeWorkspace}
        isOpen={isFileExplorerOpen && settings.showFileExplorer}
        onToggle={() => setIsFileExplorerOpen((prev) => !prev)}
      />

      {/* Single Unified Header Navbar (Left 70% Tabs, Right 30% Actions) */}
      <UnifiedNavbar
        tabs={tabs}
        activeId={activeTabId}
        activeTab={activeTab}
        layoutMode={layoutMode}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab()}
        onSelectLayout={setLayoutMode}
        onToggleTOC={() => setIsTOCOpen((prev) => !prev)}
        onToggleFind={() => setIsFindOpen((prev) => !prev)}
        onToggleFileExplorer={() => setIsFileExplorerOpen((prev) => !prev)}
        isFileExplorerOpen={isFileExplorerOpen}
        onOpenFile={() => sendIPC({ action: 'open_dialog' })}
        onOpenWorkspace={() => sendIPC({ action: 'open_workspace_dialog' })}
        onSaveFile={() => activeTabId && handleSaveTab(activeTabId)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* In-Document Search Overlay */}
      <FindBar isOpen={isFindOpen} onClose={() => setIsFindOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TOC Sidebar */}
        <TOCSidebar
          items={activeTab?.doc?.table_of_contents || []}
          isOpen={isTOCOpen && !!activeTab?.doc}
          onClose={() => setIsTOCOpen(false)}
        />

        {/* Single Page Workspace */}
        {activeTab ? (
          <SinglePageWorkspace
            tab={activeTab}
            fontSize={settings.fontSize}
            readingWidth={settings.readingWidth}
            layoutMode={layoutMode}
            onUpdateDraft={(val) => handleUpdateDraft(activeTab.id, val)}
            onSave={() => handleSaveTab(activeTab.id)}
            onOpenExternal={(url) => sendIPC({ action: 'open_external', url })}
            onOpenRelative={(path) => sendIPC({ action: 'open_relative', path })}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center mb-4 font-bold text-2xl shadow-md">
              A
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">AburMD</h2>
            <p className="text-sm max-w-sm mb-6">Open a Markdown file or create a new tab to start reading and editing.</p>
            <button
              onClick={() => createNewTab()}
              className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-foreground)] font-semibold text-sm rounded-lg transition-all shadow-md transform hover:scale-105 mr-3"
            >
              New Tab
            </button>
            <button
              onClick={() => sendIPC({ action: 'open_workspace_dialog' })}
              className="px-6 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold text-sm rounded-lg transition-all"
            >
              <FolderOpen className="w-4 h-4 mr-2 inline" />
              Open Workspace
            </button>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar activeTab={activeTab} workspace={workspace} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={setSettings}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedDialog
        isOpen={!!pendingCloseTabId}
        filename={pendingCloseTab?.title || 'Document'}
        onSave={() => {
          if (pendingCloseTabId) {
            handleSaveTab(pendingCloseTabId);
            forceCloseTab(pendingCloseTabId);
            setPendingCloseTabId(null);
          }
        }}
        onDontSave={() => {
          if (pendingCloseTabId) {
            forceCloseTab(pendingCloseTabId);
            setPendingCloseTabId(null);
          }
        }}
        onCancel={() => setPendingCloseTabId(null)}
      />
    </div>
  );
};
