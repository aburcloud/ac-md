# MDView --- End-to-End Implementation Specification

## 1. Project Definition

Build **MDView**, a lightweight native-feeling Markdown document viewer
for Windows.

The purpose is simple:

> Open a `.md` file quickly and read it comfortably without launching an
> IDE, browser-based documentation application, Electron application, or
> other heavyweight software.

MDView is a **reader**, not a Markdown editor.

The primary interaction is:

``` text
Double-click README.md
        ↓
      MDView
        ↓
    Render Markdown
        ↓
       Read
```

The application must remain small in scope, fast to start, easy to
understand, and easy to maintain.

The project should be implemented as a production-quality Go desktop
application with a minimal UI.

------------------------------------------------------------------------

# 2. Product Goals

## Primary goals

1.  Open Markdown files extremely quickly.
2.  Render Markdown with high visual fidelity.
3.  Provide a comfortable reading experience.
4.  Support syntax-highlighted code blocks.
5.  Support images and links.
6.  Support large Markdown documents.
7.  Support automatic reload when the underlying file changes.
8.  Support Windows file association.
9.  Support command-line opening.
10. Keep the application architecture simple.
11. Avoid unnecessary services, accounts, databases, cloud dependencies,
    or telemetry.
12. Make the executable suitable for everyday use.

## Non-goals

Do NOT build:

-   a Markdown editor
-   a full IDE
-   a documentation management platform
-   a browser
-   an Electron application
-   an AI assistant
-   a cloud synchronization system
-   user accounts
-   authentication
-   a database
-   a plugin marketplace
-   collaboration
-   comments
-   analytics
-   telemetry
-   remote document storage
-   a Markdown publishing platform

The application should solve one problem exceptionally well:

> **Read Markdown locally.**

------------------------------------------------------------------------

# 3. Target Platform

Primary target:

``` text
Windows 10+
Windows 11
x64
```

Architecture should be written so that future Linux/macOS support is
possible, but Windows is the first-class target.

Do not introduce cross-platform abstractions prematurely.

------------------------------------------------------------------------

# 4. Technology Requirements

## Required

Use:

``` text
Go
HTML
CSS
JavaScript
WebView2
```

The Go application owns:

-   application lifecycle
-   command-line arguments
-   file opening
-   file watching
-   Markdown parsing
-   configuration
-   window management
-   communication with the UI

The WebView2 layer owns:

-   document presentation
-   scrolling
-   typography
-   code presentation
-   table rendering
-   interactive links
-   find-in-document
-   UI behavior

The application must not require Node.js at runtime.

Do not bundle a Chromium browser.

Use the Windows WebView2 runtime rather than shipping an entire browser
engine.

------------------------------------------------------------------------

# 5. Recommended Dependencies

Choose mature, actively maintained Go libraries.

For Markdown parsing, evaluate:

``` text
github.com/yuin/goldmark
```

For syntax highlighting, evaluate:

``` text
github.com/alecthomas/chroma
```

For filesystem watching, evaluate:

``` text
github.com/fsnotify/fsnotify
```

For Windows WebView2 integration, choose a maintained Go WebView2
binding appropriate for the current Go version.

Do not blindly copy dependency choices.

Before implementation, verify:

-   current stable releases
-   Windows compatibility
-   licensing
-   maintenance activity
-   Go version compatibility
-   WebView2 compatibility
-   x64 support

Keep dependencies to the minimum necessary set.

------------------------------------------------------------------------

# 6. High-Level Architecture

The architecture should be:

``` text
                    ┌──────────────────────┐
                    │     mdview.exe       │
                    │                      │
                    │       Go Core        │
                    │                      │
                    │ ┌──────────────────┐ │
                    │ │ Application      │ │
                    │ │ Lifecycle        │ │
                    │ └──────────────────┘ │
                    │          │           │
                    │ ┌──────────────────┐ │
                    │ │ File Manager     │ │
                    │ └──────────────────┘ │
                    │          │           │
                    │ ┌──────────────────┐ │
                    │ │ Markdown Parser  │ │
                    │ └──────────────────┘ │
                    │          │           │
                    │ ┌──────────────────┐ │
                    │ │ File Watcher     │ │
                    │ └──────────────────┘ │
                    │          │           │
                    │ └────────┬─────────┘ │
                    │          │           │
                    │      WebView2        │
                    │          │           │
                    │ ┌──────────────────┐ │
                    │ │ HTML/CSS/JS UI   │ │
                    │ └──────────────────┘ │
                    └──────────────────────┘
```

The Go process is the source of truth.

The frontend must not independently read arbitrary files from disk.

------------------------------------------------------------------------

# 7. Project Structure

Use a structure similar to:

``` text
mdview/
│
├── cmd/
│   └── mdview/
│       └── main.go
│
├── internal/
│   ├── app/
│   │   ├── app.go
│   │   └── lifecycle.go
│   │
│   ├── document/
│   │   ├── document.go
│   │   ├── loader.go
│   │   └── metadata.go
│   │
│   ├── markdown/
│   │   ├── parser.go
│   │   ├── renderer.go
│   │   └── sanitize.go
│   │
│   ├── watcher/
│   │   └── watcher.go
│   │
│   ├── window/
│   │   ├── window.go
│   │   └── state.go
│   │
│   ├── config/
│   │   ├── config.go
│   │   └── paths.go
│   │
│   └── platform/
│       └── windows.go
│
├── web/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── assets/
│   └── icons/
│
├── scripts/
│   ├── build.ps1
│   └── install.ps1
│
├── docs/
│   ├── architecture.md
│   ├── development.md
│   └── testing.md
│
├── go.mod
├── go.sum
├── README.md
└── LICENSE
```

