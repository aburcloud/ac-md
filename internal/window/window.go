package window

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"net/url"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/jchv/go-webview2"

	"mdview/internal/config"
	"mdview/internal/document"
	"mdview/internal/platform"
	"mdview/web"
)

type IPCMessage struct {
	Action  string `json:"action"`
	Path    string `json:"path,omitempty"`
	Name    string `json:"name,omitempty"`
	Title   string `json:"title,omitempty"`
	URL     string `json:"url,omitempty"`
	Theme   string `json:"theme,omitempty"`
	Payload string `json:"payload,omitempty"`
	Content string `json:"content,omitempty"`
}

type FileTreeItem struct {
	Name        string         `json:"name"`
	Path        string         `json:"path"`
	IsDirectory bool           `json:"is_directory"`
	Children    []FileTreeItem `json:"children,omitempty"`
	Expanded    bool           `json:"expanded,omitempty"`
	Depth       int            `json:"depth"`
}

type Workspace struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Path        string   `json:"path"`
	RecentFiles []string `json:"recent_files"`
	LastOpened  int64    `json:"last_opened"`
}

type WindowManager struct {
	view          webview2.WebView
	server        *http.Server
	cfg           *config.Config
	onReady       func()
	onOpenFile    func(path string)
	onOpenContent func(name, content string)
	onSaveFile    func(path, content string)
	onSaveTheme   func(theme string)
	onOpenDialog  func()
	onOpenFolder  func()
}

func NewWindowManager(
	cfg *config.Config,
	onReady func(),
	onOpenFile func(path string),
	onOpenContent func(name, content string),
	onSaveFile func(path, content string),
	onSaveTheme func(theme string),
	onOpenDialog func(),
	onOpenFolder func(),
) (*WindowManager, error) {
	subFS, err := fs.Sub(web.Content, "dist")
	if err != nil {
		return nil, fmt.Errorf("failed to locate embedded dist folder: %w", err)
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, fmt.Errorf("failed to bind local loopback listener: %w", err)
	}
	port := listener.Addr().(*net.TCPAddr).Port

	server := &http.Server{
		Handler: http.FileServer(http.FS(subFS)),
	}

	go func() {
		if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Printf("[Server Warning] Local HTTP server closed: %v", err)
		}
	}()

	w := webview2.New(false)
	if w == nil {
		_ = server.Close()
		return nil, fmt.Errorf("failed to initialize WebView2 runtime")
	}

	wm := &WindowManager{
		view:          w,
		server:        server,
		cfg:           cfg,
		onReady:       onReady,
		onOpenFile:    onOpenFile,
		onOpenContent: onOpenContent,
		onSaveFile:    onSaveFile,
		onSaveTheme:   onSaveTheme,
		onOpenDialog:  onOpenDialog,
		onOpenFolder:  onOpenFolder,
	}

	w.SetTitle("AburMD")
	w.SetSize(1100, 750, webview2.HintNone)

	w.Bind("postToGo", wm.handleIPCMessage)

	appURL := fmt.Sprintf("http://127.0.0.1:%d", port)
	w.Navigate(appURL)

	return wm, nil
}

func (wm *WindowManager) Run() {
	wm.view.Run()
}

func (wm *WindowManager) Destroy() {
	if wm.server != nil {
		_ = wm.server.Close()
	}
	if wm.view != nil {
		wm.view.Destroy()
	}
}

func (wm *WindowManager) SetTitle(title string) {
	wm.view.Dispatch(func() {
		wm.view.SetTitle(title)
	})
}

func (wm *WindowManager) RenderDocument(doc *document.Document) {
	docJSON, err := json.Marshal(doc)
	if err != nil {
		log.Printf("[Error] Failed to marshal document: %v", err)
		return
	}

	wm.view.Dispatch(func() {
		wm.view.SetTitle(fmt.Sprintf("%s - AburMD", doc.Name))
		script := fmt.Sprintf("window.renderDocument(%s);", string(docJSON))
		wm.view.Eval(script)
	})
}

func (wm *WindowManager) RenderError(errMsg string) {
	wm.view.Dispatch(func() {
		wm.view.SetTitle("Error - AburMD")
		script := fmt.Sprintf("window.renderError(%q);", errMsg)
		wm.view.Eval(script)
	})
}

