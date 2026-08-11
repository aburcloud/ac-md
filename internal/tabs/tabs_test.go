package tabs_test

import (
	"os"
	"path/filepath"
	"testing"

	"mdview/internal/document"
	"mdview/internal/tabs"
)

func TestTabManager(t *testing.T) {
	tm := tabs.NewTabManager()

	doc1 := &document.Document{Name: "README.md", RawContent: "# AburMD"}
	tab1 := tm.CreateTab("C:\\README.md", doc1)

	if len(tm.Tabs) != 1 {
		t.Fatalf("expected 1 tab, got %d", len(tm.Tabs))
	}
	if tab1.Mode != tabs.ModeView {
		t.Errorf("expected initial mode VIEW, got %s", tab1.Mode)
	}

	doc2 := &document.Document{Name: "architecture.md", RawContent: "# Architecture"}
	tm.CreateTab("C:\\architecture.md", doc2)

	if len(tm.Tabs) != 2 {
		t.Fatalf("expected 2 tabs, got %d", len(tm.Tabs))
	}
	if tm.ActiveIndex != 1 {
		t.Errorf("expected active index 1, got %d", tm.ActiveIndex)
	}

	// Update draft and check dirty state
	tm.UpdateDraft(1, "# Architecture Modified")
	if !tm.Tabs[1].IsDirty {
		t.Errorf("expected tab 1 to be marked dirty after draft modification")
	}

	// Test saving
	tmpDir := t.TempDir()
	savePath := filepath.Join(tmpDir, "saved.md")
	tab3 := tm.CreateTab(savePath, &document.Document{Name: "saved.md", RawContent: "Initial"})
	tm.UpdateDraft(2, "New Content")
	if err := tm.SaveTab(2); err != nil {
		t.Fatalf("SaveTab failed: %v", err)
	}

	savedData, _ := os.ReadFile(savePath)
	if string(savedData) != "New Content" {
		t.Errorf("expected saved file content %q, got %q", "New Content", string(savedData))
	}
	if tab3.IsDirty {
		t.Errorf("expected tab to no longer be dirty after save")
	}
}