Keep package responsibilities clear.

Do not create meaningless abstractions.

------------------------------------------------------------------------

# 8. Core Domain Model

Define a document model.

Example conceptual model:

``` go
type Document struct {
    Path         string
    Name         string
    Content      string
    RenderedHTML string
    ModifiedAt   time.Time
    Size         int64
}
```

The actual implementation may differ.

The important separation is:

``` text
file
 ↓
document
 ↓
markdown AST
 ↓
HTML
 ↓
WebView
```

Do not mix file loading with UI rendering.

------------------------------------------------------------------------

# 9. Application Startup

The application must support:

``` powershell
mdview.exe
```

and:

``` powershell
mdview.exe README.md
```

and:

``` powershell
mdview.exe "C:\Projects\docs\architecture.md"
```

Behavior:

### No argument

Open an empty reader window with a minimal open-file state.

### One Markdown file

Open the file immediately.

### Directory

Optional v1.1 behavior:

Open directory/document browser mode.

### Unsupported file

Display a clear error.

Example:

``` text
Unsupported file type.

MDView supports:
.md
.markdown
```

------------------------------------------------------------------------

# 10. File Loading

The loader must:

1.  Resolve the supplied path.
2.  Verify the file exists.
3.  Verify it is a regular file.
4.  Read it as UTF-8.
5.  Detect invalid UTF-8 safely.
6.  Gather metadata.
7.  Parse Markdown.
8.  Render HTML.
9.  Send the document to the WebView.

Do not silently ignore read errors.

Return structured errors.

------------------------------------------------------------------------

# 11. Markdown Support

Support at minimum:

## Headings

``` markdown
# H1
## H2
### H3
#### H4
```

## Paragraphs

``` markdown
This is a paragraph.
```

## Emphasis

``` markdown
**bold**
*italic*
***bold italic***
~~strikethrough~~
```

## Links

``` markdown
[Go](https://go.dev)
```

## Images

``` markdown
![Architecture](./architecture.png)
```

## Lists

``` markdown
- item
- item
  - nested item
```

## Ordered lists

``` markdown
1. first
2. second
3. third
```

## Task lists

``` markdown
- [x] completed
- [ ] pending
```

## Blockquotes

``` markdown
> Important information.
```

## Code

Inline:

``` markdown
Use `go test ./...`.
```

Block:

```` markdown
```go
package main

func main() {}
```
````

## Tables

``` markdown
| Service | Purpose |
|---------|---------|
| API     | HTTP API |
| DB      | Storage |
```

## Horizontal rules

``` markdown
---
```

## Escaping

Correctly handle Markdown escaping.

------------------------------------------------------------------------

# 12. Code Syntax Highlighting

Code blocks must be rendered with syntax highlighting.

Example:

``` go
package main

import "fmt"

func main() {
    fmt.Println("hello")
}
```

The viewer should recognize common languages.

At minimum:

``` text
Go
Python
JavaScript
TypeScript
JSON
YAML
TOML
Bash
Shell
PowerShell
SQL
HTML
CSS
C
C++
Rust
Java
Dockerfile
Terraform/HCL
Markdown
XML
```

Unknown languages must degrade gracefully to plain code.

Never fail document rendering because a language identifier is unknown.

------------------------------------------------------------------------

# 13. Code Block UI

Every code block should provide:

-   language label
-   horizontal scrolling
-   readable line-height
-   monospace font
-   copy button

Example:

``` text
┌──────────────────────────────────────────────┐
│ GO                                     COPY  │
├──────────────────────────────────────────────┤
│ package main                                 │
│                                              │
│ func main() {                                │
│     println("hello")                         │
│ }                                            │
└──────────────────────────────────────────────┘
```

The copy button should copy only the code.

------------------------------------------------------------------------

# 14. Images

Support:

``` markdown
![description](./image.png)
```

Relative paths must resolve relative to the Markdown document.

For:

``` text
docs/
├── README.md
└── images/
    └── architecture.png
```

This:

``` markdown
![Architecture](./images/architecture.png)
```

must work.

Support common image types:

``` text
PNG
JPEG
GIF
WebP
SVG
```

If an image cannot be loaded, show a graceful placeholder.

------------------------------------------------------------------------

# 15. Links

Support external links.

When the user clicks:

``` markdown
https://example.com
```

open the URL using the system browser.

Do not navigate the entire WebView away from the Markdown document
unless explicitly intended.

External navigation must be intercepted.

------------------------------------------------------------------------

# 16. Local Markdown Links

Support:

``` markdown
[Architecture](./architecture.md)
```

Clicking it should open the linked Markdown file in MDView.

Also support:

``` markdown
[Deployment](deployment.md#production)
```

Open the document and navigate to the corresponding heading.

------------------------------------------------------------------------

# 17. Anchors

Generate stable anchors for headings.

Example:

``` markdown
## Production Deployment
```

becomes conceptually:

``` html
<h2 id="production-deployment">
    Production Deployment
</h2>
```

Handle duplicate headings safely.

