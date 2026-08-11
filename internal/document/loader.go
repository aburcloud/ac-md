package document

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"
)

var AllowedExtensions = []string{".md", ".markdown", ".mdown", ".mkd", ".mkdn", ".txt"}

func IsMarkdownFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	for _, allowed := range AllowedExtensions {
		if ext == allowed {
			return true
		}
	}
	return false
}

func LoadFile(path string) (*Document, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("invalid path: %w", err)
	}

	info, err := os.Stat(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("file not found: %s", absPath)
		}
		return nil, fmt.Errorf("cannot access file: %w", err)
	}

	if info.IsDir() {
		return nil, fmt.Errorf("path is a directory, not a markdown file: %s", absPath)
	}

	if !IsMarkdownFile(absPath) {
		return nil, fmt.Errorf("unsupported file extension %q (MDView supports .md, .markdown)", filepath.Ext(absPath))
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Ensure valid UTF-8, replace invalid bytes safely
	var rawContent string
	if utf8.Valid(data) {
		rawContent = string(data)
	} else {
		rawContent = strings.ToValidUTF8(string(data), "")
	}

	doc := &Document{
		Path:            absPath,
		Name:            filepath.Base(absPath),
		Dir:             filepath.Dir(absPath),
		RawContent:      rawContent,
		TableOfContents: []TOCItem{},
		ModifiedAt:      info.ModTime(),
		Size:            info.Size(),
	}

	return doc, nil
}
