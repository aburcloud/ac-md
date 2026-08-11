package app

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"mdview/internal/config"
	"mdview/internal/document"
	"mdview/internal/markdown"
	"mdview/internal/watcher"
	"mdview/internal/window"
)

type App struct {
	cfg         *config.Config
	converter   *markdown.Converter
	watcher     *watcher.FileWatcher
	winManager  *window.WindowManager
	currentDoc  *document.Document
	currentPath string
	initialPath string
	workspace   *Workspace
	mu          sync.Mutex
}

type Workspace struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Path       string   `json:"path"`
	RecentFiles []string `json:"recent_files"`
	LastOpened int64    `json:"last_opened"`
}

func NewApp(initialPath string) (*App, error) {
	cfg, err := config.LoadConfig()
	if err != nil {
		cfg = config.DefaultConfig()
	}

	converter := markdown.NewConverter()

	a := &App{
		cfg:         cfg,
		converter:   converter,
		initialPath: strings.TrimSpace(initialPath),
	}

	w, err := watcher.NewFileWatcher(func(path string) {
		a.ReloadCurrentFile()
	})
	if err != nil {
		log.Printf("[App Warning] File watcher init failed: %v", err)
	} else {
		a.watcher = w
	}

	winManager, err := window.NewWindowManager(
		cfg,
		func() {
			// Frontend JavaScript is loaded and ready!
			a.mu.Lock()
			initPath := a.initialPath
			a.mu.Unlock()

			if initPath != "" {
				_ = a.OpenFile(initPath)
			} else {
				a.winManager.ShowEmptyState()
			}
		},
		func(path string) {
			go func() {
				_ = a.OpenFile(path)
			}()
		},
		func(name, content string) {
			go func() {
				_ = a.OpenContent(name, content)
			}()
		},
		func(path, content string) {
			go func() {
				_ = a.SaveFile(path, content)
			}()
		},
		func(theme string) {
			a.cfg.Theme = theme
			_ = config.SaveConfig(a.cfg)
			if a.currentDoc != nil {
				a.ReloadCurrentFile()
			}
		},
		func() {
			go func() {
				path := window.OpenWindowsFileDialog()
				path = strings.TrimSpace(path)
				if path != "" {
					_ = a.OpenFile(path)
				}
			}()
		},
		func() {
			go func() {
				path := window.OpenWindowsFolderDialog()
				path = strings.TrimSpace(path)
				if path != "" {
					_ = a.OpenWorkspace(path)
				}
			}()
		},
	)
	if err != nil {
		return nil, err
	}

	a.winManager = winManager

	return a, nil
}

func (a *App) Run() {
	a.winManager.Run()
	a.Shutdown()
}

func (a *App) Shutdown() {
	if a.watcher != nil {
		_ = a.watcher.Close()
	}
	a.winManager.Destroy()
}

func (a *App) SaveFile(path, content string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	targetPath := strings.TrimSpace(path)
	if targetPath == "" || strings.HasPrefix(targetPath, "Untitled") {
		dialogPath := window.OpenWindowsSaveFileDialog(targetPath)
		if dialogPath == "" {
			return nil // User cancelled
		}
		targetPath = dialogPath
	}

	if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
		log.Printf("[SaveFile Error] %v", err)
		a.winManager.RenderError("Failed to save file: " + err.Error())
		return err
	}

	doc, err := document.LoadFile(targetPath)
	if err != nil {
		// If load fails, construct document
		doc = &document.Document{
			Path:            targetPath,
			Name:            filepath.Base(targetPath),
			Dir:             filepath.Dir(targetPath),
			RawContent:      content,
			TableOfContents: []document.TOCItem{},
		}
	}

	if err := a.converter.Render(doc, a.cfg.Theme); err != nil {
		log.Printf("[Render Error] %v", err)
	}

	a.currentDoc = doc
	a.currentPath = targetPath

	a.winManager.RenderDocument(doc)

	if a.watcher != nil {
		_ = a.watcher.Watch(targetPath)
	}

	// Add to recent files in workspace
	if a.workspace != nil {
		a.addToRecentFiles(targetPath)
	}

	return nil
}