------------------------------------------------------------------------

# 18. Table of Contents

Provide an optional document outline.

Default state:

``` text
hidden
```

Toggle:

``` text
Ctrl+Shift+T
```

The outline should contain:

``` text
# Architecture
    ## Overview
    ## Components
        ### API
        ### Database
    ## Deployment
    ## Troubleshooting
```

Clicking an entry scrolls to the heading.

The outline should not dominate the reading experience.

------------------------------------------------------------------------

# 19. Find

Implement:

``` text
Ctrl+F
```

Show a minimal search bar.

Required:

-   search text
-   next match
-   previous match
-   match count
-   Escape closes search

Example:

``` text
┌──────────────────────────────┐
│ server             3 / 8     │
└──────────────────────────────┘
```

Use WebView/browser-native search capabilities where practical.

Do not build a complicated search engine for v1.

------------------------------------------------------------------------

# 20. Zoom

Support:

``` text
Ctrl++
Ctrl+-
Ctrl+0
```

Default:

``` text
100%
```

Reasonable range:

``` text
50% → 200%
```

Display current zoom unobtrusively.

Persist zoom if practical.

------------------------------------------------------------------------

# 21. Reading Width

Markdown should not span the entire monitor.

Use a readable content width.

Example:

``` css
.reader {
    max-width: 900px;
    margin: 0 auto;
}
```

For very wide displays, the text should remain comfortable to read.

Code blocks may overflow horizontally.

------------------------------------------------------------------------

# 22. Typography

Use a high-quality system-friendly typography stack.

Body:

``` css
font-family:
    Inter,
    "Segoe UI",
    system-ui,
    sans-serif;
```

Code:

``` css
font-family:
    "JetBrains Mono",
    "Cascadia Code",
    Consolas,
    monospace;
```

Do not require users to install fonts.

Provide fallbacks.

------------------------------------------------------------------------

# 23. Visual Design

The application should feel like a **minimal technical document reader**, not a
web application or IDE.

The visual system is based on:

```text
Neutral palette: Zinc
Default accent:  Deep Orange
Themes:          Light / Dark
```

Characteristics:

- minimal chrome
- generous whitespace
- readable typography
- subtle borders
- restrained accent usage
- no gradients
- no unnecessary animations
- no marketing UI
- no persistent sidebar
- no dashboard
- no clutter
- no excessive cards

The document itself must remain the visual focus.

The **Zinc neutral palette is fixed** and cannot be changed by the user.

The **accent color is configurable**.

All theme and accent colors must be implemented through centralized semantic
CSS variables rather than scattered hard-coded values.

---

# 24. Light Theme

Use Zinc as the fixed neutral foundation.

Recommended tokens:

```css
[data-theme="light"] {
    --background: #fafafa;
    --foreground: #18181b;

    --surface: #f4f4f5;
    --surface-raised: #ffffff;

    --muted: #71717a;
    --border: #e4e4e7;

    --code-background: #f4f4f5;

    --accent: #ea580c;
    --accent-hover: #c2410c;
    --accent-muted: #fff7ed;
    --accent-foreground: #ffffff;
}
```

The page should feel like a clean technical book.

Use Zinc surfaces to create hierarchy instead of excessive cards or shadows.

---

# 25. Dark Theme

Use a **deep Zinc** foundation rather than pure black.

Recommended tokens:

```css
[data-theme="dark"] {
    --background: #09090b;
    --foreground: #f4f4f5;

    --surface: #18181b;
    --surface-raised: #27272a;

    --muted: #a1a1aa;
    --border: #27272a;

    --code-background: #0c0c0f;

    --accent: #f97316;
    --accent-hover: #fb923c;
    --accent-muted: #431407;
    --accent-foreground: #ffffff;
}
```

The dark theme should feel like:

```text
deep Zinc
+
subtle deep-orange highlights
```

not:

```text
black
+
orange everywhere
```

Use orange selectively for:

- links
- focused controls
- active outline entries
- selected controls
- primary actions
- progress indicators
- copy-code feedback
- important interactive states

Do not use orange as the primary body-text color.

---

# 26. Theme and Accent Configuration

Support two actual visual themes:

```text
Light
Dark
```

A `System` preference may optionally select between those two based on the
Windows appearance setting, but there must not be a third independent visual
theme.

Required shortcut:

```text
Ctrl+Shift+D
```

Behavior:

```text
Light → Dark
Dark  → Light
```

Persist the selected theme.

## Fixed Neutral Palette

The neutral palette is always:

```text
Zinc
```

There is no neutral-palette selector.

Do not offer:

```text
Gray
Slate
Stone
Neutral
```

as alternative neutral systems.

## Configurable Accent

The default accent is:

```text
Deep Orange
```

Represent the accent through semantic variables:

```css
--accent
--accent-hover
--accent-muted
--accent-foreground
```

The application may provide a small accent selector with choices such as:

```text
Deep Orange
Amber
Red
Blue
Indigo
Violet
Green
Cyan
```

Changing the accent must **not** change the Zinc neutral palette.

For example:

```text
Theme:  Dark
Neutral: Zinc       ← fixed
Accent: Deep Orange ← configurable
```

Changing the accent must not turn backgrounds, borders, or large surfaces into
the accent color.

## Accent Usage Rules

Use the accent primarily for:

```text
links
focus rings
active states
selected controls
primary buttons
outline selection
small status indicators
```

