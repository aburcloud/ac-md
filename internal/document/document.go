package document

import (
	"time"
)

type TOCItem struct {
	Level int    `json:"level"`
	Text  string `json:"text"`
	ID    string `json:"id"`
}

type Document struct {
	Path            string                 `json:"path"`
	Name            string                 `json:"name"`
	Dir             string                 `json:"dir"`
	RawContent      string                 `json:"raw_content"`
	RenderedHTML    string                 `json:"rendered_html"`
	TableOfContents []TOCItem              `json:"table_of_contents"`
	Frontmatter     map[string]interface{} `json:"frontmatter,omitempty"`
	ModifiedAt      time.Time              `json:"modified_at"`
	Size            int64                  `json:"size"`
}