func (a *App) OpenFile(path string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	cleanPath := strings.TrimSpace(path)
	cleanPath = strings.Trim(cleanPath, `"`)
	cleanPath = strings.Trim(cleanPath, `'`)

	if !filepath.IsAbs(cleanPath) && a.currentDoc != nil && a.currentDoc.Dir != "" {
		cleanPath = filepath.Join(a.currentDoc.Dir, cleanPath)
	}

	doc, err := document.LoadFile(cleanPath)
	if err != nil {
		log.Printf("[OpenFile Error] %v", err)
		a.winManager.RenderError(err.Error())
		return err
	}

	if err := a.converter.Render(doc, a.cfg.Theme); err != nil {
		log.Printf("[Render Error] %v", err)
		a.winManager.RenderError("Markdown render error: " + err.Error())
		return err
	}

	a.currentDoc = doc
	a.currentPath = doc.Path

	a.winManager.RenderDocument(doc)

	if a.watcher != nil {
		_ = a.watcher.Watch(doc.Path)
	}

	// Add to recent files in workspace
	if a.workspace != nil {
		a.addToRecentFiles(doc.Path)
	}

	return nil
}

func (a *App) OpenContent(name, rawContent string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if name == "" {
		name = "Document.md"
	}

	doc := &document.Document{
		Path:            name,
		Name:            name,
		Dir:             ".",
		RawContent:      rawContent,
		TableOfContents: []document.TOCItem{},
	}

	if err := a.converter.Render(doc, a.cfg.Theme); err != nil {
		a.winManager.RenderError("Markdown render error: " + err.Error())
		return err
	}

	a.currentDoc = doc
	a.currentPath = ""
	a.winManager.RenderDocument(doc)

	return nil
}

