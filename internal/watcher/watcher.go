package watcher

import (
	"log"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

type FileWatcher struct {
	watcher     *fsnotify.Watcher
	currentPath string
	onChange    func(string)
	stopChan    chan struct{}
	mu          sync.Mutex
}

func NewFileWatcher(onChange func(string)) (*FileWatcher, error) {
	w, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	fw := &FileWatcher{
		watcher:  w,
		onChange: onChange,
		stopChan: make(chan struct{}),
	}

	go fw.loop()

	return fw, nil
}

func (fw *FileWatcher) Watch(path string) error {
	fw.mu.Lock()
	defer fw.mu.Unlock()

	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	if fw.currentPath != "" {
		_ = fw.watcher.Remove(fw.currentPath)
	}

	fw.currentPath = absPath
	return fw.watcher.Add(absPath)
}

func (fw *FileWatcher) Unwatch() {
	fw.mu.Lock()
	defer fw.mu.Unlock()

	if fw.currentPath != "" {
		_ = fw.watcher.Remove(fw.currentPath)
		fw.currentPath = ""
	}
}

func (fw *FileWatcher) Close() error {
	close(fw.stopChan)
	return fw.watcher.Close()
}

func (fw *FileWatcher) loop() {
	var timer *time.Timer
	var timerMu sync.Mutex

	for {
		select {
		case <-fw.stopChan:
			return

		case event, ok := <-fw.watcher.Events:
			if !ok {
				return
			}

			// Watch write, create, or rename events
			if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) || event.Has(fsnotify.Rename) {
				timerMu.Lock()
				if timer != nil {
					timer.Stop()
				}
				timer = time.AfterFunc(120*time.Millisecond, func() {
					fw.mu.Lock()
					path := fw.currentPath
					fw.mu.Unlock()

					if path != "" && fw.onChange != nil {
						fw.onChange(path)
					}
				})
				timerMu.Unlock()
			}

		case err, ok := <-fw.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("[Watcher Error] %v", err)
		}
	}
}
