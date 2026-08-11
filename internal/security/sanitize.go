package security

import (
	"html"
	"regexp"
	"strings"
)

var (
	scriptTagRegex  = regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`)
	iframeTagRegex  = regexp.MustCompile(`(?i)<iframe[^>]*>.*?</iframe>`)
	objectTagRegex  = regexp.MustCompile(`(?i)<object[^>]*>.*?</object>`)
	embedTagRegex   = regexp.MustCompile(`(?i)<embed[^>]*>.*?</embed>`)
	formTagRegex    = regexp.MustCompile(`(?i)<form[^>]*>.*?</form>`)
	eventAttrRegex  = regexp.MustCompile(`(?i)\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)`)
	dangerLinkRegex = regexp.MustCompile(`(?i)href\s*=\s*["']?\s*(javascript|vbscript|data):`)
)

func SanitizeHTML(rawHTML string) string {
	cleaned := scriptTagRegex.ReplaceAllString(rawHTML, "")
	cleaned = iframeTagRegex.ReplaceAllString(cleaned, "")
	cleaned = objectTagRegex.ReplaceAllString(cleaned, "")
	cleaned = embedTagRegex.ReplaceAllString(cleaned, "")
	cleaned = formTagRegex.ReplaceAllString(cleaned, "")
	cleaned = eventAttrRegex.ReplaceAllString(cleaned, "")
	cleaned = dangerLinkRegex.ReplaceAllString(cleaned, `href="#unsafe-link-blocked"`)
	return cleaned
}

func IsSafeURL(urlStr string) bool {
	lower := strings.ToLower(strings.TrimSpace(urlStr))
	if strings.HasPrefix(lower, "javascript:") || strings.HasPrefix(lower, "vbscript:") || strings.HasPrefix(lower, "data:text/html") {
		return false
	}
	return true
}

func EscapeAttribute(str string) string {
	return html.EscapeString(str)
}