func (a *App) ReloadCurrentFile() {
	a.mu.Lock()
	path := a.currentPath
	a.mu.Unlock()

	if path == "" {
		return
	}

	doc, err := document.LoadFile(path)
	if err != nil {
		log.Printf("[Reload Error] %v", err)
		return
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	if err := a.converter.Render(doc, a.cfg.Theme); err != nil {
		log.Printf("[Render Error] %v", err)
		return
	}

	a.currentDoc = doc
	a.winManager.RenderDocument(doc)
}

// Workspace management functions

func (a *App) OpenWorkspace(path string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	cleanPath := strings.TrimSpace(path)
	cleanPath = strings.Trim(cleanPath, `"`)
	cleanPath = strings.Trim(cleanPath, `'`)

	info, err := os.Stat(cleanPath)
	if err != nil {
		log.Printf("[OpenWorkspace Error] %v", err)
		a.winManager.RenderError("Failed to open workspace: " + err.Error())
		return err
	}

	if !info.IsDir() {
		a.winManager.RenderError("Selected path is not a directory")
		return nil
	}

	absPath, _ := filepath.Abs(cleanPath)
	workspaceName := filepath.Base(absPath)
	if workspaceName == "." || workspaceName == "/" {
		workspaceName = "Workspace"
	}

	a.workspace = &Workspace{
		ID:          generateWorkspaceID(absPath),
		Name:        workspaceName,
		Path:        absPath,
		RecentFiles: []string{},
		LastOpened:  0,
	}

	// Load workspace metadata if exists
	a.loadWorkspaceMetadata()

	// Build and send file tree
	fileTree := a.buildFileTree(absPath, 0)
	treeJSON, _ := json.Marshal(fileTree)
	a.winManager.SendFileTree(treeJSON)

	// Send workspace info
	wsJSON, _ := json.Marshal(a.workspace)
	a.winManager.SendWorkspace(wsJSON)

	return nil
}

func (a *App) CloseWorkspace() {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.workspace != nil {
		a.saveWorkspaceMetadata()
	}
	a.workspace = nil
}

func (a *App) NewFile(dirPath string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	cleanPath := strings.TrimSpace(dirPath)
	if cleanPath == "" {
		if a.workspace != nil {
			cleanPath = a.workspace.Path
		} else if a.currentDoc != nil {
			cleanPath = a.currentDoc.Dir
		} else {
			return nil
		}
	}

	// Open save dialog for new file
	dialogPath := window.OpenWindowsSaveFileDialog("Untitled.md")
	if dialogPath == "" {
		return nil // User cancelled
	}

	// Create empty file
	if err := os.WriteFile(dialogPath, []byte(""), 0644); err != nil {
		log.Printf("[NewFile Error] %v", err)
		return err
	}

	// Open the new file
	return a.OpenFile(dialogPath)
}

func (a *App) NewFolder(dirPath string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	cleanPath := strings.TrimSpace(dirPath)
	if cleanPath == "" {
		if a.workspace != nil {
			cleanPath = a.workspace.Path
		} else if a.currentDoc != nil {
			cleanPath = a.currentDoc.Dir
		} else {
			return nil
		}
	}

	// For simplicity, we'll just log - a proper implementation would show a dialog
	// In a real app, you'd want to prompt for folder name
	log.Printf("[NewFolder] Would create folder in: %s", cleanPath)
	
	// Refresh file tree
	if a.workspace != nil {
		fileTree := a.buildFileTree(a.workspace.Path, 0)
		treeJSON, _ := json.Marshal(fileTree)
		a.winManager.SendFileTree(treeJSON)
	}

	return nil
}

func (a *App) RefreshFileTree(path string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.workspace != nil && (path == "" || path == a.workspace.Path) {
		fileTree := a.buildFileTree(a.workspace.Path, 0)
		treeJSON, _ := json.Marshal(fileTree)
		a.winManager.SendFileTree(treeJSON)
	}
}

func (a *App) ExportPDF() {
	// TODO: Implement PDF export
	log.Printf("[ExportPDF] Not yet implemented")
	a.winManager.RenderError("PDF export not yet implemented")
}

func (a *App) ExportHTML() {
	// TODO: Implement HTML export
	log.Printf("[ExportHTML] Not yet implemented")
	a.winManager.RenderError("HTML export not yet implemented")
}

// Helper functions

func (a *App) buildFileTree(rootPath string, depth int) []window.FileTreeItem {
	var items []window.FileTreeItem

	entries, err := os.ReadDir(rootPath)
	if err != nil {
		return items
	}

	for _, entry := range entries {
		// Skip hidden files and directories
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		fullPath := filepath.Join(rootPath, entry.Name())
		isDir := entry.IsDir()

		item := window.FileTreeItem{
			Name:        entry.Name(),
			Path:        fullPath,
			IsDirectory: isDir,
			Depth:       depth,
		}

		if isDir {
			children := a.buildFileTree(fullPath, depth+1)
			item.Children = children
		}

		items = append(items, item)
	}

	return items
}

func (a *App) addToRecentFiles(filePath string) {
	if a.workspace == nil {
		return
	}

	// Remove if already exists
	newRecent := []string{}
	for _, f := range a.workspace.RecentFiles {
		if f != filePath {
			newRecent = append(newRecent, f)
		}
	}

	// Add to front
	a.workspace.RecentFiles = append([]string{filePath}, newRecent...)

	// Limit to 20 recent files
	if len(a.workspace.RecentFiles) > 20 {
		a.workspace.RecentFiles = a.workspace.RecentFiles[:20]
	}
}

func (a *App) loadWorkspaceMetadata() {
	if a.workspace == nil {
		return
	}

	metadataPath := filepath.Join(a.workspace.Path, ".aburmd", "workspace.json")
	data, err := os.ReadFile(metadataPath)
	if err != nil {
		return
	}

	var metadata struct {
		RecentFiles []string `json:"recent_files"`
	}
	if err := json.Unmarshal(data, &metadata); err == nil {
		a.workspace.RecentFiles = metadata.RecentFiles
	}
}

func (a *App) saveWorkspaceMetadata() {
	if a.workspace == nil {
		return
	}

	metadataDir := filepath.Join(a.workspace.Path, ".aburmd")
	_ = os.MkdirAll(metadataDir, 0755)

	metadataPath := filepath.Join(metadataDir, "workspace.json")
	metadata := map[string]interface{}{
		"recent_files": a.workspace.RecentFiles,
	}
	data, _ := json.MarshalIndent(metadata, "", "  ")
	_ = os.WriteFile(metadataPath, data, 0644)
}

func generateWorkspaceID(path string) string {
	// Simple hash of path
	hash := 0
	for _, c := range path {
		hash = hash*31 + int(c)
	}
	return fmt.Sprintf("ws-%x", hash)
}