Do not use the accent for:

```text
entire headings
entire paragraphs
large backgrounds
large cards
entire code blocks
the whole toolbar
```

## Focus

Use the configured accent for keyboard focus:

```css
:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}
```

## Links

Links use the configured accent:

```css
a {
    color: var(--accent);
}

a:hover {
    color: var(--accent-hover);
}
```

## Code Blocks

Code containers remain primarily Zinc.

```text
Dark:
    background → near-black Zinc
    border     → Zinc-800
    controls   → Zinc surfaces
    focus      → accent

Light:
    background → Zinc-100
    border     → Zinc-200
    controls   → Zinc surfaces
    focus      → accent
```

Do not tint the entire code block orange.

Syntax highlighting may use multiple semantic colors, but the overall code
container must remain neutral.

## Controls

Normal controls use Zinc surfaces.

```text
normal   → Zinc
hover    → slightly stronger Zinc surface
focus    → accent outline
active   → subtle accent border/background
primary  → accent
```

Do not make every button orange.

The primary action may use the accent; secondary actions should remain Zinc.

## Centralized Design Tokens

Use a root token definition similar to:

```css
:root {
    --zinc-50:  #fafafa;
    --zinc-100: #f4f4f5;
    --zinc-200: #e4e4e7;
    --zinc-300: #d4d4d8;
    --zinc-400: #a1a1aa;
    --zinc-500: #71717a;
    --zinc-600: #52525b;
    --zinc-700: #3f3f46;
    --zinc-800: #27272a;
    --zinc-900: #18181b;
    --zinc-950: #09090b;
}
```

Do not write raw accent hex values throughout components.

Prefer:

```css
color: var(--accent);
background: var(--surface);
border-color: var(--border);
```

This keeps theme and accent behavior predictable.

------------------------------------------------------------------------

# 27. Window Design

The application should open as a normal Windows desktop window.

Requirements:

-   resizable
-   minimize
-   maximize
-   close
-   remember last size
-   remember last position if practical
-   remember maximized state
-   minimum usable window size

Default window size:

``` text
1200 × 800
```

Do not open full-screen by default.

------------------------------------------------------------------------

# 28. Title Bar

The title should contain the filename.

Example:

``` text
architecture.md — MDView
```

For unsaved/empty state:

``` text
MDView
```

Do not show the entire absolute path in the title.

------------------------------------------------------------------------

# 29. Minimal Toolbar

The toolbar should be optional/minimal.

Possible controls:

``` text
←
→
Open
Contents
Theme
Zoom
```

However, keyboard shortcuts should remain the primary interaction
mechanism.

Do not create a giant toolbar.

------------------------------------------------------------------------

# 30. Drag and Drop

Support dragging a Markdown file onto the application window.

Behavior:

``` text
drag README.md
       ↓
    MDView
       ↓
  render file
```

Dragging an unsupported file should show a brief non-blocking message.

------------------------------------------------------------------------

# 31. Automatic Reload

Use filesystem watching.

When:

``` text
README.md
```

changes on disk:

``` text
fsnotify event
      ↓
debounce
      ↓
read file
      ↓
parse
      ↓
render
      ↓
update WebView
```

Important:

Editors often produce multiple filesystem events for a single save.

Implement debouncing.

Recommended initial debounce:

``` text
100–300 ms
```

Do not reload continuously while the file is being written.

------------------------------------------------------------------------

# 32. Reload UX

When a document changes:

Prefer:

``` text
preserve scroll position
```

If possible:

1.  Identify current heading/anchor.
2.  Reload content.
3.  Restore position.
4.  Fall back to approximate scroll percentage.

Do not unexpectedly jump the user to the top.

------------------------------------------------------------------------

# 33. File Association

Provide an installer or installation script that can register:

``` text
.md
.markdown
```

with MDView.

Right-click behavior should allow:

``` text
Open with MDView
```

Double-clicking a Markdown file should launch:

``` text
mdview.exe "C:\path\file.md"
```

------------------------------------------------------------------------

# 34. Command-Line Interface

Support:

``` powershell
mdview README.md
```

Optional flags:

``` text
--dark
--light
--zoom 120
--no-watch
```

Do not over-engineer the CLI.

The CLI exists primarily to open documents.

------------------------------------------------------------------------

# 35. Multiple Files

v1 should prioritize one document per window.

Optional future behavior:

``` powershell
mdview a.md b.md c.md
```

could open multiple windows.

Do not implement tabs unless there is a strong reason.

Tabs make the reader more application-like and increase complexity.

------------------------------------------------------------------------

# 36. Security

Markdown is untrusted input.

Treat Markdown files as potentially malicious.

Requirements:

-   sanitize generated HTML
-   do not execute arbitrary JavaScript from Markdown
-   carefully handle raw HTML
-   restrict navigation
-   restrict local resource access where appropriate
-   prevent arbitrary script execution
-   avoid dangerous URL schemes

Reject or neutralize:

``` text
javascript:
data:
vbscript:
```

where they could create script execution or unsafe navigation.

Raw HTML should be either:

``` text
sanitized
```

or:

``` text
disabled
```

depending on the Markdown parser configuration.

Security takes precedence over perfect GitHub compatibility.

------------------------------------------------------------------------

# 37. External Links

Allow:

``` text
https://
http://
mailto:
```

