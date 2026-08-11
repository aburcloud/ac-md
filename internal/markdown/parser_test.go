package markdown_test

import (
	"strings"
	"testing"

	"mdview/internal/document"
	"mdview/internal/markdown"
)

func TestRenderMarkdown(t *testing.T) {
	conv := markdown.NewConverter()

	raw := "# Getting Started\n\nWelcome to MDView.\n\n## Installation\n\n```go\npackage main\n\nfunc main() {}\n```\n\n- [x] Feature 1\n- [ ] Feature 2"

	doc := &document.Document{
		Path:       "C:\\docs\\readme.md",
		Name:       "readme.md",
		Dir:        "C:\\docs",
		RawContent: raw,
	}

	err := conv.Render(doc, "dark")
	if err != nil {
		t.Fatalf("Render failed: %v", err)
	}

	if !strings.Contains(doc.RenderedHTML, "<h1") {
		t.Errorf("expected HTML to contain <h1> tag")
	}

	if !strings.Contains(doc.RenderedHTML, "code-block-container") {
		t.Errorf("expected code block to be formatted with Chroma wrapper")
	}

	if len(doc.TableOfContents) != 2 {
		t.Errorf("expected 2 TOC items, got %d", len(doc.TableOfContents))
	}

	if doc.TableOfContents[0].Text != "Getting Started" {
		t.Errorf("expected first TOC item to be 'Getting Started', got %q", doc.TableOfContents[0].Text)
	}
}
