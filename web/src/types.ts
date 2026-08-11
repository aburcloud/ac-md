export type TabMode = 'VIEW' | 'EDIT';

export interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export interface Document {
  path: string;
  name: string;
  dir: string;
  raw_content: string;
  rendered_html: string;
  table_of_contents: TOCItem[];
  modified_at?: string;
  size?: number;
}

export interface Tab {
  id: string;
  path: string;
  title: string;
  doc: Document | null;
  mode: TabMode;
  isDirty: boolean;
  draftContent: string;
  scrollTop: number;
}

export type AccentColor = 'orange' | 'amber' | 'red' | 'blue' | 'indigo' | 'violet' | 'green' | 'cyan';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface FileTreeItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeItem[];
  expanded?: boolean;
  depth: number;
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  recentFiles: string[];
  lastOpened: number;
}

export interface NotebookCell {
  id: string;
  type: 'markdown' | 'code';
  content: string;
  language?: string;
  output?: string;
}

export interface Frontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  author?: string;
  date?: string;
  [key: string]: any;
}

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentColor;
  openLinksExternal: boolean;
  renderRawHTML: boolean;
  showOutline: boolean;
  restoreSession: boolean;
  fontSize: number;
  readingWidth: number;
  showFileExplorer: boolean;
  autoSave: boolean;
  notebookMode: boolean;
}