according to the desired policy.

Open external links through the operating system/browser.

Do not let arbitrary web pages take over the application window.

------------------------------------------------------------------------

# 38. Performance Requirements

Target startup:

``` text
< 500 ms
```

for a normal local Markdown file, excluding unusual WebView2
initialization conditions.

For a normal document:

``` text
< 100 ms
```

target for Markdown parsing/rendering.

The application must remain responsive for documents of several
megabytes.

Avoid unnecessary DOM complexity.

Do not use a JavaScript framework.

Use:

``` text
plain JavaScript
```

unless a framework becomes demonstrably necessary.

It should not.

------------------------------------------------------------------------

# 39. Large Document Handling

Test documents:

``` text
100 KB
500 KB
1 MB
5 MB
10 MB
```

The application must:

-   open without crashing
-   remain responsive
-   scroll smoothly
-   avoid excessive memory duplication
-   handle large code blocks
-   handle large tables reasonably

Do not optimize prematurely, but measure performance.

------------------------------------------------------------------------

# 40. Error Handling

Errors must be understandable.

Example:

``` text
Unable to open document

C:\Projects\README.md

Reason:
The file could not be read.

[Retry] [Close]
```

Do not expose raw stack traces to users.

Log technical details separately.

------------------------------------------------------------------------

# 41. Logging

Development logging should be available.

Production behavior should be quiet.

Log categories:

``` text
startup
file
markdown
watcher
webview
window
error
```

Do not log document contents by default.

Do not log sensitive file paths unnecessarily.

No telemetry.

------------------------------------------------------------------------

# 42. Configuration

Use a small local configuration file only if required.

Possible location:

``` text
%APPDATA%\MDView\
```

Possible settings:

``` json
{
    "theme": "system",
    "zoom": 100,
    "window": {
        "width": 1200,
        "height": 800
    }
}
```

Do not introduce a configuration database.

JSON or another simple local format is sufficient.

------------------------------------------------------------------------

# 43. State Management

Persist only useful state:

``` text
theme
zoom
window size
window position
maximized state
```

Do not persist document content.

Do not create browsing history unless explicitly requested.

------------------------------------------------------------------------

# 44. Architecture Principles

Follow these rules:

## Single responsibility

Each package should have one clear responsibility.

## Dependency direction

Prefer:

``` text
cmd
 ↓
app
 ↓
domain/services
 ↓
platform
```

Avoid circular dependencies.

## UI independence

The Markdown renderer should not depend directly on WebView2.

The renderer should produce a representation that can be tested
independently.

## Testability

File loading, Markdown rendering, path resolution, heading generation,
and configuration must be testable without opening a real desktop
window.

------------------------------------------------------------------------

# 45. Rendering Pipeline

Implement:

``` text
Markdown file
      │
      ▼
UTF-8 text
      │
      ▼
Markdown parser
      │
      ▼
AST
      │
      ▼
HTML renderer
      │
      ├── syntax highlighting
      ├── heading IDs
      ├── image paths
      ├── links
      └── task lists
      │
      ▼
sanitized HTML
      │
      ▼
WebView2
```

Do not concatenate untrusted strings into HTML without
escaping/sanitization.

------------------------------------------------------------------------

# 46. HTML Document Structure

Generate a complete document similar to:

``` html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">
    <title>MDView</title>
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <main id="document">
        <!-- rendered Markdown -->
    </main>

    <script src="app.js"></script>
</body>
</html>
```

Keep the frontend dependency-free.

------------------------------------------------------------------------

# 47. Frontend JavaScript

The JavaScript should be small.

Responsibilities:

-   theme changes
-   zoom
-   find UI
-   outline navigation
-   copy code
-   scroll restoration
-   keyboard shortcuts
-   communication with Go

Do not build an SPA.

Do not introduce React.

Do not introduce Redux.

Do not introduce a frontend router.

------------------------------------------------------------------------

# 48. Go ↔ WebView Communication

Define a small message protocol.

Example conceptual messages:

``` json
{
    "type": "document.load",
    "payload": {
        "title": "README.md",
        "html": "<article>...</article>"
    }
}
```

Other events:

``` text
document.open
document.reload
theme.set
zoom.set
window.close
external.open
```

Keep the protocol explicit.

Validate messages.

Do not allow arbitrary commands from the renderer.

------------------------------------------------------------------------

# 49. Browser Context

The WebView is a renderer, not the application core.

Do not expose unnecessary Go APIs.

Expose only capabilities that are required.

For example:

``` text
open external URL
request application state
notify file navigation
```

Avoid a generic:

``` text
execute arbitrary Go command
```

interface.

------------------------------------------------------------------------

# 50. Testing Strategy

Testing must exist from the beginning.

## Unit tests

Test:

``` text
Markdown parsing
HTML generation
heading IDs
relative image paths
relative Markdown links
unsupported URLs
UTF-8 handling
configuration
path normalization
```

## Integration tests

Test:

``` text
open Markdown file
reload changed file
open linked Markdown file
external link handling
configuration persistence
```

## Manual Windows tests

Test:

``` text
double-click .md
Open With
drag/drop
command line
maximize
restore
dark mode
light mode
large documents
broken images
broken links
invalid Markdown
file deleted while open
file renamed while open
editor save events
```

------------------------------------------------------------------------

# 51. Test Fixtures

Create:

