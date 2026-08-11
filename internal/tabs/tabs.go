package tabs

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"mdview/internal/document"
)

type TabMode string

const (
	ModeView TabMode = "VIEW"
	ModeEdit TabMode = "EDIT"
)

type Tab struct {
	ID           string             `json:"id"`
	Path         string             `json:"path"`
	Title        string             `json:"title"`
	Document     *document.Document `json:"document"`
	Mode         TabMode            `json:"mode"`
	IsDirty      bool               `json:"is_dirty"`
	DraftContent string             `json:"draft_content"`
	ScrollTop    int                `json:"scroll_top"`
}

type TabManager struct {
	Tabs        []*Tab     `json:"tabs"`
	ActiveIndex int        `json:"active_index"`
	nextID      int
	mu          sync.Mutex
}

func NewTabManager() *TabManager {
	return &TabManager{
		Tabs:        make([]*Tab, 0),
		ActiveIndex: -1,
		nextID:      1,
	}
}

func (tm *TabManager) CreateTab(path string, doc *document.Document) *Tab {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	id := fmt.Sprintf("tab-%d-%d", tm.nextID, time.Now().UnixNano())
	tm.nextID++

	title := "Untitled"
	if doc != nil && doc.Name != "" {
		title = doc.Name
	} else if path != "" {
		title = filepath.Base(path)
	}

	rawContent := ""
	if doc != nil {
		rawContent = doc.RawContent
	}

	tab := &Tab{
		ID:           id,
		Path:         path,
		Title:        title,
		Document:     doc,
		Mode:         ModeView,
		IsDirty:      false,
		DraftContent: rawContent,
		ScrollTop:    0,
	}

	tm.Tabs = append(tm.Tabs, tab)
	tm.ActiveIndex = len(tm.Tabs) - 1
	return tab
}

func (tm *TabManager) GetActiveTab() *Tab {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if tm.ActiveIndex >= 0 && tm.ActiveIndex < len(tm.Tabs) {
		return tm.Tabs[tm.ActiveIndex]
	}
	return nil
}

func (tm *TabManager) SetActiveIndex(index int) bool {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if index >= 0 && index < len(tm.Tabs) {
		tm.ActiveIndex = index
		return true
	}
	return false
}

func (tm *TabManager) CloseTab(index int) (*Tab, bool) {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if index < 0 || index >= len(tm.Tabs) {
		return nil, false
	}

	closedTab := tm.Tabs[index]
	tm.Tabs = append(tm.Tabs[:index], tm.Tabs[index+1:]...)

	if len(tm.Tabs) == 0 {
		tm.ActiveIndex = -1
	} else if tm.ActiveIndex >= len(tm.Tabs) {
		tm.ActiveIndex = len(tm.Tabs) - 1
	}

	return closedTab, true
}

func (tm *TabManager) NextTab() {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if len(tm.Tabs) > 1 {
		tm.ActiveIndex = (tm.ActiveIndex + 1) % len(tm.Tabs)
	}
}

func (tm *TabManager) PrevTab() {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if len(tm.Tabs) > 1 {
		tm.ActiveIndex = (tm.ActiveIndex - 1 + len(tm.Tabs)) % len(tm.Tabs)
	}
}

func (tm *TabManager) SetTabMode(index int, mode TabMode) bool {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if index >= 0 && index < len(tm.Tabs) {
		tm.Tabs[index].Mode = mode
		return true
	}
	return false
}

func (tm *TabManager) UpdateDraft(index int, content string) bool {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if index >= 0 && index < len(tm.Tabs) {
		tab := tm.Tabs[index]
		tab.DraftContent = content
		if tab.Document != nil {
			tab.IsDirty = (content != tab.Document.RawContent)
		} else {
			tab.IsDirty = (content != "")
		}
		return true
	}
	return false
}

func (tm *TabManager) SaveTab(index int) error {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if index < 0 || index >= len(tm.Tabs) {
		return fmt.Errorf("invalid tab index")
	}

	tab := tm.Tabs[index]
	if tab.Path == "" {
		return fmt.Errorf("cannot save untitled tab without path")
	}

	if err := os.WriteFile(tab.Path, []byte(tab.DraftContent), 0644); err != nil {
		return fmt.Errorf("failed to save file: %w", err)
	}

	if tab.Document != nil {
		tab.Document.RawContent = tab.DraftContent
	}
	tab.IsDirty = false
	return nil
}
