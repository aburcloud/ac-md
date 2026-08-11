package platform

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
)

func OpenFileDialog() string {
	if runtime.GOOS == "windows" {
		psScript := `[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Markdown Files (*.md;*.markdown)|*.md;*.markdown|All Files (*.*)|*.*'; $f.Title = 'Open Markdown Document'; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Host $f.FileName }`

		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

		out, err := cmd.Output()
		if err != nil {
			return ""
		}

		result := strings.TrimSpace(string(out))
		if result != "" {
			return filepath.Clean(result)
		}
		return ""
	}

	return ""
}

func SaveFileDialog(defaultName string) string {
	if runtime.GOOS == "windows" {
		if defaultName == "" {
			defaultName = "Untitled.md"
		}
		psScript := fmt.Sprintf(`[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $f = New-Object System.Windows.Forms.SaveFileDialog; $f.Filter = 'Markdown Files (*.md)|*.md|All Files (*.*)|*.*'; $f.FileName = '%s'; $f.Title = 'Save Markdown Document'; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Host $f.FileName }`, defaultName)

		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

		out, err := cmd.Output()
		if err != nil {
			return ""
		}

		result := strings.TrimSpace(string(out))
		if result != "" {
			return filepath.Clean(result)
		}
		return ""
	}

	return ""
}

func OpenFolderDialog() string {
	if runtime.GOOS == "windows" {
		psScript := `[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Select Workspace Folder'; $f.ShowNewFolderButton = $true; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Host $f.SelectedPath }`

		cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
		cmd.SysProcAttr = &