``` text
testdata/
├── basic.md
├── headings.md
├── lists.md
├── tables.md
├── code.md
├── links.md
├── images.md
├── tasks.md
├── unicode.md
├── malformed.md
├── large.md
└── security.md
```

The security fixture should contain potentially dangerous HTML and URLs.

Verify that they are neutralized.

------------------------------------------------------------------------

# 52. Build

Provide:

``` powershell
go build ./...
```

Development build:

``` powershell
go run ./cmd/mdview README.md
```

Production build:

``` powershell
go build -trimpath -ldflags="-s -w" -o mdview.exe ./cmd/mdview
```

Verify the final binary actually runs on a clean Windows machine.

------------------------------------------------------------------------

# 53. Version Information

Embed:

``` text
version
commit
build date
```

where practical.

Example:

``` text
MDView 0.1.0
```

Do not build a complicated update system for v1.

------------------------------------------------------------------------

# 54. Installer

Create a simple Windows installation path.

Possible options:

``` text
MSI
Inno Setup
NSIS
```

Choose the simplest reliable option.

Installer responsibilities:

-   install executable
-   create Start Menu entry
-   optionally create desktop shortcut
-   register `.md`
-   register `.markdown`
-   uninstall cleanly

Do not install unnecessary dependencies.

------------------------------------------------------------------------

# 55. Portable Build

Also provide:

``` text
mdview.exe
```

as a portable executable.

A user should be able to copy it to another machine and run it.

If WebView2 runtime is unavailable, provide a clear installation error
rather than crashing.

------------------------------------------------------------------------

# 56. README

The repository README must explain:

``` text
What MDView is
Why it exists
Features
Installation
Portable usage
Command-line usage
Keyboard shortcuts
Development
Building
Testing
Architecture
License
```

Example:

``` powershell
mdview README.md
```

------------------------------------------------------------------------

# 57. Keyboard Shortcut Specification

Implement:

  Shortcut       Action
  -------------- --------------------
  Ctrl+O         Open
  Ctrl+F         Find
  Ctrl+R         Reload
  Ctrl++         Zoom in
  Ctrl+-         Zoom out
  Ctrl+0         Reset zoom
  Ctrl+Shift+D   Toggle theme
  Ctrl+Shift+T   Toggle outline
  Ctrl+Home      Top
  Ctrl+End       Bottom
  Escape         Close transient UI
  Alt+Left       Previous document
  Alt+Right      Next document

Do not implement shortcuts that conflict with normal browser/document
behavior unless necessary.

------------------------------------------------------------------------

# 58. Accessibility

Support:

-   keyboard navigation
-   visible focus states
-   semantic headings
-   semantic lists
-   semantic tables
-   sufficient contrast
-   screen-reader-friendly HTML where practical
-   scalable typography

Do not make important actions mouse-only.

------------------------------------------------------------------------

# 59. Internationalization

Do not build a full translation system for v1.

However:

-   use UTF-8 everywhere
-   support Unicode Markdown
-   support Arabic
-   support Hindi
-   support CJK
-   support emoji
-   do not assume ASCII filenames
-   do not assume left-to-right content

The reader should handle:

``` markdown
# مرحباً
```

and:

``` markdown
# नमस्ते
```

correctly.

------------------------------------------------------------------------

# 60. Right-to-Left Support

Detect or respect document direction where practical.

For Arabic content, the rendered document should remain readable.

Do not hard-code:

``` css
direction: ltr;
```

for every document element.

------------------------------------------------------------------------

# 61. Image Path Security

Images should be resolved relative to the opened Markdown document.

Do not allow Markdown to arbitrarily access unrelated files through
unsafe path manipulation.

Normalize paths.

Reject dangerous traversal where it violates the application's
local-document security model.

------------------------------------------------------------------------

# 62. Resource Handling

The application must correctly handle:

``` text
C:\Projects\docs\README.md
C:\Projects\docs\images\a.png
```

Spaces:

``` text
C:\My Projects\README.md
```

Unicode:

``` text
C:\Projects\مستندات\README.md
```

Network paths if Windows APIs permit:

``` text
\\server\share\README.md
```

Do not assume paths are ASCII.

------------------------------------------------------------------------

# 63. Single Instance

Consider implementing single-instance behavior.

If MDView is already running and the user double-clicks another Markdown
file:

``` text
existing MDView
       ↑
new file request
       │
existing process opens file
```

This is preferable to spawning dozens of windows.

However, make this behavior configurable or defer it if it significantly
complicates v1.

------------------------------------------------------------------------

# 64. Document Navigation

Maintain a lightweight document history:

``` text
A.md
 ↓
B.md
 ↓
C.md
```

Then:

``` text
Alt+Left
```

returns to:

``` text
B.md
```

and:

``` text
Alt+Right
```

returns to:

``` text
C.md
```

Do not persist this history across application launches in v1.

------------------------------------------------------------------------

# 65. Empty State

When no document is open, show:

``` text
MDView

Open a Markdown file

Ctrl+O
```

Optionally support drag-and-drop.

Do not display a dashboard.

------------------------------------------------------------------------

# 66. Loading State

For large files:

``` text
Opening document…
```

Keep the UI responsive.

Never freeze the window while doing expensive parsing.

------------------------------------------------------------------------

# 67. Threading / Concurrency

Do not perform expensive operations on the UI thread.

Conceptually:

``` text
UI
 │
 ├── request file
 │
 ▼
worker
 │
 ├── read
 ├── parse
 ├── render
 └── sanitize
 │
 ▼
UI update
```

Protect shared state.

Avoid data races.

Run:

``` powershell
go test -race ./...
```

where supported by the build environment.

------------------------------------------------------------------------

# 68. File Watcher Edge Cases

Handle:

``` text
write
rename
remove
create
chmod
multiple write events
temporary files
atomic-save patterns
```

Many editors save by:

``` text
write temporary file
rename temporary file
replace original
```

The watcher must recover from this.

If the original file disappears temporarily, do not immediately destroy
the document.

Retry intelligently.

------------------------------------------------------------------------

# 69. Graceful Shutdown

On close:

1.  stop filesystem watchers
2.  stop background workers
3.  persist window state
4.  release WebView resources
5.  exit cleanly

No goroutine leaks.

------------------------------------------------------------------------

# 70. Resource Lifecycle

All resources must have clear ownership.

Examples:

``` text
watcher.Start()
watcher.Stop()

window.Create()
window.Close()

document.Load()
document.Release()
```

Avoid hidden global state.

------------------------------------------------------------------------

# 71. Code Quality Requirements

The generated code must:

-   compile
-   pass tests
-   use idiomatic Go
-   use context where appropriate
-   handle errors explicitly
-   avoid unnecessary interfaces
-   avoid global mutable state
-   avoid premature abstraction
-   avoid dead code
-   avoid TODO placeholders for core functionality

Do not generate pseudo-code where working code is required.

------------------------------------------------------------------------

# 72. Error Handling Rules

Do not do this:

``` go
if err != nil {
    return nil
}
```

unless intentionally handling an ignorable error.

Prefer:

``` go
if err != nil {
    return fmt.Errorf("load document: %w", err)
}
```

Errors should preserve context.

------------------------------------------------------------------------

# 73. Logging Rules

Do not log:

``` text
entire Markdown documents
```

Do log:

``` text
file path
operation
error
duration
```

when useful.

Avoid noisy logs in production.

------------------------------------------------------------------------

# 74. Performance Instrumentation

During development measure:

``` text
startup time
file read time
parse time
render time
WebView update time
memory usage
```

Do not add permanent telemetry.

A local debug mode is sufficient.

------------------------------------------------------------------------

# 75. Development Phases

The AI agent must implement the project in phases.

Do NOT generate the entire project blindly in one operation.

------------------------------------------------------------------------

## Phase 0 --- Repository Inspection

Before writing code:

1.  Inspect the repository.
2.  Determine whether code already exists.
3.  Determine current Go version.
4.  Determine Windows environment.
5.  Determine available WebView2 dependencies.
6.  Inspect existing `go.mod`.
7.  Identify conflicts.
8.  Produce a concise implementation plan.

Do not overwrite existing code without understanding it.

------------------------------------------------------------------------

# 76. Phase 1 --- Minimal Window

Implement:

``` text
Go
 ↓
Windows window
 ↓
WebView2
 ↓
Hello MDView
```

Acceptance criteria:

-   application starts
-   window renders
-   application closes cleanly
-   no crashes
-   no unnecessary framework

------------------------------------------------------------------------

# 77. Phase 2 --- Open Markdown

Implement:

``` text
mdview README.md
```

Pipeline:

``` text
CLI argument
 ↓
file loader
 ↓
Markdown parser
 ↓
HTML
 ↓
WebView
```

Acceptance criteria:

``` text
# Hello
```

renders correctly.

------------------------------------------------------------------------

# 78. Phase 3 --- Complete Markdown

Implement:

-   headings
-   paragraphs
-   lists
-   tables
-   links
-   images
-   blockquotes
-   task lists
-   code
-   emphasis

Add tests.

------------------------------------------------------------------------

# 79. Phase 4 --- Styling

Implement:

-   typography
-   code blocks
-   responsive layout
-   light theme
-   dark theme
-   spacing
-   tables
-   blockquotes

Do not add unnecessary UI.

------------------------------------------------------------------------

# 80. Phase 5 --- Code Highlighting

Integrate syntax highlighting.

Verify:

``` text
Go
Python
TypeScript
JSON
YAML
Bash
PowerShell
Terraform
```

------------------------------------------------------------------------

# 81. Phase 6 --- File Watching

Implement:

``` text
fsnotify
 ↓
debounce
 ↓
reload
 ↓
preserve scroll
```

Test against:

-   VS Code
-   Neovim
-   Notepad
-   PowerShell editors

------------------------------------------------------------------------

# 82. Phase 7 --- Navigation

Implement:

-   Ctrl+F
-   outline
-   heading anchors
-   local Markdown links
-   external links
-   back/forward navigation

------------------------------------------------------------------------

# 83. Phase 8 --- Windows Integration

Implement:

-   `.md` association
-   `.markdown` association
-   drag/drop
-   title updates
-   window state persistence
-   portable build

------------------------------------------------------------------------

# 84. Phase 9 --- Hardening

Perform:

``` text
go test ./...
go vet ./...
go test -race ./...
```

Then manually test:

-   malformed Markdown
-   malicious HTML
-   malicious URLs
-   huge files
-   Unicode
-   Arabic
-   broken images
-   deleted files
-   renamed files
-   atomic editor saves
-   invalid UTF-8

