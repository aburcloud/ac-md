package markdown

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"html"
	"mime"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/alecthomas/chroma/v2"
	chromahtml "github.com/alecthomas/chroma/v2/formatters/html"
	"github.com/alecthomas/chroma/v2/lexers"
	"github.com/alecthomas/chroma/v2/styles"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	goldmarkhtml "github.com/yuin/goldmark/renderer/html"
	"gopkg.in/yaml.v3"

	"mdview/internal/document"
)

type Converter struct {
	gm goldmark.Markdown
}

func NewConverter() *Converter {
	gm := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Table,
			extension.Strikethrough,
			extension.TaskList,
			extension.DefinitionList,
			extension.Footnote,
			extension.Typographer,
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			goldmarkhtml.WithUnsafe(), // Allow raw HTML embedded in markdown if safe
		),
	)
	return &Converter{gm: gm}
}

var headingRegex = regexp.MustCompile(`(?i)<h([1-4])\s+id="([^"]+)">([^<]+)</h[1-4]>`)
var headingNoIdRegex = regexp.MustCompile(`(?i)<h([1-4])>([^<]+)</h[1-4]>`)
var imgRegex = regexp.MustCompile(`(?i)<img\s+([^>]*src=["']([^"']+)["'][^>]*)>`)
var codeBlockRegex = regexp.MustCompile(`(?s)<pre><code(?:\s+class="language-([^"]+)")?>(.*?)</code></pre>`)
var frontmatterRegex = regexp.MustCompile(`(?s)^---\s*\n(.*?)\n---\s*\n`)

func (c *Converter) Render(doc *document.Document, theme string) error {
	// Extract frontmatter
	frontmatter, content := extractFrontmatter(doc.RawContent)
	doc.Frontmatter = frontmatter

	var buf bytes.Buffer
	if err := c.gm.Convert([]byte(content), &buf); err != nil {
		return err
	}

	htmlContent := buf.String()

	// 1. Process Code Blocks with Chroma Syntax Highlighting
	htmlContent = processCodeBlocks(htmlContent, theme)

	// 2. Resolve relative image paths
	htmlContent = resolveImages(htmlContent, doc.Dir)

	// 3. Process TOC and Headings
	toc, htmlWithAnchors := extractTOCAndAddAnchors(htmlContent)

	doc.RenderedHTML = htmlWithAnchors
	doc.TableOfContents = toc

	return nil
}

func extractFrontmatter(content string) (map[string]interface{}, string) {
	matches := frontmatterRegex.FindStringSubmatch(content)
	if len(matches) < 2 {
		return nil, content
	}

	frontmatterContent := matches[1]
	var frontmatter map[string]interface{}
	if err := yaml.Unmarshal([]byte(frontmatterContent), &frontmatter); err != nil {
		return nil, content
	}

	// Remove frontmatter from content
	remainingContent := frontmatterRegex.ReplaceAllString(content, "")
	return frontmatter, remainingContent
}

func processCodeBlocks(rawHTML string, theme string) string {
	styleName := "github"
	if theme == "dark" {
		styleName = "github-dark"
	}
	style := styles.Get(styleName)
	if style == nil {
		style = styles.Fallback
	}

	formatter := chromahtml.New(
		chromahtml.WithClasses(true),
		chromahtml.PreventSurroundingPre(true),
	)

	return codeBlockRegex.ReplaceAllStringFunc(rawHTML, func(match string) string {
		submatches := codeBlockRegex.FindStringSubmatch(match)
		if len(submatches) < 3 {
			return match
		}

		lang := submatches[1]
		rawCodeEscaped := submatches[2]
		rawCode := html.UnescapeString(rawCodeEscaped)

		displayLang := strings.ToUpper(lang)
		if displayLang == "" {
			displayLang = "TEXT"
		}

		var lexer chroma.Lexer
		if lang != "" {
			lexer = lexers.Get(lang)
		}
		if lexer == nil {
			lexer = lexers.Analyse(rawCode)
		}
		if lexer == nil {
			lexer = lexers.Fallback
		}
		lexer = chroma.Coalesce(lexer)

		iterator, err := lexer.Tokenise(nil, rawCode)
		if err != nil {
			return match
		}

		var codeBuf bytes.Buffer
		if err := formatter.Format(&codeBuf, style, iterator); err != nil {
			return match
		}

		escapedCodeForCopy := html.EscapeString(rawCode)

		return fmt.Sprintf(
			`<div class="code-block-container">`+
				`<div class="code-block-header">`+
				`<span class="code-lang">%s</span>`+
				`<button class="copy-btn" onclick="copyCode(this)" data-code="%s">Copy</button>`+
				`</div>`+
				`<pre><code>%s</code></pre>`+
				`</div>`,
			html.EscapeString(displayLang),
			html.EscapeString(escapedCodeForCopy),
			codeBuf.String(),
		)
	})
}