func (wm *WindowManager) ShowEmptyState() {
	wm.view.Dispatch(func() {
		wm.view.SetTitle("AburMD")
		wm.view.Eval("window.showEmptyState();")
	})
}

func (wm *WindowManager) ApplyTheme(theme string) {
	wm.view.Dispatch(func() {
		script := fmt.Sprintf("window.setTheme(%q);", theme)
		wm.view.Eval(script)
	})
}

func (wm *WindowManager) SendFileTree(treeJSON []byte) {
	wm.view.Dispatch(func() {
		script := fmt.Sprintf("window.onFileTreeUpdate(%s);", string(treeJSON))
		wm.view.Eval(script)
	})
}

func (wm *WindowManager) SendWorkspace(wsJSON []byte) {
	wm.view.Dispatch(func() {
		script := fmt.Sprintf("window.onWorkspaceLoaded(%s);", string(wsJSON))
		wm.view.Eval(script)
	})
}

func (wm *WindowManager) handleIPCMessage(jsonMsg string) {
	var msg IPCMessage
	if err := json.Unmarshal([]byte(jsonMsg), &msg); err != nil {
		log.Printf("[IPC Error] Failed to parse message: %v", err)
		return
	}

	switch msg.Action {
	case "ready":
		wm.ApplyTheme(wm.cfg.Theme)
		if wm.onReady != nil {
			wm.onReady()
		}

	case "open_file":
		if msg.Path != "" && wm.onOpenFile != nil {
			cleanPath := cleanFilePath(msg.Path)
			wm.onOpenFile(cleanPath)
		}

	case "open_content":
		if msg.Content != "" && wm.onOpenContent != nil {
			wm.onOpenContent(msg.Name, msg.Content)
		}

	case "save_file":
		if wm.onSaveFile != nil {
			wm.onSaveFile(msg.Path, msg.Content)
		}

	case "open_dialog":
		if wm.onOpenDialog != nil {
			wm.onOpenDialog()
		}

	case "open_folder_dialog":
		if wm.onOpenFolder != nil {
			wm.onOpenFolder()
		}

	case "open_workspace":
		if msg.Path != "" && wm.onOpenFile != nil {
			// This is handled by the app layer
		}

	case "open_workspace_dialog":
		if wm.onOpenFolder != nil {
			wm.onOpenFolder()
		}

	case "new_file":
		if msg.Path != "" && wm.onOpenFile != nil {
			// Handled by app layer
		}

	case "new_folder":
		if msg.Path != "" && wm.onOpenFile != nil {
			// Handled by app layer
		}

	case "refresh_file_tree":
		if msg.Path != "" && wm.onOpenFile != nil {
			// Handled by app layer
		}

	case "export_pdf":
		// Handled by app layer
		if wm.onOpenFile != nil {
		}

	case "export_html":
		// Handled by app layer
		if wm.onOpenFile != nil {
		}

	case "open_external":
		if msg.URL != "" {
			openExternalURL(msg.URL)
		}

	case "open_relative":
		if msg.Path != "" && wm.onOpenFile != nil {
			cleanPath := cleanFilePath(msg.Path)
			wm.onOpenFile(cleanPath)
		}

	case "set_title":
		if msg.Title != "" {
			wm.SetTitle(msg.Title)
		}

	case "save_theme":
		if msg.Theme != "" && wm.onSaveTheme != nil {
			wm.onSaveTheme(msg.Theme)
		}
	}
}

func cleanFilePath(path string) string {
	path = strings.TrimSpace(path)
	path = strings.Trim(path, `"`)
	path = strings.Trim(path, `'`)
	if strings.HasPrefix(path, "file:///") {
		path = strings.TrimPrefix(path, "file:///")
	} else if strings.HasPrefix(path, "file://") {
		path = strings.TrimPrefix(path, "file://")
	}
	if decoded, err := url.QueryUnescape(path); err == nil {
		path = decoded
	}
	return filepath.Clean(path)
}

func openExternalURL(urlStr string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", urlStr)
	case "darwin":
		cmd = exec.Command("open", urlStr)
	default:
		cmd = exec.Command("xdg-open", urlStr)
	}
	_ = cmd.Start()
}

func OpenWindowsFileDialog() string {
	return platform.OpenFileDialog()
}

func OpenWindowsSaveFileDialog(defaultName string) string {
	return platform.SaveFileDialog(defaultName)
}

func OpenWindowsFolderDialog() string {
	return platform.OpenFolderDialog()
}
