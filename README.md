# AburMD

**AburMD** is a lightweight, fast, native-feeling Markdown document reader and editor for Windows and Linux, published by **AburMD Software**.

It allows you to double-click any `.md` or `.markdown` file and read it comfortably without launching heavy IDEs, browsers, or Electron applications.

---

## Key Features

- ⚡ **Instant Startup**: Native Go core and WebView2 / Tauri integration for near-instant launch times.
- 📖 **VIEW Mode (Default)**: Clean, high-fidelity GFM (GitHub Flavored Markdown) reading canvas with syntax highlighting for 200+ programming languages.
- ✏️ **EDIT Mode**: Switch active tabs to source editor mode with 1-click `[ Edit ]` or `Ctrl+S` saving.
- 🗂️ **Multi-Tab Interface**: Open multiple documents concurrently with tab shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`, `Ctrl+Shift+Tab`).
- 🎨 **Zinc Visual System**: Deep Dark (`#09090B`) and Light (`#FAFAFA`) Zinc neutral palettes paired with 8 selectable accent colors (Deep Orange, Amber, Red, Blue, Indigo, Violet, Green, Cyan).
- 🔄 **Automatic Hot Reload**: Refreshes open documents on disk modification while preventing accidental overwrite of unsaved edits.
- 🛡️ **100% Local & Private**: Completely offline, 0 telemetry, 0 tracking, 0 cloud requirements.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + T` | New Tab |
| `Ctrl + W` | Close Active Tab |
| `Ctrl + Tab` | Next Tab |
| `Ctrl + Shift + Tab` | Previous Tab |
| `Ctrl + S` | Save Active Document (in Edit mode) |
| `Ctrl + F` | Open Find Search Bar |
| `Ctrl + Shift + T` | Toggle Table of Contents Outline Sidebar |
| `Ctrl + O` | Open File Dialog |
| `Ctrl + +` / `Ctrl + =` | Zoom In |
| `Ctrl + -` | Zoom Out |
| `Ctrl + 0` | Reset Zoom to 100% |

---

## Building from Source

### Windows Build

```powershell
# Build standard Windows executable
go build -o aburmd.exe ./cmd/aburmd

# Build production GUI executable (bin/aburmd.exe)
.\scripts\build-windows.ps1

# Prepare MSIX package for Microsoft Store
.\scripts\package-windows.ps1
```

### Linux Build

```bash
# Build Linux executable
bash ./scripts/build-linux.sh

# Package AppImage
bash ./scripts/package-linux.sh
```

---

## License & Publisher

Published by **AburMD Software**. Released under the [MIT License](LICENSE).
Third-party notices available in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