func resolveImages(rawHTML string, baseDir string) string {
	return imgRegex.ReplaceAllStringFunc(rawHTML, func(match string) string {
		submatches := imgRegex.FindStringSubmatch(match)
		if len(submatches) < 3 {
			return match
		}

		fullImg := submatches[0]
		src := submatches[2]

		// Ignore HTTP/HTTPS or data URLs
		if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") || strings.HasPrefix(src, "data:") {
			return match
		}

		// Resolve local relative path
		localPath := src
		if strings.HasPrefix(src, "file://") {
			localPath = strings.TrimPrefix(src, "file://")
			localPath = strings.TrimPrefix(localPath, "/")
		}

		// Handle URL decoding (e.g. %20 space)
		if decoded, err := url.QueryUnescape(localPath); err == nil {
			localPath = decoded
		}

		if !filepath.IsAbs(localPath) {
			localPath = filepath.Join(baseDir, localPath)
		}

		// Try embedding small/medium local images as base64 for reliable WebView rendering
		if info, err := os.Stat(localPath); err == nil && !info.IsDir() && info.Size() < 15*1024*1024 {
			data, err := os.ReadFile(localPath)
			if err == nil {
				ext := strings.ToLower(filepath.Ext(localPath))
				mimeType := mime.TypeByExtension(ext)
				if mimeType == "" {
					switch ext {
					case ".png":
						mimeType = "image/png"
					case ".jpg", ".jpeg":
						mimeType = "image/jpeg"
					case ".gif":
						mimeType = "image/gif"
					case ".webp":
						mimeType = "image/webp"
					case ".svg":
						mimeType = "image/svg+xml"
					default:
						mimeType = "image/png"
					}
				}
				b64 := base64.StdEncoding.EncodeToString(data)
				dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, b64)
				return strings.Replace(fullImg, src, dataURL, 1)
			}
		}

		// Fallback to file:/// URL
		fileURL := "file:///" + filepath.ToSlash(localPath)
		return strings.Replace(fullImg, src, fileURL, 1)
	})
}

func extractTOCAndAddAnchors(rawHTML string) ([]document.TOCItem, string) {
	var toc []document.TOCItem
	idCounts := make(map[string]int)

	slugify := func(text string) string {
		slug := strings.ToLower(text)
		slug = regexp.MustCompile(`[^\w\s-]`).ReplaceAllString(slug, "")
		slug = regexp.MustCompile(`[\s_]+`).ReplaceAllString(slug, "-")
		slug = strings.Trim(slug, "-")
		if slug == "" {
			slug = "section"
		}
		if count, exists := idCounts[slug]; exists {
			idCounts[slug] = count + 1
			slug = fmt.Sprintf("%s-%d", slug, count)
		} else {
			idCounts[slug] = 1
		}
		return slug
	}

	// First pass: locate or generate heading tags with IDs
	tagRegex := regexp.MustCompile(`(?i)<h([1-4])([^>]*)>(.*?)</h[1-4]>`)
	processedHTML := tagRegex.ReplaceAllStringFunc(rawHTML, func(match string) string {
		sub := tagRegex.FindStringSubmatch(match)
		if len(sub) < 4 {
			return match
		}

		levelStr := sub[1]
		level := int(levelStr[0] - '0')
		attrs := sub[2]
		headingInner := sub[3]

		// Strip tags inside heading for plain text TOC
		plainText := regexp.MustCompile(`<[^>]*>`).ReplaceAllString(headingInner, "")
		plainText = html.UnescapeString(strings.TrimSpace(plainText))

		var id string
		if strings.Contains(attrs, `id=`) {
			idMatch := regexp.MustCompile(`id=["']([^"']+)["']`).FindStringSubmatch(attrs)
			if len(idMatch) > 1 {
				id = idMatch[1]
			}
		}

		if id == "" {
			id = slugify(plainText)
			attrs = fmt.Sprintf(` id="%s"%s`, id, attrs)
		}

		toc = append(toc, document.TOCItem{
			Level: level,
			Text:  plainText,
			ID:    id,
		})

		return fmt.Sprintf(`<h%s%s>%s</h%s>`, levelStr, attrs, headingInner, levelStr)
	})

	return toc, processedHTML
}
