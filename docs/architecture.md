# MDView Architecture Specification

## Overview

MDView is designed as a ultra-fast native Windows Markdown reader using a Go core backend and a lightweight WebView2 frontend.

```text
┌─────────────────────────────────────────────────────────┐
│                      mdview.exe                         │
│                                                         │
│                      Go Core Engine                     │
│  ┌─────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│  │ Document Loader │ │ Markdown/Chroma│ │ File Watcher│ │
│  └────────┬────────┘ └───────┬────────┘ └──────┬──────┘ │
│           │                  │                 │        │
│           └──────────────────┼─────────────────┘        │
│                              │                          │
│                    Windows WebView2 IPC                 │
│                              │                          │
│  ┌───────────────────────────┴───────────────────────┐  │
│  │                    Web UI Layer                    │  │
│  │  [Index.html]  [Styles.css]  [App.js]              │  │
│  │  - Reader Canvas  - Find Bar  - TOC Drawer        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Key Components

1. **Go Core Engine (`internal/app`, `internal/document`, `internal/markdown`, `internal/watcher`)**:
   - `Document`: Loads local Markdown files, validates UTF-8, extracts metadata.
   - `Markdown`: Goldmark parser + Chroma v2 syntax highlighter for code blocks + GFM extensions (tables, task lists, strikethroughs) + Heading ID slug generator for TOC anchors.
   - `Watcher`: `fsnotify` file system watcher with 100ms debouncing for automatic hot reload when open files are updated.
   - `Config`: JSON settings saved in `%APPDATA%\MDView\config.json`.

2. **Native WebView2 Integration (`internal/window`)**:
   - Uses `github.com/jchv/go-webview2` (pure Go Windows WebView2 binding via `syscall` / DLL imports, enabling CGO-free compilation).
   - Serves embedded HTML/CSS/JS frontend via `//go:embed`.

3. **Frontend UI Layer (`web/`)**:
   - Zero external frontend frameworks (Vanilla HTML/CSS/JS).
   - Theme switching (Light/Dark mode).
   - In-page Find-in-Document (`Ctrl+F`).
   - Collapsible Table of Contents outline (`Ctrl+Shift+T`).
   - Zoom scaling (`Ctrl++` / `Ctrl+-`).
   - Drag and Drop file opening.
