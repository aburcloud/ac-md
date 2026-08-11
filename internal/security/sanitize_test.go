package security_test

import (
	"strings"
	"testing"

	"mdview/internal/security"
)

func TestSanitizeHTML(t *testing.T) {
	raw := `<h1>Title</h1><script>alert('hack');</script><p>Paragraph</p><a href="javascript:alert(1)">Click</a>`
	sanitized := security.SanitizeHTML(raw)

	if strings.Contains(sanitized, "<script>") {
		t.Errorf("SanitizeHTML failed to remove script tag")
	}
	if strings.Contains(sanitized, "javascript:") {
		t.Errorf("SanitizeHTML failed to sanitize javascript: href")
	}
	if !strings.Contains(sanitized, "<h1>Title</h1>") {
		t.Errorf("SanitizeHTML removed valid h1 tag")
	}
}

func TestIsSafeURL(t *testing.T) {
	if !security.IsSafeURL("https://example.com") {
		t.Errorf("https://example.com should be safe")
	}
	if security.IsSafeURL("javascript:void(0)") {
		t.Errorf("javascript:void(0) should NOT be safe")
	}
}
