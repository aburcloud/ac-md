# MDView File Association & Registry Installation Script
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Installing MDView File Associations " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ExePath = Join-Path $PSScriptRoot "..\bin\mdview.exe"
if (!(Test-Path $ExePath)) {
    $ExePath = Join-Path $PSScriptRoot "..\mdview.exe"
}

if (!(Test-Path $ExePath)) {
    Write-Host "mdview.exe not found. Building executable first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "build.ps1")
}

$ExePath = (Get-Item $ExePath).FullName

Write-Host "Registering file associations for .md and .markdown files..." -ForegroundColor Yellow

$regPath = "HKCU:\Software\Classes"

# Register MDView ProgID
New-Item -Path "$regPath\MDView.Document\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$regPath\MDView.Document\shell\open\command" -Name "(default)" -Value "`"$ExePath`" `"%1`""
Set-ItemProperty -Path "$regPath\MDView.Document" -Name "(default)" -Value "Markdown Document"

# Associate .md extension
New-Item -Path "$regPath\.md" -Force | Out-Null
Set-ItemProperty -Path "$regPath\.md" -Name "(default)" -Value "MDView.Document"

# Associate .markdown extension
New-Item -Path "$regPath\.markdown" -Force | Out-Null
Set-ItemProperty -Path "$regPath\.markdown" -Name "(default)" -Value "MDView.Document"

# Add Right-Click Context Menu "Open with MDView" for all files
New-Item -Path "$regPath\*\shell\Open with MDView\command" -Force | Out-Null
Set-ItemProperty -Path "$regPath\*\shell\Open with MDView\command" -Name "(default)" -Value "`"$ExePath`" `"%1`""

Write-Host "MDView file associations installed successfully!" -ForegroundColor Green
Write-Host "You can now double-click any .md file or right-click and select 'Open with MDView'." -ForegroundColor White
