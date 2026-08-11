package watcher_test

import (
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"mdview/internal/watcher"
)

func TestFileWatcher(t *testing.T) {
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "watch_test.md")
	if err := os.WriteFile(filePath, []byte("initial"), 0644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	var wg sync.WaitGroup
	wg.Add(1)

	var changedPath string
	fw, err := watcher.NewFileWatcher(func(p string) {
		changedPath = p
		wg.Done()
	})
	if err != nil {
		t.Fatalf("failed to create watcher: %v", err)
	}
	defer fw.Close()

	if err := fw.Watch(filePath); err != nil {
		t.Fatalf("failed to watch file: %v", err)
	}

	// Modify file
	time.Sleep(50 * time.Millisecond)
	if err := os.WriteFile(filePath, []byte("updated content"), 0644); err != nil {
		t.Fatalf("failed to update test file: %v", err)
	}

	// Wait for debounced event
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		if changedPath != filePath {
			t.Errorf("expected changed path %s, got %s", filePath, changedPath)
		}
	case <-time.After(2 * time.Second):
		t.Errorf("timeout waiting for file change event")
	}
}
