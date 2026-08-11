# AburMD MSIX Packaging Script
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Generating AburMD MSIX Package      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$BinDir = Join-Path $PSScriptRoot "..\bin"
$ExePath = Join-Path $BinDir "aburmd.exe"

if (!(Test-Path $ExePath)) {
    Write-Host "Building aburmd.exe binary first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "build-windows.ps1")
}

$PackageLayout = Join-Path $PSScriptRoot "..\bin\msix_layout"
if (Test-Path $PackageLayout) {
    Remove-Item -Recurse -Force $PackageLayout
}
New-Item -ItemType Directory -Path $PackageLayout | Out-Null
New-Item -ItemType Directory -Path (Join-Path $PackageLayout "assets") | Out-Null

Copy-Item $ExePath -Destination $PackageLayout
Copy-Item (Join-Path $PSScriptRoot "..\packaging\windows\Package.appxmanifest") -Destination $PackageLayout

# Create placeholder app icons for packaging
Write-Host "Generating package layout..." -ForegroundColor Yellow

$MsixPath = Join-Path $BinDir "AburMD-1.0.0-windows-x64.msix"

Write-Host "MSIX layout prepared successfully:" -ForegroundColor Green
Write-Host "  Layout Dir: $PackageLayout" -ForegroundColor White
Write-Host "  Package Destination: $MsixPath" -ForegroundColor White
Write-Host "To sign and generate final .msix, run MakeAppx.exe and SignTool.exe with your production certificate." -ForegroundColor Yellow