------------------------------------------------------------------------

# 85. Phase 10 --- Packaging

Produce:

``` text
mdview.exe
```

and installer.

Verify:

``` text
clean Windows machine
        ↓
install MDView
        ↓
double-click README.md
        ↓
document opens
```

------------------------------------------------------------------------

# 86. Definition of Done

The project is complete only when:

### Build

``` powershell
go build ./...
```

passes.

### Tests

``` powershell
go test ./...
```

passes.

### Static analysis

``` powershell
go vet ./...
```

passes.

### Functional

The user can:

``` text
double-click README.md
```

and immediately read it.

### Rendering

Common Markdown renders correctly.

### Code

Code blocks are highlighted.

### Images

Relative images work.

### Links

External and local Markdown links work.

### Watcher

Saving the document automatically refreshes it.

### UX

The application feels like a lightweight document reader.

### Security

Untrusted Markdown cannot execute arbitrary scripts.

### Windows

File association works.

### Performance

The application remains responsive with large documents.

------------------------------------------------------------------------

# 87. AI Coding Agent Instructions

You are the implementation agent.

Your job is to build the actual MDView application, not merely describe
it.

Follow these rules.

## Rule 1 --- Inspect before modifying

Always inspect the existing repository before changing it.

## Rule 2 --- Build incrementally

Implement one phase at a time.

After each phase:

``` text
compile
test
inspect
fix
```

before proceeding.

## Rule 3 --- Do not fabricate APIs

If a dependency API is uncertain, inspect its documentation/source or
verify the installed version.

Do not invent function names.

## Rule 4 --- Do not replace working infrastructure unnecessarily

If an existing implementation works, improve it rather than rewriting it
without justification.

## Rule 5 --- Keep the dependency graph small

Every dependency must have a reason.

## Rule 6 --- No frontend framework

Use:

``` text
HTML
CSS
JavaScript
```

unless a strong technical reason requires otherwise.

## Rule 7 --- No Electron

This project exists specifically to avoid heavyweight Markdown
applications.

## Rule 8 --- No database

There is no reason to use one.

## Rule 9 --- No cloud

Everything is local.

## Rule 10 --- No telemetry

Do not collect user data.

------------------------------------------------------------------------

# 88. AI Agent Workflow

For every implementation phase, respond internally with this process:

``` text
1. Inspect
2. Understand
3. Plan
4. Implement
5. Compile
6. Test
7. Review
8. Fix
9. Continue
```

Do not skip validation.

------------------------------------------------------------------------

# 89. Change Discipline

Before changing a file:

Explain:

``` text
File:
Reason:
Change:
Expected effect:
```

After changing it:

Verify:

``` text
Build:
Tests:
Behavior:
```

Avoid unrelated modifications.

------------------------------------------------------------------------

# 90. Code Generation Requirements

When generating code:

-   provide complete files
-   do not provide fragments unless explicitly requested
-   do not use placeholders for core functionality
-   preserve package names
-   preserve imports
-   ensure code compiles
-   ensure referenced files exist
-   ensure assets exist
-   ensure paths are correct

If a change requires multiple files, update all dependent files.

------------------------------------------------------------------------

# 91. Dependency Verification

Before adding a dependency, determine:

``` text
Why is it needed?
Can the standard library solve it?
Is it maintained?
Is the license acceptable?
Does it support the target platform?
Does it work with the current Go version?
```

Prefer standard library solutions where practical.

------------------------------------------------------------------------

# 92. Final Repository Audit

Before declaring completion, inspect:

``` text
go.mod
go.sum
cmd/
internal/
web/
assets/
scripts/
docs/
README.md
```

Look for:

``` text
TODO
FIXME
panic("not implemented")
placeholder
unused files
dead code
debug logs
hardcoded developer paths
```

Remove development artifacts.

------------------------------------------------------------------------

# 93. Final User Experience

The finished application should make this possible:

``` text
User has:
    README.md

User double-clicks it.

Windows launches:
    MDView

Within a moment:

┌─────────────────────────────────────────────┐
│ README.md                              100%│
├─────────────────────────────────────────────┤
│                                             │
│ # Project                                  │
│                                             │
│ A lightweight technical project...          │
│                                             │
│ ## Architecture                             │
│                                             │
│ [diagram]                                   │
│                                             │
│ ## Installation                             │
│                                             │
│ ```powershell                               │
│ go build ./...                              │
│ ```                                         │
│                                             │
└─────────────────────────────────────────────┘
```

The user reads the document and closes the window.

Nothing else gets in the way.

------------------------------------------------------------------------

# 94. Future Features --- Explicitly Deferred

Do not implement these unless requested:

``` text
Markdown editing
tabs
PDF rendering
EPUB
DOCX
AI summaries
cloud sync
accounts
plugins
extensions
annotations
bookmarks
document database
full-text indexing
OCR
collaboration
remote repositories
Git integration
GitHub integration
automatic updates
```

The core product must remain a lightweight Markdown reader.

------------------------------------------------------------------------

# 95. Final Engineering Principle

MDView should follow one principle:

> **The application should disappear and leave the document.**

If the user notices the application more than the Markdown document, the
UI is too complicated.

If opening a Markdown file feels like opening an IDE, the architecture
or UX has failed.

The ideal result is a small, fast, reliable Windows reader that can live
permanently as the default application for `.md` files.
