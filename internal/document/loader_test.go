package document_test

import (
	"os"
	"path/filepath"
	"testing"

	"mdview/internal/document"
)

func TestLoadFile(t *testing.T) {
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "test.md")
	content := "# Hello World\n\nThis is a test document."
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}

	doc, err := document.LoadFile(filePath)
	if err != nil {
		t.Fatalf("LoadFile failed: %v", err)
	}

	if doc.Name != "test.md" {
		t.Errorf("expected doc.Name to be test.md, got %s", doc.Name)
	}
	if doc.RawContent != content {
		t.Errorf("expected content %q, got %q", content, doc.RawContent)
	}
}

func TestIsMarkdownFile(t *testing.T) {
	if !document.IsMarkdownFile("README.md") {
		t.Errorf("README.md should be recognised as markdown file")
	}
	if !document.IsMarkdownFile("doc.markdown") {
		t.Errorf("doc.markdown should be recognised as markdown file")
	}
	if document.IsMarkdownFile("binary.exe") {
		t.Errorf("binary.exe should NOT be recognised as markdown file")
	}
}
